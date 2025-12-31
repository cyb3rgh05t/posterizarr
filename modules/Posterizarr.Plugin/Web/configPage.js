(function () {
    const pluginId = "f62d8560-6123-4567-89ab-cdef12345678";

    document.querySelector('#PosterizarrConfigPage').addEventListener('pageshow', function () {
        const page = this;
        ApiClient.getPluginConfiguration(pluginId).then(function (config) {
            page.querySelector('#AssetFolderPath').value = config.AssetFolderPath || '';
        });
    });

    document.querySelector('#PosterizarrConfigForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const page = this.closest('.page');
        ApiClient.getPluginConfiguration(pluginId).then(function (config) {
            config.AssetFolderPath = page.querySelector('#AssetFolderPath').value;
            ApiClient.updatePluginConfiguration(pluginId, config).then(function (result) {
                Dashboard.processPluginConfigurationUpdateResult(result);
            });
        });
    });
})();