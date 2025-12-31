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
using System.Net.Http.Headers;
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
        LogDebug(">>> Starting Search for: '{0}' (ID: {1})", item.Name, item.Id);

        if (config == null || string.IsNullOrEmpty(config.AssetFolderPath))
        {
            _logger.LogWarning("[Posterizarr] ABORT: AssetFolderPath is empty.");
            return Enumerable.Empty<RemoteImageInfo>();
        }

        var results = new List<RemoteImageInfo>();
        foreach (var type in new[] { ImageType.Primary, ImageType.Backdrop })
        {
            var path = FindFile(item, config, type);
            if (!string.IsNullOrEmpty(path))
            {
                LogDebug("FOUND {0}: {1}", type, path);
                results.Add(new RemoteImageInfo { ProviderName = Name, Url = path, Type = type });
            }
        }
        return results;
    }

    private string? FindFile(BaseItem item, Configuration.PluginConfiguration config, ImageType type)
    {
        // 1. Library Mapping
        var internalName = item.GetAncestorIds()
            .Select(id => _libraryManager.GetItemById(id))
            .FirstOrDefault(p => p != null && p.ParentId != Guid.Empty && _libraryManager.GetItemById(p.ParentId)?.ParentId == Guid.Empty)?
            .Name ?? "Unknown";

        if (internalName == "Unknown" || internalName == "root")
        {
            internalName = item.GetAncestorIds()
                .Select(id => _libraryManager.GetItemById(id))
                .FirstOrDefault(p => p is CollectionFolder)?
                .Name ?? "Unknown";
        }

        // Fuzzy match for physical folder
        var libraryDir = Directory.GetDirectories(config.AssetFolderPath)
            .FirstOrDefault(d => string.Equals(Path.GetFileName(d).Replace(" ", ""), internalName.Replace(" ", ""), StringComparison.OrdinalIgnoreCase));

        if (libraryDir == null)
        {
            LogDebug("FAIL: No asset folder found matching library '{0}'", internalName);
            return null;
        }

        // 2. Folder Extraction
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
        if (!Directory.Exists(actualFolder))
        {
            LogDebug("FAIL: Path not found: {0}", actualFolder);
            return null;
        }

        // 3. Extension Hunt
        var filesInFolder = Directory.GetFiles(actualFolder);
        foreach (var ext in config.SupportedExtensions)
        {
            var target = fileNameBase + ext;
            var match = filesInFolder.FirstOrDefault(f => Path.GetFileName(f).Equals(target, StringComparison.OrdinalIgnoreCase));
            
            if (match != null) return match;

            if (type == ImageType.Backdrop)
            {
                var fanart = "fanart" + ext;
                var fanartMatch = filesInFolder.FirstOrDefault(f => Path.GetFileName(f).Equals(fanart, StringComparison.OrdinalIgnoreCase));
                if (fanartMatch != null) return fanartMatch;
            }
        }

        return null;
    }

    public Task<HttpResponseMessage> GetImageResponse(string url, CancellationToken cancellationToken)
    {
        LogDebug("GetImageResponse serving: {0}", url);

        try
        {
            if (File.Exists(url))
            {
                var stream = File.OpenRead(url);
                var response = new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                {
                    Content = new StreamContent(stream)
                };

                var ext = Path.GetExtension(url).ToLowerInvariant();
                string mimeType = ext switch { ".png" => "image/png", ".webp" => "image/webp", ".bmp" => "image/bmp", _ => "image/jpeg" };
                response.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
                
                return Task.FromResult(response);
            }
            
            _logger.LogError("[Posterizarr] File disappeared during serving: {0}", url);
            return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.NotFound));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Posterizarr] CRITICAL: Permission denied or IO error reading: {0}", url);
            return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.Forbidden));
        }
    }
}