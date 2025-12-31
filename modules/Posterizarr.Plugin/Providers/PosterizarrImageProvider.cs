using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.Movies;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Providers;
using MediaBrowser.Model.Entities;
using MediaBrowser.Model.Providers;
using Microsoft.Extensions.Logging;

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

    public bool Supports(BaseItem item) => item is Movie || item is Series || item is Season || item is Episode;
    public IEnumerable<ImageType> GetSupportedImages(BaseItem item) => new[] { ImageType.Primary, ImageType.Backdrop };

    public async Task<IEnumerable<RemoteImageInfo>> GetImages(BaseItem item, CancellationToken cancellationToken)
    {
        var config = Plugin.Instance?.Configuration;
        
        // This log will ALWAYS appear if the plugin is active and checked in library settings
        _logger.LogInformation("[Posterizarr] Entry point: Checking assets for '{0}' (Type: {1})", item.Name, item.GetType().Name);

        if (config == null || string.IsNullOrEmpty(config.AssetFolderPath))
        {
            _logger.LogWarning("[Posterizarr] Asset path is empty or config is null. Check plugin settings.");
            return Enumerable.Empty<RemoteImageInfo>();
        }

        var results = new List<RemoteImageInfo>();
        foreach (var type in new[] { ImageType.Primary, ImageType.Backdrop })
        {
            var path = FindFile(item, config, type);
            if (!string.IsNullOrEmpty(path))
            {
                _logger.LogInformation("[Posterizarr] MATCH FOUND: {0} for {1} at {2}", type, item.Name, path);
                results.Add(new RemoteImageInfo { ProviderName = Name, Url = path, Type = type });
            }
        }
        
        if (results.Count == 0)
            _logger.LogInformation("[Posterizarr] No assets found for '{0}' after full search.", item.Name);

        return results;
    }

    private string? FindFile(BaseItem item, Configuration.PluginConfiguration config, ImageType type)
    {
        // 1. Resolve Library Name
        var library = item.GetAncestorIds()
            .Select(id => _libraryManager.GetItemById(id))
            .FirstOrDefault(p => p is Folder && p.ParentId == Guid.Empty)?
            .Name ?? "Unknown";

        string subFolderSearch = "";
        string fileNameBase = "";

        // 2. Determine Search Parameters
        if (item is Movie m) { subFolderSearch = m.Name; fileNameBase = type == ImageType.Primary ? "poster" : "background"; }
        else if (item is Series s) { subFolderSearch = s.Name; fileNameBase = type == ImageType.Primary ? "poster" : "background"; }
        else if (item is Season season)
        {
            subFolderSearch = season.SeriesName;
            fileNameBase = type == ImageType.Primary ? $"season{season.IndexNumber ?? 0:D2}" : "background";
        }
        else if (item is Episode e)
        {
            if (type != ImageType.Primary) return null;
            subFolderSearch = e.SeriesName;
            fileNameBase = $"S{e.ParentIndexNumber ?? 0:D2}E{e.IndexNumber ?? 0:D2}";
        }

        // Clean folder name for search (remove colons which are illegal in folder names but common in titles)
        subFolderSearch = subFolderSearch.Replace(":", "").Trim();

        var libraryDir = Path.Combine(config.AssetFolderPath, library);
        if (!Directory.Exists(libraryDir))
        {
            _logger.LogWarning("[Posterizarr] Library directory not found: {0}", libraryDir);
            return null;
        }

        // 3. Fuzzy Folder Lookup
        // Looks for "Alien*" to find "Alien (1979) [imdb...]"
        var actualFolder = Directory.GetDirectories(libraryDir, subFolderSearch + "*").FirstOrDefault();
        if (actualFolder == null)
        {
            _logger.LogDebug("[Posterizarr] No folder found starting with '{0}' in {1}", subFolderSearch, libraryDir);
            return null;
        }

        // 4. Case-Insensitive File Check
        var filesInFolder = Directory.GetFiles(actualFolder);
        foreach (var ext in config.SupportedExtensions)
        {
            // Check for file (e.g., poster.jpg or Season01.jpg) regardless of case
            var targetFile = fileNameBase + ext;
            var match = filesInFolder.FirstOrDefault(f => Path.GetFileName(f).Equals(targetFile, StringComparison.OrdinalIgnoreCase));
            
            if (match != null) return match;

            // Backdrop fallback
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