(function () {
    const pluginId = "f62d8560-6123-4567-89ab-cdef12345678";

    function loadConfig(page) {
        Dashboard.showLoadingMsg();
        ApiClient.getPluginConfiguration(pluginId).then(function (config) {
            page.querySelector('#AssetFolderPath').value = config.AssetFolderPath || '';
            Dashboard.hideLoadingMsg();
        }).catch(function() {
            Dashboard.hideLoadingMsg();
            Dashboard.alert({
                message: "Failed to load configuration."
            });
        });
    }

    document.querySelector('#PosterizarrConfigPage').addEventListener('pageshow', function () {
        loadConfig(this);
    });

    document.querySelector('#PosterizarrConfigForm').addEventListener('submit', function (e) {
        e.preventDefault();
        Dashboard.showLoadingMsg();

        const form = this;
        ApiClient.getPluginConfiguration(pluginId).then(function (config) {
            config.AssetFolderPath = form.querySelector('#AssetFolderPath').value;

            ApiClient.updatePluginConfiguration(pluginId, config).then(function (result) {
                Dashboard.processPluginConfigurationUpdateResult(result);
            }).catch(function() {
                Dashboard.hideLoadingMsg();
                Dashboard.alert({
                    message: "Failed to save configuration."
                });
            });
        });
    });
})();