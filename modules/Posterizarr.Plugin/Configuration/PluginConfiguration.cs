using MediaBrowser.Model.Plugins;

namespace Posterizarr.Plugin.Configuration;

public class PluginConfiguration : BasePluginConfiguration
{
    public string AssetFolderPath { get; set; } = string.Empty;
    // Common extensions to check
    public string[] SupportedExtensions { get; set; } = { ".jpg", ".jpeg", ".png", ".webp", ".bmp" };
}