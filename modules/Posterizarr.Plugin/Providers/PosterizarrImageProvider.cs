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
    public int Order => -10; 

    private void LogDebug(string message, params object[] args)
    {
        if (Plugin.Instance?.Configuration?.EnableDebugMode == true)
        {
            _logger.LogInformation("[Posterizarr DEBUG] " + message, args);
        }
    }

    public bool Supports(BaseItem item) => item is Movie || item is Series || item is Season || item is Episode;
    public IEnumerable<ImageType> GetSupportedImages(BaseItem item) => new[] { ImageType.Primary, ImageType.Backdrop };

    public async Task<IEnumerable<RemoteImageInfo>> GetImages(BaseItem item, CancellationToken cancellationToken)
    {
        var config = Plugin.Instance?.Configuration;
        LogDebug("--- Starting Asset Search for: '{0}' ---", item.Name);

        if (config == null || string.IsNullOrEmpty(config.AssetFolderPath))
        {
            _logger.LogWarning("[Posterizarr] Configuration missing or AssetFolderPath empty.");
            return Enumerable.Empty<RemoteImageInfo>();
        }

        var results = new List<RemoteImageInfo>();
        foreach (var type in new[] { ImageType.Primary, ImageType.Backdrop })
        {
            var path = FindFile(item, config, type);
            if (!string.IsNullOrEmpty(path))
            {
                LogDebug("SUCCESS: Found {0} at {1}", type, path);
                results.Add(new RemoteImageInfo { ProviderName = Name, Url = path, Type = type });
            }
        }
        return results;
    }

    private string? FindFile(BaseItem item, Configuration.PluginConfiguration config, ImageType type)
    {
        // 1. Resolve Library Name (the internal name Jellyfin uses)
        var libraryName = item.GetAncestorIds()
            .Select(id => _libraryManager.GetItemById(id))
            .FirstOrDefault(p => p != null && p.ParentId != Guid.Empty && _libraryManager.GetItemById(p.ParentId)?.ParentId == Guid.Empty)?
            .Name ?? "Unknown";

        if (libraryName == "Unknown" || libraryName == "root")
        {
            libraryName = item.GetAncestorIds()
                .Select(id => _libraryManager.GetItemById(id))
                .FirstOrDefault(p => p is CollectionFolder)?
                .Name ?? "Unknown";
        }
        
        LogDebug("Internal Library Name: {0}", libraryName);

        // 2. Resolve Library Folder in /assets (Fuzzy Match for spaces/case)
        if (!Directory.Exists(config.AssetFolderPath))
        {
            LogDebug("FAILURE: Root Asset Folder does not exist: {0}", config.AssetFolderPath);
            return null;
        }

        var libraryDir = Directory.GetDirectories(config.AssetFolderPath)
            .FirstOrDefault(d => string.Equals(Path.GetFileName(d).Replace(" ", ""), libraryName.Replace(" ", ""), StringComparison.OrdinalIgnoreCase));

        if (libraryDir == null)
        {
            LogDebug("FAILURE: Could not find a folder in {0} matching library '{1}'", config.AssetFolderPath, libraryName);
            return null;
        }
        
        LogDebug("Resolved Physical Library Path: {0}", libraryDir);

        // 3. Resolve Media Folder Name
        string subFolder = "";
        string fileNameBase = "";

        if (item is Movie || item is Series)
        {
            var directoryPath = item is Movie ? Path.GetDirectoryName(item.Path) : item.Path;
            subFolder = Path.GetFileName(directoryPath) ?? "";
            fileNameBase = type == ImageType.Primary ? "poster" : "background";
        }
        else if (item is Season season)
        {
            subFolder = Path.GetFileName(season.Series.Path) ?? "";
            fileNameBase = type == ImageType.Primary ? $"season{season.IndexNumber ?? 0:D2}" : "background";
        }
        else if (item is Episode e)
        {
            if (type != ImageType.Primary) return null; 
            subFolder = Path.GetFileName(e.Series.Path) ?? "";
            fileNameBase = $"S{e.ParentIndexNumber ?? 0:D2}E{e.IndexNumber ?? 0:D2}";
        }

        var actualFolder = Path.Combine(libraryDir, subFolder);
        LogDebug("Constructed Item Path: {0}", actualFolder);

        if (!Directory.Exists(actualFolder))
        {
            LogDebug("FAILURE: Item folder not found: {0}", actualFolder);
            return null;
        }

        // 4. File Lookup
        var filesInFolder = Directory.GetFiles(actualFolder);
        foreach (var ext in config.SupportedExtensions)
        {
            var targetFile = fileNameBase + ext;
            var match = filesInFolder.FirstOrDefault(f => Path.GetFileName(f).Equals(targetFile, StringComparison.OrdinalIgnoreCase));
            if (match != null) return match;

            if (type == ImageType.Backdrop)
            {
                var fanartMatch = filesInFolder.FirstOrDefault(f => Path.GetFileName(f).Equals("fanart" + ext, StringComparison.OrdinalIgnoreCase));
                if (fanartMatch != null) return fanartMatch;
            }
        }

        return null;
    }

    public Task<HttpResponseMessage> GetImageResponse(string url, CancellationToken cancellationToken) => throw new NotImplementedException();
}