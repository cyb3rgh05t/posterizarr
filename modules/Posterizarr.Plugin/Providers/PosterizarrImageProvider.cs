using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.Movies;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library; // Added for ILibraryManager if needed
using MediaBrowser.Controller.Providers;
using MediaBrowser.Model.Entities;
using MediaBrowser.Model.Providers;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Posterizarr.Plugin.Providers;

public class PosterizarrImageProvider : IRemoteImageProvider, IHasOrder
{
    public string Name => "Posterizarr Local Middleware";
    public int Order => -10; // Highest priority to override internet providers

    public async Task<IEnumerable<RemoteImageInfo>> GetImages(BaseItem item, CancellationToken cancellationToken)
    {
        var config = Plugin.Instance?.Configuration;
        if (config == null || string.IsNullOrEmpty(config.AssetFolderPath))
            return Enumerable.Empty<RemoteImageInfo>();

        var results = new List<RemoteImageInfo>();

        // Check for Primary (Poster / Titlecard)
        var primaryPath = FindFile(item, config, ImageType.Primary);
        if (!string.IsNullOrEmpty(primaryPath))
        {
            results.Add(new RemoteImageInfo { ProviderName = Name, Url = primaryPath, Type = ImageType.Primary });
        }

        // Check for Backdrop (Background)
        var backdropPath = FindFile(item, config, ImageType.Backdrop);
        if (!string.IsNullOrEmpty(backdropPath))
        {
            results.Add(new RemoteImageInfo { ProviderName = Name, Url = backdropPath, Type = ImageType.Backdrop });
        }

        return results;
    }

    private string? FindFile(BaseItem item, Configuration.PluginConfiguration config, ImageType type)
    {
        // Robust Library Name Lookup: Find the top-level collection folder name
        var library = item.GetAncestorIds()
            .Select(id => item.GetLibraryManager().GetItemById(id))
            .FirstOrDefault(p => p is Folder && p.ParentId == Guid.Empty)?
            .Name ?? "Unknown";

        string subFolder = "";
        string fileNameBase = "";

        if (item is Movie m) 
        { 
            subFolder = m.Name; 
            fileNameBase = (type == ImageType.Primary) ? "poster" : "background"; 
        }
        else if (item is Series s) 
        { 
            subFolder = s.Name; 
            fileNameBase = (type == ImageType.Primary) ? "poster" : "background"; 
        }
        else if (item is Episode e)
        {
            if (type != ImageType.Primary) return null; 
            subFolder = e.SeriesName;
            fileNameBase = $"S{(e.ParentIndexNumber ?? 0):D2}E{(e.IndexNumber ?? 0):D2}";
        }

        if (string.IsNullOrEmpty(subFolder)) return null;

        var directory = Path.Combine(config.AssetFolderPath, library, subFolder);
        if (!Directory.Exists(directory)) return null;

        // Iterative search for extensions without hardcoding
        foreach (var ext in config.SupportedExtensions)
        {
            var fullPath = Path.Combine(directory, fileNameBase + ext);
            if (File.Exists(fullPath)) return fullPath;
            
            // Fallback check for alternate backdrop naming
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
    
    // This is required for IRemoteImageProvider but not used for local file serving
    public Task<HttpResponseInfo> GetImageResponse(string url, CancellationToken cancellationToken) 
        => throw new NotImplementedException();
}