using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.Movies;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Providers;
using MediaBrowser.Model.Entities;
using MediaBrowser.Model.Providers;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace Posterizarr.Plugin.Providers;

public class PosterizarrImageProvider : IRemoteImageProvider, IHasOrder
{
    private readonly ILibraryManager _libraryManager;
    private readonly ILogger<PosterizarrImageProvider> _logger;

    public PosterizarrImageProvider(ILibraryManager libraryManager, ILogger<PosterizarrImageProvider> logger)
    {
        _libraryManager = libraryManager;
        _logger = logger;
    }

    public string Name => "Posterizarr Local Middleware";
    
    // Runs before internet scrapers to prioritize local assets
    public int Order => -10; 

    public bool Supports(BaseItem item) => item is Movie || item is Series || item is Season || item is Episode;
    
    public IEnumerable<ImageType> GetSupportedImages(BaseItem item) => new[] { ImageType.Primary, ImageType.Backdrop };

    public async Task<IEnumerable<RemoteImageInfo>> GetImages(BaseItem item, CancellationToken cancellationToken)
    {
        var config = Plugin.Instance?.Configuration;
        
        _logger.LogInformation("[Posterizarr] Checking assets for '{0}' (Type: {1})", item.Name, item.GetType().Name);

        if (config == null || string.IsNullOrEmpty(config.AssetFolderPath))
        {
            _logger.LogWarning("[Posterizarr] Asset path is empty! Set it in the plugin configuration.");
            return Enumerable.Empty<RemoteImageInfo>();
        }

        var results = new List<RemoteImageInfo>();

        // Lookup Primary and Backdrop images
        foreach (var type in new[] { ImageType.Primary, ImageType.Backdrop })
        {
            var path = FindFile(item, config, type);
            if (!string.IsNullOrEmpty(path))
            {
                _logger.LogInformation("[Posterizarr] MATCH FOUND: {0} for {1} at {2}", type, item.Name, path);
                results.Add(new RemoteImageInfo 
                { 
                    ProviderName = Name, 
                    Url = path, 
                    Type = type 
                    // No checksum added here to allow Jellyfin to detect changes on disk
                });
            }
        }

        if (results.Count == 0)
            _logger.LogInformation("[Posterizarr] No assets found for '{0}'", item.Name);

        return results;
    }

    private string? FindFile(BaseItem item, Configuration.PluginConfiguration config, ImageType type)
    {
        // 1. Resolve Library Name correctly (avoids /root issue)
        // We find the ancestor that is a direct child of the hidden system root
        var library = item.GetAncestorIds()
            .Select(id => _libraryManager.GetItemById(id))
            .FirstOrDefault(p => p != null && p.ParentId != Guid.Empty && _libraryManager.GetItemById(p.ParentId)?.ParentId == Guid.Empty)?
            .Name ?? "Unknown";

        // Fallback for different Jellyfin versions
        if (library == "Unknown" || library == "root")
        {
            library = item.GetAncestorIds()
                .Select(id => _libraryManager.GetItemById(id))
                .FirstOrDefault(p => p is CollectionFolder)?
                .Name ?? "Unknown";
        }

        // 2. Resolve the exact Folder Name from the media disk
        string subFolder = "";
        string fileNameBase = "";

        if (item is Movie || item is Series)
        {
            // Gets the exact folder name on the drive (e.g., "Alien (1979) [imdb-tt0078748]")
            var directoryPath = item is Movie ? Path.GetDirectoryName(item.Path) : item.Path;
            subFolder = Path.GetFileName(directoryPath) ?? "";
            fileNameBase = type == ImageType.Primary ? "poster" : "background";
        }
        else if (item is Season season)
        {
            // Seasons look inside the parent Series folder
            subFolder = Path.GetFileName(season.Series.Path) ?? "";
            fileNameBase = type == ImageType.Primary ? $"season{season.IndexNumber ?? 0:D2}" : "background";
        }
        else if (item is Episode e)
        {
            if (type != ImageType.Primary) return null; 
            subFolder = Path.GetFileName(e.Series.Path) ?? "";
            fileNameBase = $"S{e.ParentIndexNumber ?? 0:D2}E{e.IndexNumber ?? 0:D2}";
        }

        if (string.IsNullOrEmpty(subFolder)) return null;

        // 3. Construct the exact asset path
        var actualFolder = Path.Combine(config.AssetFolderPath, library, subFolder);
        
        if (!Directory.Exists(actualFolder))
        {
            // Log as debug to avoid cluttering main logs if many items lack assets
            _logger.LogDebug("[Posterizarr] Folder not found in assets: {0}", actualFolder);
            return null;
        }

        // 4. Case-insensitive File Lookup within the folder
        var filesInFolder = Directory.GetFiles(actualFolder);
        foreach (var ext in config.SupportedExtensions)
        {
            var targetFile = fileNameBase + ext;
            var match = filesInFolder.FirstOrDefault(f => Path.GetFileName(f).Equals(targetFile, StringComparison.OrdinalIgnoreCase));
            
            if (match != null) return match;

            // Backdrop fallback to 'fanart'
            if (type == ImageType.Backdrop)
            {
                var fanartMatch = filesInFolder.FirstOrDefault(f => Path.GetFileName(f).Equals("fanart" + ext, StringComparison.OrdinalIgnoreCase));
                if (fanartMatch != null) return fanartMatch;
            }
        }

        return null;
    }

    public Task<HttpResponseMessage> GetImageResponse(string url, CancellationToken cancellationToken) 
    {
        // Not implemented for local file paths
        throw new NotImplementedException();
    }
}