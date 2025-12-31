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

    private void LogDebug(string message, params object[] args)
    {
        if (Plugin.Instance?.Configuration?.EnableDebugMode == true)
            _logger.LogInformation("[Posterizarr] " + message, args);
    }

    public bool Supports(BaseItem item) => item is Movie || item is Series || item is Season || item is Episode;
    public IEnumerable<ImageType> GetSupportedImages(BaseItem item) => new[] { ImageType.Primary, ImageType.Backdrop };

    public async Task<IEnumerable<RemoteImageInfo>> GetImages(BaseItem item, CancellationToken cancellationToken)
    {
        var config = Plugin.Instance?.Configuration;
        if (config == null || string.IsNullOrEmpty(config.AssetFolderPath)) return Enumerable.Empty<RemoteImageInfo>();

        var results = new List<RemoteImageInfo>();
        foreach (var type in new[] { ImageType.Primary, ImageType.Backdrop })
        {
            var path = FindFile(item, config, type);
            if (!string.IsNullOrEmpty(path))
            {
                results.Add(new RemoteImageInfo { ProviderName = Name, Url = path, Type = type });
                LogDebug("Found {Type} for {Name}: {Path}", type, item.Name, path);
            }
        }
        return results;
    }

    private string? FindFile(BaseItem item, Configuration.PluginConfiguration config, ImageType type)
    {
        var library = item.GetAncestorIds()
            .Select(id => _libraryManager.GetItemById(id))
            .FirstOrDefault(p => p is Folder && p.ParentId == Guid.Empty)?
            .Name ?? "Unknown";

        string subFolder = "";
        string fileNameBase = "";

        if (item is Movie m) { subFolder = m.Name; fileNameBase = type == ImageType.Primary ? "poster" : "background"; }
        else if (item is Series s) { subFolder = s.Name; fileNameBase = type == ImageType.Primary ? "poster" : "background"; }
        else if (item is Season season)
        {
            subFolder = season.SeriesName;
            fileNameBase = type == ImageType.Primary ? $"season{season.IndexNumber ?? 0:D2}" : "background";
        }
        else if (item is Episode e)
        {
            if (type != ImageType.Primary) return null;
            subFolder = e.SeriesName;
            fileNameBase = $"S{e.ParentIndexNumber ?? 0:D2}E{e.IndexNumber ?? 0:D2}";
        }

        if (string.IsNullOrEmpty(subFolder)) return null;
        var directory = Path.Combine(config.AssetFolderPath, library, subFolder);
        if (!Directory.Exists(directory)) return null;

        foreach (var ext in config.SupportedExtensions)
        {
            var fullPath = Path.Combine(directory, fileNameBase + ext);
            if (File.Exists(fullPath)) return fullPath;
            if (type == ImageType.Backdrop && File.Exists(Path.Combine(directory, "fanart" + ext))) 
                return Path.Combine(directory, "fanart" + ext);
        }
        return null;
    }

    public Task<HttpResponseMessage> GetImageResponse(string url, CancellationToken cancellationToken) => throw new NotImplementedException();
}