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
        // Always log to Information so it's visible in the standard Jellyfin log 
        // if EnableDebugMode is checked in your plugin config.
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
            _logger.LogWarning("[Posterizarr] Configuration is missing or AssetFolderPath is empty.");
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

        if (results.Count == 0)
            LogDebug("FINISHED: No local assets found for '{0}'", item.Name);

        return results;
    }

    private string? FindFile(BaseItem item, Configuration.PluginConfiguration config, ImageType type)
    {
        // 1. Resolve Library Name
        var library = item.GetAncestorIds()
            .Select(id => _libraryManager.GetItemById(id))
            .FirstOrDefault(p => p != null && p.ParentId != Guid.Empty && _libraryManager.GetItemById(p.ParentId)?.ParentId == Guid.Empty)?
            .Name ?? "Unknown";

        if (library == "Unknown" || library == "root")
        {
            library = item.GetAncestorIds()
                .Select(id => _libraryManager.GetItemById(id))
                .FirstOrDefault(p => p is CollectionFolder)?
                .Name ?? "Unknown";
        }
        
        LogDebug("Resolved Library: {0}", library);

        // 2. Resolve Exact Media Folder Name
        string subFolder = "";
        string fileNameBase = "";

        if (item is Movie || item is Series)
        {
            var directoryPath = item is Movie ? Path.GetDirectoryName(item.Path) : item.Path;
            subFolder = Path.GetFileName(directoryPath) ?? "";
            fileNameBase = type == ImageType.Primary ? "poster" : "background";
            LogDebug("Detected Media Path: {0} | Extracted Folder Name: {1}", item.Path, subFolder);
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

        if (string.IsNullOrEmpty(subFolder))
        {
            LogDebug("FAILURE: Could not extract subfolder name for item {0}", item.Name);
            return null;
        }

        // 3. Path Construction
        var libraryDir = Path.Combine(config.AssetFolderPath, library);
        var actualFolder = Path.Combine(libraryDir, subFolder);

        LogDebug("Constructed Target Path: {0}", actualFolder);

        if (!Directory.Exists(libraryDir))
        {
            LogDebug("FAILURE: Root Library directory does not exist: {0}", libraryDir);
            return null;
        }

        if (!Directory.Exists(actualFolder))
        {
            LogDebug("FAILURE: Item folder does not exist in assets: {0}", actualFolder);
            return null;
        }

        // 4. File Content Check
        var filesInFolder = Directory.GetFiles(actualFolder);
        LogDebug("Files found in folder ({0}): {1}", actualFolder, string.Join(", ", filesInFolder.Select(Path.GetFileName)));

        foreach (var ext in config.SupportedExtensions)
        {
            var targetFile = fileNameBase + ext;
            LogDebug("Checking for file: {0}", targetFile);

            var match = filesInFolder.FirstOrDefault(f => Path.GetFileName(f).Equals(targetFile, StringComparison.OrdinalIgnoreCase));
            if (match != null) return match;

            if (type == ImageType.Backdrop)
            {
                var fanartMatch = filesInFolder.FirstOrDefault(f => Path.GetFileName(f).Equals("fanart" + ext, StringComparison.OrdinalIgnoreCase));
                if (fanartMatch != null) return fanartMatch;
            }
        }

        LogDebug("FAILURE: No matching file found for {0} with extensions {1}", fileNameBase, string.Join("|", config.SupportedExtensions));
        return null;
    }

    public Task<HttpResponseMessage> GetImageResponse(string url, CancellationToken cancellationToken) => throw new NotImplementedException();
}