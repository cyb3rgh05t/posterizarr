using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using Posterizarr.Plugin.Configuration;

namespace Posterizarr.Plugin;

public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    public override string Name => "Posterizarr";
    public override Guid Id => Guid.Parse("f62d8560-6123-4567-89ab-cdef12345678");
    public override string Description => "Maps local assets to library items as posters, backgrounds, or titlecards.";

    public static Plugin? Instance { get; private set; }

    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        : base(applicationPaths, xmlSerializer)
    {
        Instance = this;
    }

    public IEnumerable<PluginPageInfo> GetPages()
    {
        return new[]
        {
            new PluginPageInfo
            {
                Name = "Posterizarr",
                // Assuming your folder structure is Web/configPage.html
                EmbeddedResourcePath = string.Format("{0}.Web.configPage.html", GetType().Namespace)
            }
        };
    }
}