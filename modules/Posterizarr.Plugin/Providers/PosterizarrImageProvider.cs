using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.Movies;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Providers;
using MediaBrowser.Model.Entities;
using MediaBrowser.Model.Providers;
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

    // Dependency injection of the Library Manager to resolve root collections
    public PosterizarrImageProvider(ILibraryManager libraryManager)
    {
        _libraryManager = libraryManager;
    }

    public string Name => "Posterizarr Local Middleware";
    
    // Ensures this provider runs before internet-based scrapers
    public int Order => -10; 

    public async Task<IEnumerable<RemoteImageInfo>> GetImages(BaseItem item, CancellationToken cancellationToken)
    {
        var config = Plugin.Instance?.Configuration;
        if (config == null || string.IsNullOrEmpty(config.AssetFolderPath))
            return Enumerable.Empty<RemoteImageInfo>();

        var results = new List<RemoteImageInfo>();

        // Lookup Primary Image (Poster or Title Card)
        var primaryPath = FindFile(item, config, ImageType.Primary);
        if (!string.IsNullOrEmpty(primaryPath))
        {
            results.Add(new RemoteImageInfo 
            { 
                ProviderName = Name, 
                Url = primaryPath, 
                Type = ImageType.Primary 
            });
        }

        // Lookup Backdrop Image (Background)
        var backdropPath = FindFile(item, config, ImageType.Backdrop);
        if (!string.IsNullOrEmpty(backdropPath))
        {
            results.Add(new RemoteImageInfo 
            { 
                ProviderName = Name, 
                Url = backdropPath, 
                Type = ImageType.Backdrop 
            });
        }

        return results;
    }

    private string? FindFile(BaseItem item, Configuration.PluginConfiguration config, ImageType type)
    {
        // Resolves the Library name by finding the top-level folder (Collection)
        var library = item.GetAncestorIds()
            .Select(id => _libraryManager.GetItemById(id))
            .FirstOrDefault(p => p is Folder && p.ParentId == Guid.Empty)?
            .Name ?? "Unknown";

        string subFolder = "";
        string fileNameBase = "";

        if (item is Movie m) 
        { 
            subFolder = m.Name; 
            fileNameBase = type == ImageType.Primary ? "poster" : "background"; 
        }
        else if (item is Series s) 
        { 
            subFolder = s.Name; 
            fileNameBase = type == ImageType.Primary ? "poster" : "background"; 
        }
        else if (item is Episode e)
        {
            // Middleware only provides Primary (Title Card) for episodes
            if (type != ImageType.Primary) return null; 
            
            subFolder = e.SeriesName;
            // Cleaned parentheses for IDE0047
            fileNameBase = $"S{e.ParentIndexNumber ?? 0:D2}E{e.IndexNumber ?? 0:D2}";
        }

        if (string.IsNullOrEmpty(subFolder)) return null;

        var directory = Path.Combine(config.AssetFolderPath, library, subFolder);
        if (!Directory.Exists(directory)) return null;

        // Check each supported extension from the plugin configuration
        foreach (var ext in config.SupportedExtensions)
        {
            var fullPath = Path.Combine(directory, fileNameBase + ext);
            if (File.Exists(fullPath)) return fullPath;
            
            // Allow "fanart" as an alias for backdrops
            if (type == ImageType.Backdrop)
            {
                var fanartPath = Path.Combine(directory, "fanart" + ext);
                if (File.Exists(fanartPath)) return fanartPath;
            }
        }

        return null;
    }

    public bool Supports(BaseItem item) => item is Movie || item is Series || item is Episode;
    
    public IEnumerable<ImageType> GetSupportedImages(BaseItem item) => new[] { ImageType.Primary, ImageType.Backdrop };

    public Task<HttpResponseMessage> GetImageResponse(string url, CancellationToken cancellationToken) 
    {
        // Not implemented because we return local file paths (Url) instead of remote URLs
        throw new NotImplementedException();
    }
}