1. Open `config.example.json` located in the script directory.
2. Update the following variables with your API keys and preferences [my personal config](https://github.com/fscorrupt/Posterizarr/blob/main/MyPersonalConfig.json):

    #### WebUI

    - `basicAuthEnabled`: When set to `true`, the UI requires a username and password for access. (Default: `false`)
    - `basicAuthUsername`: The username for UI authentication. (Default: `admin`)
    - `basicAuthPassword`: The password for UI authentication. (Default: `posterizarr`)

    #### ApiPart

    - `tvdbapi`: Your TVDB Project API key.
        - If you are a TVDB subscriber, you can append your PIN to the end of your API key in the format `YourApiKey#YourPin`. (It is important to include a `#` between the API key and the PIN.)
    - `tmdbtoken`: Your TMDB API Read Access Token.
    - `FanartTvAPIKey`: Your Fanart personal API key.
    - `PlexToken`: Your Plex token (Leave empty if not applicable).
    - `JellyfinAPIKey`: Your Jellyfin API key. (You can create an API key from inside Jellyfin at Settings > Advanced > Api Keys.)
    - `EmbyAPIKey`: Your Emby API key. (You can create an API key from inside Emby at Settings > Advanced > Api Keys.)
    - `FavProvider`: Set your preferred provider (default is `tmdb`).

        - possible values are:

        - `tmdb` (recommended)
        - `fanart`
        - `tvdb`
        - `plex` (Not recommended)
            - if you prefer textless, do not set plex as fav provider as i cannot query if it has text or not.
            - that beeing said, plex should act as last resort like IMDB does for Movies and not as fav provider.

        [Search order in script](searchorder.md)

    - `WidthHeightFilter`: If set to `true`, an additional resolution filter will be applied to Posters/Backgrounds (TMDB and TVDB) and Titlecards (only on TMDB) searches.
    - `PosterMinWidth`: Minimum poster width filter—greater than or equal to: `2000` (default value)
    - `PosterMinHeight`: Minimum poster height filter—greater than or equal to: `3000` (default value)
    - `BgTcMinWidth`: Minimum background/titlecard width filter—greater than or equal to: `3840` (default value)
    - `BgTcMinHeight`: Minimum background/titlecard height filter—greater than or equal to: `2160` (default value)
    - `tmdb_vote_sorting`: Picture sorting via TMDB api, either by `vote_average`, `vote_count` or by `primary` (Default value is: `vote_average`).
        - `primary` = default tmdb view (like on the website)
    - `PreferredLanguageOrder`: Specify language preferences. Default is `xx,en,de` (`xx` is Textless). Example configurations can be found in the config file. 2-digit language codes can be found here: [ISO 3166-1 Lang Codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).
        - If you set it to `xx` you tell the script it should only search for textless, posters with text will be skipped.
    - `PreferredSeasonLanguageOrder`: Specify language preferences for seasons. Default is `xx,en,de` (`xx` is Textless). Example configurations can be found in the config file. 2-digit language codes can be found here: [ISO 3166-1 Lang Codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).
    - `PreferredBackgroundLanguageOrder`: Specify language preferences for backgrounds. Default is `PleaseFillMe` ( It will take your poster lang order / `xx` is Textless). Example configurations can be found in the config file. 2-digit language codes can be found here: [ISO 3166-1 Lang Codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).

        - If you set it to `xx` you tell the script it should only search for textless, posters with text will be skipped.
    - `PreferredTCLanguageOrder`: Specify language preferences for TCs. Default is `PleaseFillMe` ( It will take your poster lang order / `xx` is Textless). Example configurations can be found in the config file. 2-digit language codes can be found here: [ISO 3166-1 Lang Codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).

        - If you set it to `xx` you tell the script it should only search for textless, posters with text will be skipped.

    #### PlexPart

    - `LibstoExclude`: Libraries, by name, to exclude from processing.
    - `PlexUrl`: Plex server URL (i.e. "http://192.168.1.1:32400" or "http://myplexserver.com:32400").
    - `UsePlex`: If set to `true`, you tell the script to use a Plex Server (Default value is: `true`)
    - `UploadExistingAssets`: If set to `true`, the script will check local assets and upload them to Plex, but only if Plex does not already have EXIF data from Posterizarr, Kometa, or TCM for the artwork being uploaded.


    #### JellyfinPart

    - `LibstoExclude`: Libraries, by local folder name, to exclude from processing.
    - `JellyfinUrl`: Jellyfin server URL (i.e. "http://192.168.1.1:8096" or "http://myplexserver.com:8096").
    - `UseJellyfin`: If set to `true`, you tell the script to use a Jellyfin Server (Default value is: `false`)
        - Also have a look at the hint: [Jellyfin CSS](platformandtools.md#jellyfin)
    - `UploadExistingAssets`: If set to `true`, the script will check local assets and upload them to Jellyfin, but only if Jellyfin does not already have EXIF data from Posterizarr, Kometa, or TCM for the artwork being uploaded.
    - `ReplaceThumbwithBackdrop`: If set to `true` (Default value is: false), the script will replace the `Thumb` picture with the `backdrop` image. This will only occur if `BackgroundPosters` is also set to `true`.

    #### EmbyPart

    - `LibstoExclude`: Libraries, by local folder name, to exclude from processing.
    - `EmbyUrl`: Emby server URL (i.e. "http://192.168.1.1:8096/emby" or "http://myplexserver.com:8096/emby").
    - `UseEmby`: If set to `true`, you tell the script to use a Emby Server (Default value is: `false`)
    - `UploadExistingAssets`: If set to `true`, the script will check local assets and upload them to Emby, but only if Emby does not already have EXIF data from Posterizarr, Kometa, or TCM for the artwork being uploaded.
    - `ReplaceThumbwithBackdrop`: If set to `true` (Default value is: false), the script will replace the `Thumb` picture with the `backdrop` image. This will only occur if `BackgroundPosters` is also set to `true`.

    #### Notification

    - `SendNotification`: Set to `true` if you want to send notifications via discord or apprise, else `false`.
    - `AppriseUrl`: **Only possible on Docker** -Url for apprise provider -> [See Docs](https://github.com/caronc/apprise/wiki).
    - `Discord`: Discord Webhook Url.
    - `DiscordUserName`: Username for the discord webhook, default is `Posterizarr`
    - `UptimeKumaUrl`: Uptime-Kuma Webhook Url.
    - `UseUptimeKuma`: Set to `true` if you want to send webhook to Uptime-Kuma.

    #### PrerequisitePart

    - `AssetPath`: Path to store generated posters.
    - `BackupPath`: Path to store/download Plex posters when using the [backup switch](modes.md#backup-mode).
    - `ManualAssetPath`: If assets are placed in this directory with the **exact** [naming convention](namingconvention.md#manual-assets-naming), they will be preferred. (it has to follow the same naming convention as you have in `/assets`)
    - `SkipAddText`: If set to `true`, Posterizarr will skip adding text to the poster if it is flagged as a `Poster with text` by the provider.
    - `SkipAddTextAndOverlay`: If set to `true`, Posterizarr will skip adding text/overlay to the poster if it is flagged as a `Poster with text` by the provider.
    - `FollowSymlink`: If set to `true`, Posterizarr will follow symbolic links in the specified directories during hashtable creation, allowing it to process files and folders pointed to by the symlinks. This is useful if your assets are organized with symlinks instead of duplicating files.
    - `PlexUpload`: If set to `true`, Posterizarr will directly upload the artwork to Plex (handy if you do not use Kometa).
    - `ForceRunningDeletion`: If set to `true`, Posterizarr will automatically delete the Running File.
        - **Warning:** This may result in multiple concurrent runs sharing the same temporary directory, potentially causing image artifacts or unexpected behavior during processing.
    - `AutoUpdatePosterizarr`: If set to `true`, Posterizarr will update itself to latest version. (Only for non docker systems).
    - `show_skipped`: If set to `true`, verbose logging of already created assets will be displayed; otherwise, they will be silently skipped - On large libraries, this may appear as if the script is hanging.
    - `magickinstalllocation`: The path to the ImageMagick installation where `magick.exe` is located. (If you prefer using a portable version, leave the value as `"./magick"`.)
        - The container manages this automatically, so you can leave the default value in the configuration.
    - `maxLogs`: Number of Log folders you want to keep in `RotatedLogs` Folder (Log History).
    - `logLevel`: Sets the verbosity of logging. 1 logs Warning/Error messages. Default is 2 which logs Info/Warning/Error messages. 3 captures Info/Warning/Error/Debug messages and is the most verbose.
    - `font`: Font file name.
    - `RTLfont`: RTL Font file name.
    - `backgroundfont`: Background font file name.
    - `overlayfile`: Overlay file name.
    - `seasonoverlayfile`: Season overlay file name.
    - `backgroundoverlayfile`: Background overlay file name.
    - `titlecardoverlayfile` : Title Card overlay file name.
    - `poster4k`: 4K Poster overlay file name. (overlay has to match the Poster dimensions 2000x3000)
    - `Poster1080p` : 1080p Poster overlay file name. (overlay has to match the Poster dimensions 2000x3000)
    - `Background4k`: 4K Background overlay file name. (overlay has to match the Background dimensions 3840x2160)
    - `Background1080p` : 1080p Background overlay file name. (overlay has to match the Background dimensions 3840x2160)
    - `TC4k`: 4K TitleCard overlay file name. (overlay has to match the Poster dimensions 3840x2160)
    - `TC1080p` : 1080p TitleCard overlay file name. (overlay has to match the Poster dimensions 3840x2160)
    - `4KDoVi`: Specific overlay for 4K Dolby Vision posters. (2000x3000)
    - `4KHDR10`: Specific overlay for 4K HDR10 posters. (2000x3000)
    - `4KDoViHDR10`: Specific overlay for 4K DoVi & HDR10 posters. (2000x3000)
    - `4KDoViBackground`: Specific overlay for 4K Dolby Vision backgrounds. (3840x2160)
    - `4KHDR10Background`: Specific overlay for 4K HDR10 backgrounds. (3840x2160)
    - `4KDoViHDR10Background`: Specific overlay for 4K DoVi & HDR10 backgrounds. (3840x2160)
    - `4KDoViTC`: Specific overlay for 4K Dolby Vision TitleCards. (3840x2160)
    - `4KHDR10TC`: Specific overlay for 4K HDR10 TitleCards. (3840x2160)
    - `4KDoViHDR10TC`: Specific overlay for 4K DoVi & HDR10 TitleCards. (3840x2160)
    - `UsePosterResolutionOverlays`: Set to `true` to apply specific overlay with resolution for 4k/1080p posters [4K Example](https://github.com/fscorrupt/Posterizarr/blob/main/docs/images/poster-4k.png)/[1080p Example](https://github.com/fscorrupt/Posterizarr/blob/main/docs/images/poster-1080p.png).
        - if you only want 4k just add your default overlay file also for `Poster1080p`.
    - `UseBackgroundResolutionOverlays`: Set to `true` to apply specific overlay with resolution for 4k/1080p posters [4K Example](https://github.com/fscorrupt/Posterizarr/blob/main/docs/images/background-4k.png)/[1080p Example](https://github.com/fscorrupt/Posterizarr/blob/main/docs/images/background-1080p.png).
        - if you only want 4k just add your default overlay file also for `Background1080p`.
    - `UseTCResolutionOverlays`: Set to `true` to apply specific overlay with resolution for 4k/1080p posters [4K Example](https://github.com/fscorrupt/Posterizarr/blob/main/docs/images/background-4k.png)/[1080p Example](https://github.com/fscorrupt/Posterizarr/blob/main/docs/images/background-1080p.png).
        - if you only want 4k - add your default (without an resolution) overlay file for `TC1080p`.
    - `LibraryFolders`: Set to `false` for asset structure in one flat folder or `true` to split into library media folders like [Kometa](https://kometa.wiki/en/latest/kometa/guides/assets/#image-asset-directory-guide) needs it.
    - `Posters`: Set to `true` to create movie/show posters.
    - `NewLineOnSpecificSymbols`: Set to `true` to enable automatic insertion of a newline character at each occurrence of specific symbols in `NewLineSymbols` within the title text.
    - `NewLineSymbols`: A list of symbols that will trigger a newline insertion when `NewLineOnSpecificSymbols` is set to `true`. Separate each symbol with a comma (e.g., " - ", ":").
    - `SymbolsToKeepOnNewLine`: A list of symbols that trigger a newline insertion but are not replaced by the newline character. This only applies if the symbol is also included in `NewLineSymbols`. Separate each symbol with a comma (e.g., "-", ":").
    - `SeasonPosters`: Set to `true` to also create season posters.
    - `BackgroundPosters`: Set to `true` to also create background posters.
    - `TitleCards` : Set to `true` to also create title cards.
    - `SkipTBA` : Set to `true` to skip TitleCard creation if the Titletext is `TBA`.
    - `SkipJapTitle` : Set to `true` to skip TitleCard creation if the Titletext is `Jap or Chinese`.
    - `AssetCleanup` : Set to `true` to cleanup Assets that are no longer in Plex.

        ```diff
        - !! IMPORTANT !! -

        Risk of Data Loss from excluded Libraries:

        When you exclude libraries, any assets within these locations may be inadvertently deleted.

        This happens because the script interprets these assets as "not needed anymore" during its execution since they are not found or listed as part of the active scan.

        Ensure that all active asset libraries are included when using that setting on true to prevent unintended deletions.
        ```

    - `AutoUpdateIM` : Set to `true` to AutoUpdate Imagemagick Portable Version (Does not work with Docker/Unraid).
        - Doing this could break things, cause you then uses IM Versions that are not tested with Posterizarr.
    - `DisableHashValidation` : Set to `true` to skip hash validation (Default value is: false).
        - _Note: This may produce bloat, as every item will be re-uploaded to the media servers._
    - `DisableOnlineAssetFetch` : Set to `true` to skip all online lookups and use only locally available assets. (Default value is: false).

    #### OverlayPart

    - `ImageProcessing`: Set to `true` if you want the ImageMagick part (text, overlay and/or border); if `false`, it only downloads the posters.
    - `outputQuality`: Image output quality, default is `92%` if you set it to `100%` the image size gets doubled.

    #### PosterOverlayPart

    - `fontAllCaps`: Set to `true` for all caps text, else `false`.
    - `AddBorder`: Set to `true` to add a border to the image.
    - `AddText`: Set to `true` to add text to the image.
    - `AddTextStroke`: Set to `true` to add stroke to text.
    - `strokecolor`: Color of text stroke.
    - `strokewidth`: Stroke width.
    - `AddOverlay`: Set to `true` to add the defined overlay file to the image.
    - `fontcolor`: Color of font text.
    - `bordercolor`: Color of border.
    - `minPointSize`: Minimum size of text in poster.
    - `maxPointSize`: Maximum size of text in poster.
    - `borderwidth`: Border width.
    - `MaxWidth`: Maximum width of text box.
    - `MaxHeight`: Maximum height of text box.
    - `text_offset`: Text box offset from the bottom of the picture.
    - `lineSpacing`: Adjust the height between lines of text (Default is `0`)
    - `TextGravity`: Specifies the text alignment within the textbox (Default is `south`)

    #### SeasonPosterOverlayPart

    - `ShowFallback`: Set to `true` if you want to fallback to show poster if no season poster was found.
    - `fontAllCaps`: Set to `true` for all caps text, else `false`.
    - `AddBorder`: Set to `true` to add a border to the image.
    - `AddText`: Set to `true` to add text to the image.
    - `AddTextStroke`: Set to `true` to add stroke to text.
    - `strokecolor`: Color of text stroke.
    - `strokewidth`: Stroke width.
    - `AddOverlay`: Set to `true` to add the defined overlay file to the image.
    - `fontcolor`: Color of font text.
    - `bordercolor`: Color of border.
    - `minPointSize`: Minimum size of text in poster.
    - `maxPointSize`: Maximum size of text in poster.
    - `borderwidth`: Border width.
    - `MaxWidth`: Maximum width of text box.
    - `MaxHeight`: Maximum height of text box.
    - `text_offset`: Text box offset from the bottom of the picture.
    - `lineSpacing`: Adjust the height between lines of text (Default is `0`)
    - `TextGravity`: Specifies the text alignment within the textbox (Default is `south`)

    #### ShowTilteOnSeasonPosterPart

    - `fontAllCaps`: Set to `true` for all caps text, else `false`.
    - `AddShowTitletoSeason`: if set to `true` it will add show title to season poster (Default Value is: `false`)
    - `AddTextStroke`: Set to `true` to add stroke to text.
    - `strokecolor`: Color of text stroke.
    - `strokewidth`: Stroke width.
    - `fontcolor`: Color of font text.
    - `minPointSize`: Minimum size of text in poster.
    - `maxPointSize`: Maximum size of text in poster.
    - `MaxWidth`: Maximum width of text box.
    - `MaxHeight`: Maximum height of text box.
    - `text_offset`: Text box offset from the bottom of the picture.
    - `lineSpacing`: Adjust the height between lines of text (Default is `0`)
    - `TextGravity`: Specifies the text alignment within the textbox (Default is `south`)

    #### BackgroundOverlayPart

    - `fontAllCaps`: Set to `true` for all caps text, else `false`.
    - `AddBorder`: Set to `true` to add a border to the background image.
    - `AddText`: Set to `true` to add text to the background image.
    - `AddTextStroke`: Set to `true` to add stroke to text.
    - `strokecolor`: Color of text stroke.
    - `strokewidth`: Stroke width.
    - `AddOverlay`: Set to `true` to add the defined background overlay file to the background image.
    - `fontcolor`: Color of font text.
    - `bordercolor`: Color of border.
    - `minPointSize`: Minimum size of text in background image.
    - `maxPointSize`: Maximum size of text in background image.
    - `borderwidth`: Border width.
    - `MaxWidth`: Maximum width of text box in background image.
    - `MaxHeight`: Maximum height of text box in background image.
    - `text_offset`: Text box offset from the bottom of the background image.
    - `lineSpacing`: Adjust the height between lines of text (Default is `0`)
    - `TextGravity`: Specifies the text alignment within the textbox (Default is `south`)

    #### TitleCardOverlayPart

    - `UseBackgroundAsTitleCard`: Set to `true` if you prefer show background as TitleCard, default is `false` where it uses episode image as TitleCard.
    - `BackgroundFallback`: Set to `false` if you want to skip Background fallback for TitleCard images if no TitleCard was found.
    - `AddOverlay`: Set to `true` to add the defined TitleCard overlay file to the TitleCard image.
    - `AddBorder`: Set to `true` to add a border to the TitleCard image.
    - `borderwidth`: Border width.
    - `bordercolor`: Color of border.

    #### TitleCardTitleTextPart

    - `AddEPTitleText`: Set to `true` to add episode title text to the TitleCard image.
    - `AddTextStroke`: Set to `true` to add stroke to text.
    - `strokecolor`: Color of text stroke.
    - `strokewidth`: Stroke width.
    - `fontAllCaps`: Set to `true` for all caps text, else `false`.
    - `fontcolor`: Color of font text.
    - `minPointSize`: Minimum size of text in TitleCard image.
    - `maxPointSize`: Maximum size of text in TitleCard image.
    - `MaxWidth`: Maximum width of text box in TitleCard image.
    - `MaxHeight`: Maximum height of text box in TitleCard image.
    - `text_offset`: Text box offset from the bottom of the TitleCard image.
    - `lineSpacing`: Adjust the height between lines of text (Default is `0`)
    - `TextGravity`: Specifies the text alignment within the textbox (Default is `south`)

    #### TitleCardEpisodeTextPart
    - `SeasonTCText`: You can Specify the default text for `Season` that appears on TitleCard.
        - Example: `STAFFEL 1 • EPISODE 5` or `"SÄSONG 1 • EPISODE 1"`
    - `EpisodeTCText`: You can Specify the default text for `Episode` that appears on TitleCard.
        - Example: `SEASON 1 • EPISODE 5` or `"SEASON 1 • AVSNITT 1"`
    - `fontAllCaps`: Set to `true` for all caps text, else `false`.
    - `AddEPText`: Set to `true` to add episode text to the TitleCard image.
    - `AddTextStroke`: Set to `true` to add stroke to text.
    - `strokecolor`: Color of text stroke.
    - `strokewidth`: Stroke width.
    - `fontcolor`: Color of font text.
    - `minPointSize`: Minimum size of text in TitleCard image.
    - `maxPointSize`: Maximum size of text in TitleCard image.
    - `MaxWidth`: Maximum width of text box in TitleCard image.
    - `MaxHeight`: Maximum height of text box in TitleCard image.
    - `text_offset`: Text box offset from the bottom of the TitleCard image.
    - `lineSpacing`: Adjust the height between lines of text (Default is `0`)
    - `TextGravity`: Specifies the text alignment within the textbox (Default is `south`)

    #### CollectionPosterOverlayPart

    - `fontAllCaps`: Set to `true` for all caps text, else `false`.
    - `AddBorder`: Set to `true` to add a border to the image.
    - `AddText`: Set to `true` to add text to the image.
    - `AddTextStroke`: Set to `true` to add stroke to text.
    - `strokecolor`: Color of text stroke.
    - `strokewidth`: Stroke width.
    - `AddOverlay`: Set to `true` to add the defined overlay file to the image.
    - `fontcolor`: Color of font text.
    - `bordercolor`: Color of border.
    - `minPointSize`: Minimum size of text in poster.
    - `maxPointSize`: Maximum size of text in poster.
    - `borderwidth`: Border width.
    - `MaxWidth`: Maximum width of text box.
    - `MaxHeight`: Maximum height of text box.
    - `text_offset`: Text box offset from the bottom of the picture.
    - `lineSpacing`: Adjust the height between lines of text (Default is `0`)
    - `TextGravity`: Specifies the text alignment within the textbox (Default is `south`)

    #### CollectionTitlePosterPart

    - `fontAllCaps`: Set to `true` for all caps text, else `false`.
    - `AddCollectionTitle`: if set to `true` it will add collectiontitle to collection poster (Default Value is: `true`)
    - `CollectionTitle`: Extra text that gets added to the collection poster (Default is `Collection`)
    - `AddTextStroke`: Set to `true` to add stroke to text.
    - `strokecolor`: Color of text stroke.
    - `strokewidth`: Stroke width.
    - `fontcolor`: Color of font text.
    - `minPointSize`: Minimum size of text in poster.
    - `maxPointSize`: Maximum size of text in poster.
    - `MaxWidth`: Maximum width of text box.
    - `MaxHeight`: Maximum height of text box.
    - `text_offset`: Text box offset from the bottom of the picture.
    - `lineSpacing`: Adjust the height between lines of text (Default is `0`)
    - `TextGravity`: Specifies the text alignment within the textbox (Default is `south`)


3. Rename the config file to `config.json`.
4. Place the `overlay.png`, or whatever file you defined earlier in `overlayfile`, and `Rocky.ttf` font, or whatever font you defined earlier in `font` files in the same directory as Posterizarr.ps1 which is `$ScriptRoot`.