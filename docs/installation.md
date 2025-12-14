1.  **Installation**

    - Docker: `docker-compose up -d` (using provided docker-compose.yml)
    - Manual: Clone repo and follow [Manual Installation guide](walkthrough.md)

2.  **Required API Keys**

    - Get TMDB API Token from [TMDB](https://www.themoviedb.org/settings/api)
    - Get Fanart API Key from [Fanart.tv](https://fanart.tv/get-an-api-key)
    - Get TVDB API Key from [TVDB](https://thetvdb.com/api-information/signup)
    - Review the [requirements](requirements.md) section for required software/plugins

3.  **Basic Configuration**

    - Copy `config.example.json` to `config.json` -> [Configuration](configuration.md)
    - Add your API keys
    - Set your media server details (Plex/Jellyfin/Emby)
    - Configure asset paths

4.  **First Run**

    ```bash
    # Docker
    docker exec -it posterizarr pwsh /app/Posterizarr.ps1 -Testing

    # Windows (as Admin) & Linux
    ./Posterizarr.ps1 -Testing
    ```

5.  **Access Web UI**
    - Open `http://localhost:8000` in your browser
    - Default credentials: none required

For detailed setup instructions, see the [full walkthrough](walkthrough.md).
