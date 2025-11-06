import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Save,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Settings,
  Database,
  Palette,
  Type,
  Bell,
  Check,
  X,
  List,
  Lock,
  Hash,
  Loader2,
  Search,
  HelpCircle,
  Upload,
  Image,
  Eye,
  Expand,
  Minimize,
  ExternalLink,
  Github,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ValidateButton from "./ValidateButton";
import Notification from "./Notification";
import LanguageOrderSelector from "./LanguageOrderSelector";
import LibraryExclusionSelector from "./LibraryExclusionSelector";
import { useToast } from "../context/ToastContext";

const API_URL = "/api";

// Mapping von Gruppen zu README-Abschnitten
const README_LINKS = {
  "WebUI Settings":
    "https://fscorrupt.github.io/Posterizarr/configuration/#webui",
  "API Keys & Tokens":
    "https://fscorrupt.github.io/Posterizarr/configuration/#apipart",
  ApiPart: "https://fscorrupt.github.io/Posterizarr/configuration/#apipart",
  "Language & Preferences":
    "https://fscorrupt.github.io/Posterizarr/configuration/#apipart",
  "Image Filters":
    "https://fscorrupt.github.io/Posterizarr/configuration/#apipart",
  "Plex Settings":
    "https://fscorrupt.github.io/Posterizarr/configuration/#plexpart",
  PlexPart: "https://fscorrupt.github.io/Posterizarr/configuration/#plexpart",
  "Jellyfin Settings":
    "https://fscorrupt.github.io/Posterizarr/configuration/#jellyfinpart",
  JellyfinPart:
    "https://fscorrupt.github.io/Posterizarr/configuration/#jellyfinpart",
  "Emby Settings":
    "https://fscorrupt.github.io/Posterizarr/configuration/#embypart",
  EmbyPart: "https://fscorrupt.github.io/Posterizarr/configuration/#embypart",
  Notifications:
    "https://fscorrupt.github.io/Posterizarr/configuration/#notification",
  Notification:
    "https://fscorrupt.github.io/Posterizarr/configuration/#notification",
  "General Settings":
    "https://fscorrupt.github.io/Posterizarr/configuration/#prerequisitepart",
  PrerequisitePart:
    "https://fscorrupt.github.io/Posterizarr/configuration/#prerequisitepart",
  "Overlay Files":
    "https://fscorrupt.github.io/Posterizarr/configuration/#prerequisitepart",
  "Resolution Overlays":
    "https://fscorrupt.github.io/Posterizarr/configuration/#prerequisitepart",
  Fonts:
    "https://fscorrupt.github.io/Posterizarr/configuration/#prerequisitepart",
  "Text Formatting":
    "https://fscorrupt.github.io/Posterizarr/configuration/#prerequisitepart",
  "Image Processing":
    "https://fscorrupt.github.io/Posterizarr/configuration/#overlaypart",
  OverlayPart:
    "https://fscorrupt.github.io/Posterizarr/configuration/#overlaypart",
  "Poster Settings":
    "https://fscorrupt.github.io/Posterizarr/configuration/#posteroverlaypart",
  PosterOverlayPart:
    "https://fscorrupt.github.io/Posterizarr/configuration/#posteroverlaypart",
  "Season Poster Settings":
    "https://fscorrupt.github.io/Posterizarr/configuration/#seasonposteroverlaypart",
  SeasonPosterOverlayPart:
    "https://fscorrupt.github.io/Posterizarr/configuration/#seasonposteroverlaypart",
  "Show Title on Season":
    "https://fscorrupt.github.io/Posterizarr/configuration/#showtilteonseasonposterpart",
  ShowTitleOnSeasonPosterPart:
    "https://fscorrupt.github.io/Posterizarr/configuration/#showtilteonseasonposterpart",
  "Background Settings":
    "https://fscorrupt.github.io/Posterizarr/configuration/#backgroundoverlaypart",
  BackgroundOverlayPart:
    "https://fscorrupt.github.io/Posterizarr/configuration/#backgroundoverlaypart",
  "Title Card Overlay":
    "https://fscorrupt.github.io/Posterizarr/configuration/#titlecardoverlaypart",
  TitleCardOverlayPart:
    "https://fscorrupt.github.io/Posterizarr/configuration/#titlecardoverlaypart",
  "Title Card Title Text":
    "https://fscorrupt.github.io/Posterizarr/configuration/#titlecardtitletextpart",
  TitleCardTitleTextPart:
    "https://fscorrupt.github.io/Posterizarr/configuration/#titlecardtitletextpart",
  "Title Card Episode Text":
    "https://fscorrupt.github.io/Posterizarr/configuration/#titlecardepisodetextpart",
  TitleCardEPTextPart:
    "https://fscorrupt.github.io/Posterizarr/configuration/#titlecardepisodetextpart",
  "Collection Poster":
    "https://fscorrupt.github.io/Posterizarr/configuration/#collectionposteroverlaypart",
  CollectionPosterOverlayPart:
    "https://fscorrupt.github.io/Posterizarr/configuration/#collectionposteroverlaypart",
  "Collection Title":
    "https://fscorrupt.github.io/Posterizarr/configuration/#collectiontitleposterpart",
  CollectionTitlePosterPart:
    "https://fscorrupt.github.io/Posterizarr/configuration/#collectiontitleposterpart",
};

// Comprehensive tooltip descriptions for all config variables
const getConfigTooltips = (language) => {
  const tooltips = {
    en: {
      // WebUI Settings
      basicAuthEnabled:
        "Enable Basic Authentication to protect the Web UI. Set to true to require username/password login (Default: false)",
      basicAuthUsername:
        "Username for Basic Authentication. Change this from the default 'admin' for better security (Default: admin)",
      basicAuthPassword:
        "Password for Basic Authentication. IMPORTANT: Change this from the default 'posterizarr' before enabling auth! (Default: posterizarr)",
      webuiLogLevel:
        "Set the log level for the WebUI backend server. DEBUG: Most detailed logging; INFO: General information (default); WARNING: Only warnings and errors; ERROR: Only errors; CRITICAL: Only critical errors",
      // ApiPart
      tvdbapi:
        "Your TVDB Project API key. If you are a TVDB subscriber, you can append your PIN to the end of your API key in the format YourApiKey#YourPin",
      tmdbtoken: "Your TMDB API Read Access Token (the really long one)",
      FanartTvAPIKey: "Your Fanart.tv Personal API Key",
      PlexToken:
        "Your Plex authentication token (Leave empty if not using Plex)",
      JellyfinAPIKey:
        "Your Jellyfin API key (You can create an API key from inside Jellyfin at Settings > Advanced > Api Keys)",
      EmbyAPIKey:
        "Your Emby API key (You can create an API key from inside Emby at Settings > Advanced > Api Keys)",
      FavProvider:
        "Set your preferred provider: tmdb (recommended), fanart, tvdb, or plex (not recommended for textless)",
      tmdb_vote_sorting:
        "Picture sorting via TMDB API: vote_average, vote_count, or primary (default TMDB view)",
      PreferredLanguageOrder:
        "Specify language preferences. Default is xx,en,de (xx is Textless). Use 2-digit ISO 3166-1 language codes. Setting to 'xx' only searches for textless posters",
      PreferredSeasonLanguageOrder:
        "Specify language preferences for seasons. Default is xx,en,de (xx is Textless). Use 2-digit ISO 3166-1 language codes",
      PreferredBackgroundLanguageOrder:
        "Specify language preferences for backgrounds. Default is PleaseFillMe (will take your poster lang order). Setting to 'xx' only searches for textless",
      PreferredTCLanguageOrder:
        "Specify language preferences for title cards/episode stills. Default is PleaseFillMe (will take your poster lang order). Use 2-digit ISO 3166-1 language codes",
      WidthHeightFilter:
        "If set to true, an additional resolution filter will be applied to Posters/Backgrounds (TMDB and TVDB) and Titlecards (TMDB only)",
      PosterMinWidth:
        "Minimum poster width filter—greater than or equal to specified value (default: 2000)",
      PosterMinHeight:
        "Minimum poster height filter—greater than or equal to specified value (default: 3000)",
      BgTcMinWidth:
        "Minimum background/titlecard width filter—greater than or equal to specified value (default: 3840)",
      BgTcMinHeight:
        "Minimum background/titlecard height filter—greater than or equal to specified value (default: 2160)",

      // PlexPart
      PlexLibstoExclude:
        "Plex libraries, by name, to exclude from processing (comma-separated list)",
      PlexUrl:
        "Plex server URL (e.g., http://192.168.1.1:32400 or http://myplexserver.com:32400). This field is only enabled when Plex is selected as your active media server",
      UsePlex:
        "Enable Plex as your media server. NOTE: Only ONE media server can be active at a time (Plex, Jellyfin, or Emby)",
      PlexUploadExistingAssets:
        "If set to true, the script will check local assets and upload them to Plex, but only if Plex does not already have EXIF data from Posterizarr, Kometa, or TCM",
      PlexUpload:
        "If set to true, Posterizarr will directly upload the artwork to Plex (handy if you do not use Kometa)",

      // JellyfinPart
      JellyfinLibstoExclude:
        "Jellyfin libraries, by local folder name, to exclude from processing (comma-separated list)",
      JellyfinUrl:
        "Jellyfin server URL (e.g., http://192.168.1.1:8096 or http://myplexserver.com:8096). This field is enabled when either Jellyfin is selected as your active media server OR when JellySync is enabled",
      UseJellyfin:
        "Enable Jellyfin as your media server. NOTE: Only ONE media server can be active at a time (Plex, Jellyfin, or Emby)",
      UseJellySync:
        "Enable synchronization with your Jellyfin server. When enabled, the Jellyfin URL and API Key fields become available for configuration. NOTE: This toggle is disabled when Jellyfin is selected as the active media server",
      JellyfinUploadExistingAssets:
        "If set to true, the script will check local assets and upload them to Jellyfin, but only if Jellyfin does not already have EXIF data from Posterizarr, Kometa, or TCM. NOTE: This requires UseJellyfin to be enabled",
      JellyfinReplaceThumbwithBackdrop:
        "If set to true, the script will replace the Thumb picture with the backdrop image. This only occurs if BackgroundPosters is also set to true. NOTE: This requires UseJellyfin to be enabled",

      // EmbyPart
      EmbyLibstoExclude:
        "Emby libraries, by local folder name, to exclude from processing (comma-separated list)",
      EmbyUrl:
        "Emby server URL (e.g., http://192.168.1.1:8096/emby or http://myplexserver.com:8096/emby). This field is enabled when either Emby is selected as your active media server OR when EmbySync is enabled",
      UseEmby:
        "Enable Emby as your media server. NOTE: Only ONE media server can be active at a time (Plex, Jellyfin, or Emby)",
      UseEmbySync:
        "Enable synchronization with your Emby server. When enabled, the Emby URL and API Key fields become available for configuration. NOTE: This toggle is disabled when Emby is selected as the active media server",
      EmbyUploadExistingAssets:
        "If set to true, the script will check local assets and upload them to Emby, but only if Emby does not already have EXIF data from Posterizarr, Kometa, or TCM. NOTE: This requires UseEmby to be enabled",
      EmbyReplaceThumbwithBackdrop:
        "If set to true, the script will replace the Thumb picture with the backdrop image. This only occurs if BackgroundPosters is also set to true. NOTE: This requires UseEmby to be enabled",

      // Notification
      SendNotification:
        "Set to true if you want to send notifications via Discord or Apprise, else false",
      AppriseUrl:
        "Only possible on Docker - URL for Apprise provider. See Apprise documentation for details",
      Discord: "Discord Webhook URL for notifications",
      DiscordUserName:
        "Username for the Discord webhook (default is Posterizarr)",
      UseUptimeKuma: "Set to true if you want to send webhook to Uptime-Kuma",
      UptimeKumaUrl: "Uptime-Kuma Webhook URL",

      // PrerequisitePart
      AssetPath:
        "Path to store generated posters. On Docker, this should be /assets",
      BackupPath:
        "Path to store/download Plex posters when using the backup mode",
      ManualAssetPath:
        "If assets are placed in this directory with the exact naming convention, they will be preferred (must follow same naming convention as /assets)",
      SkipAddText:
        "If set to true, Posterizarr will skip adding text to the poster if it is flagged as a 'Poster with text' by the provider",
      SkipAddTextAndOverlay:
        "If set to true, Posterizarr will skip adding text/overlay to the poster if it is flagged as a 'Poster with text' by the provider",
      FollowSymlink:
        "If set to true, Posterizarr will follow symbolic links in the specified directories during hashtable creation",
      ForceRunningDeletion:
        "If set to true, Posterizarr will automatically delete the Running File. WARNING: May result in multiple concurrent runs sharing the same temp directory",
      AutoUpdatePosterizarr:
        "If set to true, Posterizarr will update itself to latest version (Only for non-Docker systems)",
      show_skipped:
        "If set to true, verbose logging of already created assets will be displayed. On large libraries, this may appear as if the script is hanging",
      magickinstalllocation:
        "The path to the ImageMagick installation where magick.exe is located. If using portable version, leave as './magick'. Container manages this automatically",
      maxLogs:
        "Number of Log folders you want to keep in RotatedLogs Folder (Log History)",
      logLevel:
        "Sets the verbosity of logging. 1 = Warning/Error. 2 = Info/Warning/Error (default). 3 = Info/Warning/Error/Debug (most verbose)",
      font: "Default font file name for text overlays",
      RTLFont:
        "Right-to-Left font file name for RTL languages (Arabic, Hebrew, etc.)",
      backgroundfont: "Font file name for background text",
      titlecardfont: "Font file name for title card text",
      collectionfont: "Font file name for collection titles",
      overlayfile: "Default overlay file name (e.g., overlay.png)",
      seasonoverlayfile: "Season poster overlay file name",
      backgroundoverlayfile: "Background overlay file name",
      titlecardoverlayfile: "Title Card overlay file name",
      collectionoverlayfile: "Collection overlay file name",
      poster4k:
        "4K Poster overlay file name (overlay must match Poster dimensions 2000x3000)",
      Poster1080p:
        "1080p Poster overlay file name (overlay must match Poster dimensions 2000x3000)",
      Background4k:
        "4K Background overlay file name (overlay must match Background dimensions 3840x2160)",
      Background1080p:
        "1080p Background overlay file name (overlay must match Background dimensions 3840x2160)",
      TC4k: "4K TitleCard overlay file name (overlay must match dimensions 3840x2160)",
      TC1080p:
        "1080p TitleCard overlay file name (overlay must match dimensions 3840x2160)",
      "4KDoVi": "Specific overlay for 4K Dolby Vision posters. (2000x3000)",
      "4KHDR10": "Specific overlay for 4K HDR10 posters. (2000x3000)",
      "4KDoViHDR10":
        "Specific overlay for 4K DoVi & HDR10 posters. (2000x3000)",
      "4KDoViBackground":
        "Specific overlay for 4K Dolby Vision backgrounds. (3840x2160)",
      "4KHDR10Background":
        "Specific overlay for 4K HDR10 backgrounds. (3840x2160)",
      "4KDoViHDR10Background":
        "Specific overlay for 4K DoVi & HDR10 backgrounds. (3840x2160)",
      "4KDoViTC":
        "Specific overlay for 4K Dolby Vision TitleCards. (3840x2160)",
      "4KHDR10TC": "Specific overlay for 4K HDR10 TitleCards. (3840x2160)",
      "4KDoViHDR10TC":
        "Specific overlay for 4K DoVi & HDR10 TitleCards. (3840x2160)",
      UsePosterResolutionOverlays:
        "Set to true to apply specific overlay with resolution for 4k/1080p posters. If you only want 4k, add your default overlay file also for Poster1080p",
      UseBackgroundResolutionOverlays:
        "Set to true to apply specific overlay with resolution for 4k/1080p backgrounds. If you only want 4k, add your default overlay file also for Background1080p",
      UseTCResolutionOverlays:
        "Set to true to apply specific overlay with resolution for 4k/1080p title cards. If you only want 4k, add your default overlay file for TC1080p",
      LibraryFolders:
        "Set to false for asset structure in one flat folder or true to split into library media folders like Kometa needs it",
      Posters: "Set to true to create movie/show posters",
      SeasonPosters: "Set to true to also create season posters",
      BackgroundPosters: "Set to true to also create background posters",
      TitleCards: "Set to true to also create title cards",
      SkipTBA:
        "Set to true to skip TitleCard creation if the Title text is 'TBA'",
      SkipJapTitle:
        "Set to true to skip TitleCard creation if the Title text is Japanese or Chinese",
      AssetCleanup:
        "Set to true to cleanup Assets that are no longer in Plex. IMPORTANT: Risk of data loss from excluded libraries - ensure all active asset libraries are included",
      AutoUpdateIM:
        "Set to true to Auto-Update ImageMagick Portable Version (Does not work with Docker/Unraid). Warning: Untested versions may break things",
      NewLineOnSpecificSymbols:
        "Set to true to enable automatic insertion of a newline character at each occurrence of specific symbols in NewLineSymbols within the title text",
      NewLineSymbols:
        "A list of symbols that will trigger a newline insertion when NewLineOnSpecificSymbols is true. Separate each symbol with comma (e.g., ' - ', ':')",
      SymbolsToKeepOnNewLine:
        "A list of symbols that trigger a newline insertion but are not replaced by the NewLineOnSpecificSymbols setting. This only applies if the symbol is also included in NewLineSymbols. Separate each symbol with a comma (e.g., '-', ':')",
      DisableHashValidation:
        "Set to true to skip hash validation (Default: false). Note: This may produce bloat, as every item will be re-uploaded to media servers",
      DisableOnlineAssetFetch:
        "Set to true to skip all online lookups and use only locally available assets (Default: false)",

      // OverlayPart
      ImageProcessing:
        "Set to true if you want the ImageMagick part (text, overlay and/or border); if false, it only downloads the posters",
      outputQuality:
        "Image output quality (default is 92%). Setting to 100% doubles the image size",

      // PosterOverlayPart
      PosterFontAllCaps: "Set to true for all caps text on posters, else false",
      PosterAddBorder: "Set to true to add a border to the poster image",
      PosterAddText: "Set to true to add text to the poster image",
      PosterAddOverlay:
        "Set to true to add the defined overlay file to the poster image",
      PosterFontcolor:
        "Color of font text on posters (e.g., #FFFFFF for white)",
      PosterBordercolor: "Color of border on posters (e.g., #000000 for black)",
      PosterMinPointSize: "Minimum size of text in poster (in points)",
      PosterMaxPointSize: "Maximum size of text in poster (in points)",
      PosterBorderwidth: "Border width in pixels",
      PosterMaxWidth: "Maximum width of text box on poster",
      PosterMaxHeight: "Maximum height of text box on poster",
      PosterTextOffset:
        "Text box offset from the bottom of the picture (use +200 or -150 format)",
      PosterAddTextStroke: "Set to true to add stroke/outline to text",
      PosterStrokecolor:
        "Color of text stroke/outline (e.g., #000000 for black)",
      PosterStrokewidth: "Stroke width in pixels",
      PosterLineSpacing:
        "Adjust the height between lines of text (Default is 0)",
      PosterTextGravity:
        "Specifies the text alignment within the textbox (Default is south = bottom center)",

      // SeasonPosterOverlayPart
      SeasonPosterFontAllCaps:
        "Set to true for all caps text on season posters, else false",
      SeasonPosterAddBorder:
        "Set to true to add a border to the season poster image",
      SeasonPosterAddText: "Set to true to add text to the season poster image",
      SeasonPosterAddOverlay:
        "Set to true to add the defined overlay file to the season poster image",
      SeasonPosterFontcolor: "Color of font text on season posters",
      SeasonPosterBordercolor: "Color of border on season posters",
      SeasonPosterMinPointSize: "Minimum size of text in season poster",
      SeasonPosterMaxPointSize: "Maximum size of text in season poster",
      SeasonPosterBorderwidth: "Border width in pixels for season posters",
      SeasonPosterMaxWidth: "Maximum width of text box on season poster",
      SeasonPosterMaxHeight: "Maximum height of text box on season poster",
      SeasonPosterTextOffset:
        "Text box offset from the bottom of the season poster (use +200 or -150 format)",
      SeasonPosterAddTextStroke:
        "Set to true to add stroke/outline to text on season posters",
      SeasonPosterStrokecolor: "Color of text stroke/outline on season posters",
      SeasonPosterStrokewidth: "Stroke width in pixels for season posters",
      SeasonPosterLineSpacing:
        "Adjust the height between lines of text on season posters (Default is 0)",
      SeasonPosterShowFallback:
        "Set to true if you want to fallback to show poster if no season poster was found",
      SeasonPosterTextGravity:
        "Specifies the text alignment within the textbox on season posters (Default is south)",

      // BackgroundOverlayPart
      BackgroundFontAllCaps:
        "Set to true for all caps text on backgrounds, else false",
      BackgroundAddOverlay:
        "Set to true to add the defined background overlay file to the background image",
      BackgroundAddBorder:
        "Set to true to add a border to the background image",
      BackgroundAddText: "Set to true to add text to the background image",
      BackgroundFontcolor: "Color of font text on backgrounds",
      BackgroundBordercolor: "Color of border on backgrounds",
      BackgroundMinPointSize: "Minimum size of text in background image",
      BackgroundMaxPointSize: "Maximum size of text in background image",
      BackgroundBorderwidth: "Border width in pixels for backgrounds",
      BackgroundMaxWidth: "Maximum width of text box in background image",
      BackgroundMaxHeight: "Maximum height of text box in background image",
      BackgroundTextOffset:
        "Text box offset from the bottom of the background image (use +200 or -150 format)",
      BackgroundAddTextStroke:
        "Set to true to add stroke/outline to text on backgrounds",
      BackgroundStrokecolor: "Color of text stroke/outline on backgrounds",
      BackgroundStrokewidth: "Stroke width in pixels for backgrounds",
      BackgroundLineSpacing:
        "Adjust the height between lines of text on backgrounds (Default is 0)",
      BackgroundTextGravity:
        "Specifies the text alignment within the textbox on backgrounds (Default is south)",

      // TitleCardOverlayPart
      TitleCardUseBackgroundAsTitleCard:
        "Set to true if you prefer show background as TitleCard (default is false, which uses episode image)",
      TitleCardAddOverlay:
        "Set to true to add the defined TitleCard overlay file to the TitleCard image",
      TitleCardAddBorder: "Set to true to add a border to the TitleCard image",
      TitleCardBordercolor: "Color of border on title cards",
      TitleCardBorderwidth: "Border width in pixels for title cards",
      TitleCardBackgroundFallback:
        "Set to false if you want to skip Background fallback for TitleCard images if no TitleCard was found",

      // TitleCardTitleTextPart
      TitleCardTitleFontAllCaps:
        "Set to true for all caps episode title text on title cards, else false",
      TitleCardTitleAddEPTitleText:
        "Set to true to add episode title text to the TitleCard image",
      TitleCardTitleFontcolor:
        "Color of episode title font text on title cards",
      TitleCardTitleMinPointSize:
        "Minimum size of episode title text in TitleCard image",
      TitleCardTitleMaxPointSize:
        "Maximum size of episode title text in TitleCard image",
      TitleCardTitleMaxWidth:
        "Maximum width of episode title text box in TitleCard image",
      TitleCardTitleMaxHeight:
        "Maximum height of episode title text box in TitleCard image",
      TitleCardTitleTextOffset:
        "Episode title text box offset from the bottom of the TitleCard image (use +200 or -150 format)",
      TitleCardTitleAddTextStroke:
        "Set to true to add stroke/outline to episode title text on title cards",
      TitleCardTitleStrokecolor:
        "Color of episode title text stroke/outline on title cards",
      TitleCardTitleStrokewidth:
        "Stroke width in pixels for episode title text on title cards",
      TitleCardTitleLineSpacing:
        "Adjust the height between lines of episode title text on title cards (Default is 0)",
      TitleCardTitleTextGravity:
        "Specifies the episode title text alignment within the textbox on title cards (Default is south)",

      // TitleCardEPTextPart
      TitleCardEPSeasonTCText:
        "You can specify the default text for 'Season' that appears on TitleCard (e.g., 'STAFFEL' for German, 'SÄSONG' for Swedish)",
      TitleCardEPEpisodeTCText:
        "You can specify the default text for 'Episode' that appears on TitleCard (e.g., 'EPISODE', 'AVSNITT' for Swedish)",
      TitleCardEPFontAllCaps:
        "Set to true for all caps episode number text on title cards, else false",
      TitleCardEPAddEPText:
        "Set to true to add episode number text (Season X • Episode Y) to the TitleCard image",
      TitleCardEPFontcolor: "Color of episode number font text on title cards",
      TitleCardEPMinPointSize:
        "Minimum size of episode number text in TitleCard image",
      TitleCardEPMaxPointSize:
        "Maximum size of episode number text in TitleCard image",
      TitleCardEPMaxWidth:
        "Maximum width of episode number text box in TitleCard image",
      TitleCardEPMaxHeight:
        "Maximum height of episode number text box in TitleCard image",
      TitleCardEPTextOffset:
        "Episode number text box offset from the bottom of the TitleCard image (use +200 or -150 format)",
      TitleCardEPAddTextStroke:
        "Set to true to add stroke/outline to episode number text on title cards",
      TitleCardEPStrokecolor:
        "Color of episode number text stroke/outline on title cards",
      TitleCardEPStrokewidth:
        "Stroke width in pixels for episode number text on title cards",
      TitleCardEPLineSpacing:
        "Adjust the height between lines of episode number text on title cards (Default is 0)",
      TitleCardEPTextGravity:
        "Specifies the episode number text alignment within the textbox on title cards (Default is south)",

      // ShowTitleOnSeasonPosterPart
      ShowTitleAddShowTitletoSeason:
        "If set to true, it will add show title to season poster (Default: false)",
      ShowTitleFontAllCaps:
        "Set to true for all caps show title text on season posters, else false",
      ShowTitleAddTextStroke:
        "Set to true to add stroke/outline to show title text on season posters",
      ShowTitleStrokecolor:
        "Color of show title text stroke/outline on season posters",
      ShowTitleStrokewidth:
        "Stroke width in pixels for show title text on season posters",
      ShowTitleFontcolor: "Color of show title font text on season posters",
      ShowTitleMinPointSize:
        "Minimum size of show title text on season posters",
      ShowTitleMaxPointSize:
        "Maximum size of show title text on season posters",
      ShowTitleMaxWidth:
        "Maximum width of show title text box on season posters",
      ShowTitleMaxHeight:
        "Maximum height of show title text box on season posters",
      ShowTitleTextOffset:
        "Show title text box offset from the bottom of the season poster (use +200 or -150 format)",
      ShowTitleLineSpacing:
        "Adjust the height between lines of show title text on season posters (Default is 0)",
      ShowTitleTextGravity:
        "Specifies the show title text alignment within the textbox on season posters (Default is south)",

      // CollectionTitlePosterPart
      CollectionTitleAddCollectionTitle:
        "Set to true to add collection title text to collection posters",
      CollectionTitleCollectionTitle:
        "The text to display as collection title (e.g., 'COLLECTION', 'SAMMLUNG')",
      CollectionTitleFontAllCaps:
        "Set to true for all caps collection title text, else false",
      CollectionTitleAddTextStroke:
        "Set to true to add stroke/outline to collection title text",
      CollectionTitleStrokecolor:
        "Color of collection title text stroke/outline",
      CollectionTitleStrokewidth:
        "Stroke width in pixels for collection title text",
      CollectionTitleFontcolor: "Color of collection title font text",
      CollectionTitleMinPointSize: "Minimum size of collection title text",
      CollectionTitleMaxPointSize: "Maximum size of collection title text",
      CollectionTitleMaxWidth: "Maximum width of collection title text box",
      CollectionTitleMaxHeight: "Maximum height of collection title text box",
      CollectionTitleTextOffset:
        "Collection title text box offset from the bottom of the poster (use +200 or -150 format)",
      CollectionTitleLineSpacing:
        "Adjust the height between lines of collection title text (Default is 0)",
      CollectionTitleTextGravity:
        "Specifies the collection title text alignment within the textbox (Default is south)",

      // CollectionPosterOverlayPart
      CollectionPosterFontAllCaps:
        "Set to true for all caps text on collection posters, else false",
      CollectionPosterAddBorder:
        "Set to true to add a border to the collection poster image",
      CollectionPosterAddText:
        "Set to true to add text to the collection poster image",
      CollectionPosterAddTextStroke:
        "Set to true to add stroke/outline to text on collection posters",
      CollectionPosterStrokecolor:
        "Color of text stroke/outline on collection posters",
      CollectionPosterStrokewidth:
        "Stroke width in pixels for collection posters",
      CollectionPosterAddOverlay:
        "Set to true to add the defined overlay file to the collection poster image",
      CollectionPosterFontcolor: "Color of font text on collection posters",
      CollectionPosterBordercolor: "Color of border on collection posters",
      CollectionPosterMinPointSize: "Minimum size of text in collection poster",
      CollectionPosterMaxPointSize: "Maximum size of text in collection poster",
      CollectionPosterBorderwidth:
        "Border width in pixels for collection posters",
      CollectionPosterMaxWidth:
        "Maximum width of text box on collection poster",
      CollectionPosterMaxHeight:
        "Maximum height of text box on collection poster",
      CollectionPosterTextOffset:
        "Text box offset from the bottom of the collection poster (use +200 or -150 format)",
      CollectionPosterLineSpacing:
        "Adjust the height between lines of text on collection posters (Default is 0)",
      CollectionPosterTextGravity:
        "Specifies the text alignment within the textbox on collection posters (Default is south)",
    },
    de: {
      // WebUI Settings
      basicAuthEnabled:
        "Aktivieren Sie die Basis-Authentifizierung zum Schutz der Web-UI. Setzen Sie auf true, um Benutzername/Passwort-Anmeldung zu erfordern (Standard: false)",
      basicAuthUsername:
        "Benutzername für Basis-Authentifizierung. Ändern Sie dies vom Standard 'admin' für bessere Sicherheit (Standard: admin)",
      basicAuthPassword:
        "Passwort für Basis-Authentifizierung. WICHTIG: Ändern Sie dies vom Standard 'posterizarr', bevor Sie die Authentifizierung aktivieren! (Standard: posterizarr)",
      webuiLogLevel:
        "Legen Sie die Log-Stufe für den WebUI-Backend-Server fest. DEBUG: Detaillierteste Protokollierung; INFO: Allgemeine Informationen (Standard); WARNING: Nur Warnungen und Fehler; ERROR: Nur Fehler; CRITICAL: Nur kritische Fehler",
      // ApiPart
      tvdbapi:
        "Ihr TVDB Project API-Schlüssel. Wenn Sie ein TVDB-Abonnent sind, können Sie Ihre PIN am Ende Ihres API-Schlüssels im Format IhrApiKey#IhrPin anhängen",
      tmdbtoken: "Ihr TMDB API Read Access Token (der sehr lange)",
      FanartTvAPIKey: "Ihr Fanart.tv Personal API-Schlüssel",
      PlexToken:
        "Ihr Plex-Authentifizierungstoken (Leer lassen, wenn Plex nicht verwendet wird)",
      JellyfinAPIKey:
        "Ihr Jellyfin API-Schlüssel (Sie können einen API-Schlüssel in Jellyfin erstellen unter Einstellungen > Erweitert > Api-Schlüssel)",
      EmbyAPIKey:
        "Ihr Emby API-Schlüssel (Sie können einen API-Schlüssel in Emby erstellen unter Einstellungen > Erweitert > Api-Schlüssel)",
      FavProvider:
        "Setzen Sie Ihren bevorzugten Anbieter: tmdb (empfohlen), fanart, tvdb oder plex (nicht empfohlen für textlos)",
      tmdb_vote_sorting:
        "Bildsortierung über TMDB API: vote_average, vote_count oder primary (Standard-TMDB-Ansicht)",
      PreferredLanguageOrder:
        "Sprachpräferenzen festlegen. Standard ist xx,en,de (xx ist Textlos). Verwenden Sie 2-stellige ISO 3166-1 Sprachcodes. Einstellung auf 'xx' sucht nur nach textlosen Postern",
      PreferredSeasonLanguageOrder:
        "Sprachpräferenzen für Staffeln festlegen. Standard ist xx,en,de (xx ist Textlos). Verwenden Sie 2-stellige ISO 3166-1 Sprachcodes",
      PreferredBackgroundLanguageOrder:
        "Sprachpräferenzen für Hintergründe festlegen. Standard ist PleaseFillMe (übernimmt Ihre Poster-Sprachreihenfolge). Einstellung auf 'xx' sucht nur nach textlosen",
      PreferredTCLanguageOrder:
        "Sprachpräferenzen für Titelkarten/Episodenbilder festlegen. Standard ist PleaseFillMe (übernimmt Ihre Poster-Sprachreihenfolge). Verwenden Sie 2-stellige ISO 3166-1 Sprachcodes",
      WidthHeightFilter:
        "Wenn auf true gesetzt, wird ein zusätzlicher Auflösungsfilter auf Poster/Hintergründe (TMDB und TVDB) und Titelkarten (nur TMDB) angewendet",
      PosterMinWidth:
        "Mindestbreite für Poster-Filter – größer oder gleich dem angegebenen Wert (Standard: 2000)",
      PosterMinHeight:
        "Mindesthöhe für Poster-Filter – größer oder gleich dem angegebenen Wert (Standard: 3000)",
      BgTcMinWidth:
        "Mindestbreite für Hintergrund/Titelkarten-Filter – größer oder gleich dem angegebenen Wert (Standard: 3840)",
      BgTcMinHeight:
        "Mindesthöhe für Hintergrund/Titelkarten-Filter – größer oder gleich dem angegebenen Wert (Standard: 2160)",

      // PlexPart
      PlexLibstoExclude:
        "Plex-Bibliotheken, nach Namen, die von der Verarbeitung ausgeschlossen werden sollen (kommagetrennte Liste)",
      PlexUrl:
        "Plex-Server-URL (z.B. http://192.168.1.1:32400 oder http://meinplexserver.com:32400). Dieses Feld ist nur aktiviert, wenn Plex als aktiver Medienserver ausgewählt ist",
      UsePlex:
        "Plex als Medienserver aktivieren. HINWEIS: Nur EIN Medienserver kann gleichzeitig aktiv sein (Plex, Jellyfin oder Emby)",
      PlexUploadExistingAssets:
        "Wenn auf true gesetzt, prüft das Skript lokale Assets und lädt sie zu Plex hoch, aber nur wenn Plex noch keine EXIF-Daten von Posterizarr, Kometa oder TCM hat",
      PlexUpload:
        "Wenn auf true gesetzt, lädt Posterizarr die Grafiken direkt zu Plex hoch (praktisch, wenn Sie Kometa nicht verwenden)",

      // JellyfinPart
      JellyfinLibstoExclude:
        "Jellyfin-Bibliotheken, nach lokalem Ordnernamen, die von der Verarbeitung ausgeschlossen werden sollen (kommagetrennte Liste)",
      JellyfinUrl:
        "Jellyfin-Server-URL (z.B. http://192.168.1.1:8096 oder http://meinplexserver.com:8096). Dieses Feld ist aktiviert, wenn entweder Jellyfin als aktiver Medienserver ausgewählt ist ODER wenn JellySync aktiviert ist",
      UseJellyfin:
        "Jellyfin als Medienserver aktivieren. HINWEIS: Nur EIN Medienserver kann gleichzeitig aktiv sein (Plex, Jellyfin oder Emby)",
      UseJellySync:
        "Synchronisation mit Ihrem Jellyfin-Server aktivieren. Wenn aktiviert, werden die Felder Jellyfin-URL und API-Schlüssel für die Konfiguration verfügbar. HINWEIS: Dieser Schalter ist deaktiviert, wenn Jellyfin als aktiver Medienserver ausgewählt ist",
      JellyfinUploadExistingAssets:
        "Wenn auf true gesetzt, prüft das Skript lokale Assets und lädt sie zu Jellyfin hoch, aber nur wenn Jellyfin noch keine EXIF-Daten von Posterizarr, Kometa oder TCM hat. HINWEIS: Dies erfordert, dass UseJellyfin aktiviert ist",
      JellyfinReplaceThumbwithBackdrop:
        "Wenn auf true gesetzt, ersetzt das Skript das Thumb-Bild durch das Backdrop-Bild. Dies geschieht nur, wenn BackgroundPosters ebenfalls auf true gesetzt ist. HINWEIS: Dies erfordert, dass UseJellyfin aktiviert ist",

      // EmbyPart
      EmbyLibstoExclude:
        "Emby-Bibliotheken, nach lokalem Ordnernamen, die von der Verarbeitung ausgeschlossen werden sollen (kommagetrennte Liste)",
      EmbyUrl:
        "Emby-Server-URL (z.B. http://192.168.1.1:8096/emby oder http://meinplexserver.com:8096/emby). Dieses Feld ist aktiviert, wenn entweder Emby als aktiver Medienserver ausgewählt ist ODER wenn EmbySync aktiviert ist",
      UseEmby:
        "Emby als Medienserver aktivieren. HINWEIS: Nur EIN Medienserver kann gleichzeitig aktiv sein (Plex, Jellyfin oder Emby)",
      UseEmbySync:
        "Synchronisation mit Ihrem Emby-Server aktivieren. Wenn aktiviert, werden die Felder Emby-URL und API-Schlüssel für die Konfiguration verfügbar. HINWEIS: Dieser Schalter ist deaktiviert, wenn Emby als aktiver Medienserver ausgewählt ist",
      EmbyUploadExistingAssets:
        "Wenn auf true gesetzt, prüft das Skript lokale Assets und lädt sie zu Emby hoch, aber nur wenn Emby noch keine EXIF-Daten von Posterizarr, Kometa oder TCM hat. HINWEIS: Dies erfordert, dass UseEmby aktiviert ist",
      EmbyReplaceThumbwithBackdrop:
        "Wenn auf true gesetzt, ersetzt das Skript das Thumb-Bild durch das Backdrop-Bild. Dies geschieht nur, wenn BackgroundPosters ebenfalls auf true gesetzt ist. HINWEIS: Dies erfordert, dass UseEmby aktiviert ist",

      // Notification
      SendNotification:
        "Auf true setzen, wenn Sie Benachrichtigungen per Discord oder Apprise senden möchten, sonst false",
      AppriseUrl:
        "Nur auf Docker möglich - URL für Apprise-Anbieter. Siehe Apprise-Dokumentation für Details",
      Discord: "Discord Webhook-URL für Benachrichtigungen",
      DiscordUserName:
        "Benutzername für den Discord-Webhook (Standard ist Posterizarr)",
      UseUptimeKuma:
        "Auf true setzen, wenn Sie Webhook an Uptime-Kuma senden möchten",
      UptimeKumaUrl: "Uptime-Kuma Webhook-URL",

      // PrerequisitePart
      AssetPath:
        "Pfad zum Speichern generierter Poster. Auf Docker sollte dies /assets sein",
      BackupPath:
        "Pfad zum Speichern/Herunterladen von Plex-Postern im Backup-Modus",
      ManualAssetPath:
        "Wenn Assets in diesem Verzeichnis mit der exakten Namenskonvention platziert werden, werden sie bevorzugt (muss dieselbe Namenskonvention wie /assets befolgen)",
      SkipAddText:
        "Wenn auf true gesetzt, überspringt Posterizarr das Hinzufügen von Text zum Poster, wenn es vom Anbieter als 'Poster mit Text' gekennzeichnet ist",
      SkipAddTextAndOverlay:
        "Wenn auf true gesetzt, überspringt Posterizarr das Hinzufügen von Text/overlay zum Poster, wenn es vom Anbieter als 'Poster mit Text' gekennzeichnet ist",
      FollowSymlink:
        "Wenn auf true gesetzt, folgt Posterizarr symbolischen Links in den angegebenen Verzeichnissen während der Hashtabellen-Erstellung",
      ForceRunningDeletion:
        "Wenn auf true gesetzt, löscht Posterizarr automatisch die Running-Datei. WARNUNG: Kann dazu führen, dass mehrere gleichzeitige Läufe dasselbe Temp-Verzeichnis teilen",
      AutoUpdatePosterizarr:
        "Wenn auf true gesetzt, aktualisiert sich Posterizarr selbst auf die neueste Version (Nur für Nicht-Docker-Systeme)",
      show_skipped:
        "Wenn auf true gesetzt, wird ausführliches Logging bereits erstellter Assets angezeigt. Bei großen Bibliotheken kann es so aussehen, als ob das Skript hängt",
      magickinstalllocation:
        "Der Pfad zur ImageMagick-Installation, wo sich magick.exe befindet. Wenn Sie die portable Version verwenden, lassen Sie './magick'. Container verwalten dies automatisch",
      maxLogs:
        "Anzahl der Log-Ordner, die Sie im RotatedLogs-Ordner behalten möchten (Log-Historie)",
      logLevel:
        "Setzt die Ausführlichkeit des Loggings. 1 = Warnung/Fehler. 2 = Info/Warnung/Fehler (Standard). 3 = Info/Warnung/Fehler/Debug (am ausführlichsten)",
      font: "Standard-Schriftartdatei für Text-Overlays",
      RTLFont:
        "Rechts-nach-Links-Schriftartdatei für RTL-Sprachen (Arabisch, Hebräisch, etc.)",
      backgroundfont: "Schriftartdatei für Hintergrundtext",
      titlecardfont: "Schriftartdatei für Titelkarten-Text",
      collectionfont: "Schriftartdatei für Sammlungstitel",
      overlayfile: "Standard-Overlay-Dateiname (z.B. overlay.png)",
      seasonoverlayfile: "Staffelposter-Overlay-Dateiname",
      backgroundoverlayfile: "Hintergrund-Overlay-Dateiname",
      titlecardoverlayfile: "Titelkarten-Overlay-Dateiname",
      collectionoverlayfile: "Sammlungs-Overlay-Dateiname",
      poster4k:
        "4K-Poster-Overlay-Dateiname (Overlay muss Poster-Dimensionen 2000x3000 entsprechen)",
      Poster1080p:
        "1080p-Poster-Overlay-Dateiname (Overlay muss Poster-Dimensionen 2000x3000 entsprechen)",
      Background4k:
        "4K-Hintergrund-Overlay-Dateiname (Overlay muss Hintergrund-Dimensionen 3840x2160 entsprechen)",
      Background1080p:
        "1080p-Hintergrund-Overlay-Dateiname (Overlay muss Hintergrund-Dimensionen 3840x2160 entsprechen)",
      TC4k: "4K-Titelkarten-Overlay-Dateiname (Overlay muss Dimensionen 3840x2160 entsprechen)",
      TC1080p:
        "1080p-Titelkarten-Overlay-Dateiname (Overlay muss Dimensionen 3840x2160 entsprechen)",
      "4KDoVi": "Spezifisches Overlay für 4K Dolby Vision Poster. (2000x3000)",
      "4KHDR10": "Spezifisches Overlay für 4K HDR10 Poster. (2000x3000)",
      "4KDoViHDR10":
        "Spezifisches Overlay für 4K DoVi & HDR10 Poster. (2000x3000)",
      "4KDoViBackground":
        "Spezifisches Overlay für 4K Dolby Vision Hintergründe. (3840x2160)",
      "4KHDR10Background":
        "Spezifisches Overlay für 4K HDR10 Hintergründe. (3840x2160)",
      "4KDoViHDR10Background":
        "Spezifisches Overlay für 4K DoVi & HDR10 Hintergründe. (3840x2160)",
      "4KDoViTC":
        "Spezifisches Overlay für 4K Dolby Vision Titelkarten. (3840x2160)",
      "4KHDR10TC": "Spezifisches Overlay für 4K HDR10 Titelkarten. (3840x2160)",
      "4KDoViHDR10TC":
        "Spezifisches Overlay für 4K DoVi & HDR10 Titelkarten. (3840x2160)",
      UsePosterResolutionOverlays:
        "Auf true setzen, um spezifisches Overlay mit Auflösung für 4k/1080p-Poster anzuwenden. Wenn Sie nur 4k möchten, fügen Sie Ihre Standard-Overlay-Datei auch für Poster1080p hinzu",
      UseBackgroundResolutionOverlays:
        "Auf true setzen, um spezifisches Overlay mit Auflösung für 4k/1080p-Hintergründe anzuwenden. Wenn Sie nur 4k möchten, fügen Sie Ihre Standard-Overlay-Datei auch für Background1080p hinzu",
      UseTCResolutionOverlays:
        "Auf true setzen, um spezifisches Overlay mit Auflösung für 4k/1080p-Titelkarten anzuwenden. Wenn Sie nur 4k möchten, fügen Sie Ihre Standard-Overlay-Datei für TC1080p hinzu",
      LibraryFolders:
        "Auf false setzen für Asset-Struktur in einem flachen Ordner oder auf true, um in Bibliotheks-Medienordner aufzuteilen, wie Kometa es benötigt",
      Posters: "Auf true setzen, um Film-/Serienposter zu erstellen",
      SeasonPosters: "Auf true setzen, um auch Staffelposter zu erstellen",
      BackgroundPosters:
        "Auf true setzen, um auch Hintergrundposter zu erstellen",
      TitleCards: "Auf true setzen, um auch Titelkarten zu erstellen",
      SkipTBA:
        "Auf true setzen, um Titelkarten-Erstellung zu überspringen, wenn der Titeltext 'TBA' ist",
      SkipJapTitle:
        "Auf true setzen, um Titelkarten-Erstellung zu überspringen, wenn der Titeltext Japanisch oder Chinesisch ist",
      AssetCleanup:
        "Auf true setzen, um Assets zu bereinigen, die nicht mehr in Plex sind. WICHTIG: Risiko von Datenverlust durch ausgeschlossene Bibliotheken - stellen Sie sicher, dass alle aktiven Asset-Bibliotheken eingeschlossen sind",
      AutoUpdateIM:
        "Auf true setzen, um ImageMagick Portable Version automatisch zu aktualisieren (Funktioniert nicht mit Docker/Unraid). Warnung: Ungetestete Versionen können Probleme verursachen",
      NewLineOnSpecificSymbols:
        "Auf true setzen, um automatisches Einfügen eines Zeilenumbruchs bei jedem Vorkommen bestimmter Symbole in NewLineSymbols innerhalb des Titeltexts zu aktivieren",
      NewLineSymbols:
        "Eine Liste von Symbolen, die einen Zeilenumbruch auslösen, wenn NewLineOnSpecificSymbols true ist. Trennen Sie jedes Symbol mit Komma (z.B. ' - ', ':')",
      SymbolsToKeepOnNewLine:
        "Eine Liste von Symbolen, die einen Zeilenumbruch auslösen, aber nicht durch die NewLineOnSpecificSymbols-Einstellung ersetzt werden. Dies gilt nur, wenn das Symbol auch in NewLineSymbols enthalten ist. Trennen Sie jedes Symbol mit Komma (z.B. '-', ':')",
      DisableHashValidation:
        "Auf true setzen, um Hash-Validierung zu überspringen (Standard: false). Hinweis: Dies kann Bloat erzeugen, da jedes Element erneut auf Medienserver hochgeladen wird",
      DisableOnlineAssetFetch:
        "Auf true setzen, um alle Online-Lookups zu überspringen und nur lokal verfügbare Assets zu verwenden (Standard: false)",

      // OverlayPart
      ImageProcessing:
        "Auf true setzen, wenn Sie den ImageMagick-Teil (Text, Overlay und/oder Rahmen) möchten; wenn false, werden nur die Poster heruntergeladen",
      outputQuality:
        "Bild-Ausgabequalität (Standard ist 92%). Einstellung auf 100% verdoppelt die Bildgröße",

      // PosterOverlayPart
      PosterFontAllCaps:
        "Auf true setzen für Großbuchstaben-Text auf Postern, sonst false",
      PosterAddBorder:
        "Auf true setzen, um einen Rahmen zum Posterbild hinzuzufügen",
      PosterAddText: "Auf true setzen, um Text zum Posterbild hinzuzufügen",
      PosterAddOverlay:
        "Auf true setzen, um die definierte Overlay-Datei zum Posterbild hinzuzufügen",
      PosterFontcolor:
        "Farbe des Schrifttexts auf Postern (z.B. #FFFFFF für Weiß)",
      PosterBordercolor:
        "Farbe des Rahmens auf Postern (z.B. #000000 für Schwarz)",
      PosterMinPointSize: "Minimale Textgröße im Poster (in Punkten)",
      PosterMaxPointSize: "Maximale Textgröße im Poster (in Punkten)",
      PosterBorderwidth: "Rahmenbreite in Pixeln",
      PosterMaxWidth: "Maximale Breite der Textbox auf dem Poster",
      PosterMaxHeight: "Maximale Höhe der Textbox auf dem Poster",
      PosterTextOffset:
        "Textbox-Versatz vom unteren Rand des Bildes (Format +200 oder -150 verwenden)",
      PosterAddTextStroke:
        "Auf true setzen, um Kontur/Umrandung zum Text hinzuzufügen",
      PosterStrokecolor:
        "Farbe der Textkontur/Umrandung (z.B. #000000 für Schwarz)",
      PosterStrokewidth: "Konturbreite in Pixeln",
      PosterLineSpacing: "Höhe zwischen Textzeilen anpassen (Standard ist 0)",
      PosterTextGravity:
        "Gibt die Textausrichtung innerhalb der Textbox an (Standard ist south = unten zentriert)",

      // SeasonPosterOverlayPart
      SeasonPosterFontAllCaps:
        "Auf true setzen für Großbuchstaben-Text auf Staffelpostern, sonst false",
      SeasonPosterAddBorder:
        "Auf true setzen, um einen Rahmen zum Staffelposterbild hinzuzufügen",
      SeasonPosterAddText:
        "Auf true setzen, um Text zum Staffelposterbild hinzuzufügen",
      SeasonPosterAddOverlay:
        "Auf true setzen, um die definierte Overlay-Datei zum Staffelposterbild hinzuzufügen",
      SeasonPosterFontcolor: "Farbe des Schrifttexts auf Staffelpostern",
      SeasonPosterBordercolor: "Farbe des Rahmens auf Staffelpostern",
      SeasonPosterMinPointSize: "Minimale Textgröße im Staffelposter",
      SeasonPosterMaxPointSize: "Maximale Textgröße im Staffelposter",
      SeasonPosterBorderwidth: "Rahmenbreite in Pixeln für Staffelposter",
      SeasonPosterMaxWidth: "Maximale Breite der Textbox auf dem Staffelposter",
      SeasonPosterMaxHeight: "Maximale Höhe der Textbox auf dem Staffelposter",
      SeasonPosterTextOffset:
        "Textbox-Versatz vom unteren Rand des Staffelposters (Format +200 oder -150 verwenden)",
      SeasonPosterAddTextStroke:
        "Auf true setzen, um Kontur/Umrandung zum Text auf Staffelpostern hinzuzufügen",
      SeasonPosterStrokecolor:
        "Farbe der Textkontur/Umrandung auf Staffelpostern",
      SeasonPosterStrokewidth: "Konturbreite in Pixeln für Staffelposter",
      SeasonPosterLineSpacing:
        "Höhe zwischen Textzeilen auf Staffelpostern anpassen (Standard ist 0)",
      SeasonPosterShowFallback:
        "Auf true setzen, wenn Sie auf Serienposter zurückgreifen möchten, wenn kein Staffelposter gefunden wurde",
      SeasonPosterTextGravity:
        "Gibt die Textausrichtung innerhalb der Textbox auf Staffelpostern an (Standard ist south)",

      // BackgroundOverlayPart
      BackgroundFontAllCaps:
        "Auf true setzen für Großbuchstaben-Text auf Hintergründen, sonst false",
      BackgroundAddOverlay:
        "Auf true setzen, um die definierte Hintergrund-Overlay-Datei zum Hintergrundbild hinzuzufügen",
      BackgroundAddBorder:
        "Auf true setzen, um einen Rahmen zum Hintergrundbild hinzuzufügen",
      BackgroundAddText:
        "Auf true setzen, um Text zum Hintergrundbild hinzuzufügen",
      BackgroundFontcolor: "Farbe des Schrifttexts auf Hintergründen",
      BackgroundBordercolor: "Farbe des Rahmens auf Hintergründen",
      BackgroundMinPointSize: "Minimale Textgröße im Hintergrundbild",
      BackgroundMaxPointSize: "Maximale Textgröße im Hintergrundbild",
      BackgroundBorderwidth: "Rahmenbreite in Pixeln für Hintergründe",
      BackgroundMaxWidth: "Maximale Breite der Textbox im Hintergrundbild",
      BackgroundMaxHeight: "Maximale Höhe der Textbox im Hintergrundbild",
      BackgroundTextOffset:
        "Textbox-Versatz vom unteren Rand des Hintergrundbildes (Format +200 oder -150 verwenden)",
      BackgroundAddTextStroke:
        "Auf true setzen, um Kontur/Umrandung zum Text auf Hintergründen hinzuzufügen",
      BackgroundStrokecolor: "Farbe der Textkontur/Umrandung auf Hintergründen",
      BackgroundStrokewidth: "Konturbreite in Pixeln für Hintergründe",
      BackgroundLineSpacing:
        "Höhe zwischen Textzeilen auf Hintergründen anpassen (Standard ist 0)",
      BackgroundTextGravity:
        "Gibt die Textausrichtung innerhalb der Textbox auf Hintergründen an (Standard ist south)",

      // TitleCardOverlayPart
      TitleCardUseBackgroundAsTitleCard:
        "Auf true setzen, wenn Sie Serien-Hintergrund als Titelkarte bevorzugen (Standard ist false, welches Episodenbild verwendet)",
      TitleCardAddOverlay:
        "Auf true setzen, um die definierte Titelkarten-Overlay-Datei zum Titelkartenbild hinzuzufügen",
      TitleCardAddBorder:
        "Auf true setzen, um einen Rahmen zum Titelkartenbild hinzuzufügen",
      TitleCardBordercolor: "Farbe des Rahmens auf Titelkarten",
      TitleCardBorderwidth: "Rahmenbreite in Pixeln für Titelkarten",
      TitleCardBackgroundFallback:
        "Auf false setzen, wenn Sie Hintergrund-Fallback für Titelkartenbilder überspringen möchten, wenn keine Titelkarte gefunden wurde",

      // TitleCardTitleTextPart
      TitleCardTitleFontAllCaps:
        "Auf true setzen für Großbuchstaben-Episodentiteltext auf Titelkarten, sonst false",
      TitleCardTitleAddEPTitleText:
        "Auf true setzen, um Episodentiteltext zum Titelkartenbild hinzuzufügen",
      TitleCardTitleFontcolor:
        "Farbe des Episodentitel-Schrifttexts auf Titelkarten",
      TitleCardTitleMinPointSize:
        "Minimale Größe des Episodentiteltexts im Titelkartenbild",
      TitleCardTitleMaxPointSize:
        "Maximale Größe des Episodentiteltexts im Titelkartenbild",
      TitleCardTitleMaxWidth:
        "Maximale Breite der Episodentitel-Textbox im Titelkartenbild",
      TitleCardTitleMaxHeight:
        "Maximale Höhe der Episodentitel-Textbox im Titelkartenbild",
      TitleCardTitleTextOffset:
        "Episodentitel-Textbox-Versatz vom unteren Rand des Titelkartenbildes (Format +200 oder -150 verwenden)",
      TitleCardTitleAddTextStroke:
        "Auf true setzen, um Kontur/Umrandung zum Episodentiteltext auf Titelkarten hinzuzufügen",
      TitleCardTitleStrokecolor:
        "Farbe der Episodentiteltext-Kontur/Umrandung auf Titelkarten",
      TitleCardTitleStrokewidth:
        "Konturbreite in Pixeln für Episodentiteltext auf Titelkarten",
      TitleCardTitleLineSpacing:
        "Höhe zwischen Zeilen des Episodentiteltexts auf Titelkarten anpassen (Standard ist 0)",
      TitleCardTitleTextGravity:
        "Gibt die Episodentiteltext-Ausrichtung innerhalb der Textbox auf Titelkarten an (Standard ist south)",

      // TitleCardEPTextPart
      TitleCardEPSeasonTCText:
        "Sie können den Standardtext für 'Season' festlegen, der auf Titelkarten erscheint (z.B. 'STAFFEL' für Deutsch, 'SÄSONG' für Schwedisch)",
      TitleCardEPEpisodeTCText:
        "Sie können den Standardtext für 'Episode' festlegen, der auf Titelkarten erscheint (z.B. 'EPISODE', 'AVSNITT' für Schwedisch)",
      TitleCardEPFontAllCaps:
        "Auf true setzen für Großbuchstaben-Episodennummerntext auf Titelkarten, sonst false",
      TitleCardEPAddEPText:
        "Auf true setzen, um Episodennummerntext (Staffel X • Episode Y) zum Titelkartenbild hinzuzufügen",
      TitleCardEPFontcolor:
        "Farbe des Episodennummern-Schrifttexts auf Titelkarten",
      TitleCardEPMinPointSize:
        "Minimale Größe des Episodennummerntexts im Titelkartenbild",
      TitleCardEPMaxPointSize:
        "Maximale Größe des Episodennummerntexts im Titelkartenbild",
      TitleCardEPMaxWidth:
        "Maximale Breite der Episodennummern-Textbox im Titelkartenbild",
      TitleCardEPMaxHeight:
        "Maximale Höhe der Episodennummern-Textbox im Titelkartenbild",
      TitleCardEPTextOffset:
        "Episodennummern-Textbox-Versatz vom unteren Rand des Titelkartenbildes (Format +200 oder -150 verwenden)",
      TitleCardEPAddTextStroke:
        "Auf true setzen, um Kontur/Umrandung zum Episodennummerntext auf Titelkarten hinzuzufügen",
      TitleCardEPStrokecolor:
        "Farbe der Episodennummerntext-Kontur/Umrandung auf Titelkarten",
      TitleCardEPStrokewidth:
        "Konturbreite in Pixeln für Episodennummerntext auf Titelkarten",
      TitleCardEPLineSpacing:
        "Höhe zwischen Zeilen des Episodennummerntexts auf Titelkarten anpassen (Standard ist 0)",
      TitleCardEPTextGravity:
        "Gibt die Episodennummerntext-Ausrichtung innerhalb der Textbox auf Titelkarten an (Standard ist south)",

      // ShowTitleOnSeasonPosterPart
      ShowTitleAddShowTitletoSeason:
        "Wenn auf true gesetzt, wird Serientitel zum Staffelposter hinzugefügt (Standard: false)",
      ShowTitleFontAllCaps:
        "Auf true setzen für Großbuchstaben-Serientiteltext auf Staffelpostern, sonst false",
      ShowTitleAddTextStroke:
        "Auf true setzen, um Kontur/Umrandung zum Serientiteltext auf Staffelpostern hinzuzufügen",
      ShowTitleStrokecolor:
        "Farbe der Serientiteltext-Kontur/Umrandung auf Staffelpostern",
      ShowTitleStrokewidth:
        "Konturbreite in Pixeln für Serientiteltext auf Staffelpostern",
      ShowTitleFontcolor:
        "Farbe des Serientitel-Schrifttexts auf Staffelpostern",
      ShowTitleMinPointSize:
        "Minimale Größe des Serientiteltexts auf Staffelpostern",
      ShowTitleMaxPointSize:
        "Maximale Größe des Serientiteltexts auf Staffelpostern",
      ShowTitleMaxWidth:
        "Maximale Breite der Serientitel-Textbox auf Staffelpostern",
      ShowTitleMaxHeight:
        "Maximale Höhe der Serientitel-Textbox auf Staffelpostern",
      ShowTitleTextOffset:
        "Serientitel-Textbox-Versatz vom unteren Rand des Staffelposters (Format +200 oder -150 verwenden)",
      ShowTitleLineSpacing:
        "Höhe zwischen Zeilen des Serientiteltexts auf Staffelpostern anpassen (Standard ist 0)",
      ShowTitleTextGravity:
        "Gibt die Serientiteltext-Ausrichtung innerhalb der Textbox auf Staffelpostern an (Standard ist south)",

      // CollectionTitlePosterPart
      CollectionTitleAddCollectionTitle:
        "Auf true setzen, um Sammlungstiteltext zu Sammlungspostern hinzuzufügen",
      CollectionTitleCollectionTitle:
        "Der als Sammlungstitel anzuzeigende Text (z.B. 'COLLECTION', 'SAMMLUNG')",
      CollectionTitleFontAllCaps:
        "Auf true setzen für Großbuchstaben-Sammlungstiteltext, sonst false",
      CollectionTitleAddTextStroke:
        "Auf true setzen, um Kontur/Umrandung zum Sammlungstiteltext hinzuzufügen",
      CollectionTitleStrokecolor:
        "Farbe der Sammlungstiteltext-Kontur/Umrandung",
      CollectionTitleStrokewidth:
        "Konturbreite in Pixeln für Sammlungstiteltext",
      CollectionTitleFontcolor: "Farbe des Sammlungstitel-Schrifttexts",
      CollectionTitleMinPointSize: "Minimale Größe des Sammlungstiteltexts",
      CollectionTitleMaxPointSize: "Maximale Größe des Sammlungstiteltexts",
      CollectionTitleMaxWidth: "Maximale Breite der Sammlungstitel-Textbox",
      CollectionTitleMaxHeight: "Maximale Höhe der Sammlungstitel-Textbox",
      CollectionTitleTextOffset:
        "Sammlungstitel-Textbox-Versatz vom unteren Rand des Posters (Format +200 oder -150 verwenden)",
      CollectionTitleLineSpacing:
        "Höhe zwischen Zeilen des Sammlungstiteltexts anpassen (Standard ist 0)",
      CollectionTitleTextGravity:
        "Gibt die Sammlungstiteltext-Ausrichtung innerhalb der Textbox an (Standard ist south)",

      // CollectionPosterOverlayPart
      CollectionPosterFontAllCaps:
        "Auf true setzen für Großbuchstaben-Text auf Sammlungspostern, sonst false",
      CollectionPosterAddBorder:
        "Auf true setzen, um einen Rahmen zum Sammlungsposterbild hinzuzufügen",
      CollectionPosterAddText:
        "Auf true setzen, um Text zum Sammlungsposterbild hinzuzufügen",
      CollectionPosterAddTextStroke:
        "Auf true setzen, um Kontur/Umrandung zum Text auf Sammlungspostern hinzuzufügen",
      CollectionPosterStrokecolor:
        "Farbe der Textkontur/Umrandung auf Sammlungspostern",
      CollectionPosterStrokewidth: "Konturbreite in Pixeln für Sammlungsposter",
      CollectionPosterAddOverlay:
        "Auf true setzen, um die definierte Overlay-Datei zum Sammlungsposterbild hinzuzufügen",
      CollectionPosterFontcolor: "Farbe des Schrifttexts auf Sammlungspostern",
      CollectionPosterBordercolor: "Farbe des Rahmens auf Sammlungspostern",
      CollectionPosterMinPointSize: "Minimale Textgröße im Sammlungsposter",
      CollectionPosterMaxPointSize: "Maximale Textgröße im Sammlungsposter",
      CollectionPosterBorderwidth: "Rahmenbreite in Pixeln für Sammlungsposter",
      CollectionPosterMaxWidth:
        "Maximale Breite der Textbox auf dem Sammlungsposter",
      CollectionPosterMaxHeight:
        "Maximale Höhe der Textbox auf dem Sammlungsposter",
      CollectionPosterTextOffset:
        "Textbox-Versatz vom unteren Rand des Sammlungsposters (Format +200 oder -150 verwenden)",
      CollectionPosterLineSpacing:
        "Höhe zwischen Textzeilen auf Sammlungspostern anpassen (Standard ist 0)",
      CollectionPosterTextGravity:
        "Gibt die Textausrichtung innerhalb der Textbox auf Sammlungspostern an (Standard ist south)",
    },
    fr: {
      // WebUI Settings
      basicAuthEnabled:
        "Activer l'authentification de base pour protéger l'interface Web. Définir sur true pour exiger une connexion par nom d'utilisateur/mot de passe (Par défaut: false)",
      basicAuthUsername:
        "Nom d'utilisateur pour l'authentification de base. Changez-le de 'admin' par défaut pour une meilleure sécurité (Par défaut: admin)",
      basicAuthPassword:
        "Mot de passe pour l'authentification de base. IMPORTANT: Changez-le de 'posterizarr' par défaut avant d'activer l'authentification! (Par défaut: posterizarr)",
      webuiLogLevel:
        "Définir le niveau de journalisation pour le serveur backend WebUI. DEBUG: Journalisation la plus détaillée; INFO: Informations générales (par défaut); WARNING: Uniquement les avertissements et les erreurs; ERROR: Uniquement les erreurs; CRITICAL: Uniquement les erreurs critiques",
      // ApiPart
      tvdbapi:
        "Votre clé API de projet TVDB. Si vous êtes abonné TVDB, vous pouvez ajouter votre PIN à la fin de votre clé API au format VotreClé#VotrePIN",
      tmdbtoken: "Votre jeton d'accès en lecture API TMDB (le très long)",
      FanartTvAPIKey: "Votre clé API personnelle Fanart.tv",
      PlexToken:
        "Votre jeton d'authentification Plex (Laisser vide si vous n'utilisez pas Plex)",
      JellyfinAPIKey:
        "Votre clé API Jellyfin (Vous pouvez créer une clé API dans Jellyfin sous Paramètres > Avancé > Clés API)",
      EmbyAPIKey:
        "Votre clé API Emby (Vous pouvez créer une clé API dans Emby sous Paramètres > Avancé > Clés API)",
      FavProvider:
        "Définir votre fournisseur préféré: tmdb (recommandé), fanart, tvdb, ou plex (non recommandé pour textless)",
      tmdb_vote_sorting:
        "Tri des images via l'API TMDB: vote_average, vote_count, ou primary (vue TMDB par défaut)",
      PreferredLanguageOrder:
        "Spécifier les préférences de langue. Par défaut xx,en,de (xx est Textless). Utiliser les codes de langue ISO 3166-1 à 2 chiffres. Définir sur 'xx' uniquement pour rechercher des affiches sans texte",
      PreferredSeasonLanguageOrder:
        "Spécifier les préférences de langue pour les saisons. Par défaut xx,en,de (xx est Textless). Utiliser les codes de langue ISO 3166-1 à 2 chiffres",
      PreferredBackgroundLanguageOrder:
        "Spécifier les préférences de langue pour les arrière-plans. Par défaut PleaseFillMe (prendra votre ordre de langue d'affiche). Définir sur 'xx' uniquement pour rechercher sans texte",
      PreferredTCLanguageOrder:
        "Spécifier les préférences de langue pour les cartes de titre/images d'épisodes. Par défaut PleaseFillMe (prendra votre ordre de langue d'affiche). Utiliser les codes de langue ISO 3166-1 à 2 chiffres",
      WidthHeightFilter:
        "Si défini sur true, un filtre de résolution supplémentaire sera appliqué aux affiches/arrière-plans (TMDB et TVDB) et aux cartes de titre (TMDB uniquement)",
      PosterMinWidth:
        "Filtre de largeur minimale d'affiche - supérieur ou égal à la valeur spécifiée (par défaut: 2000)",
      PosterMinHeight:
        "Filtre de hauteur minimale d'affiche - supérieur ou égal à la valeur spécifiée (par défaut: 3000)",
      BgTcMinWidth:
        "Filtre de largeur minimale arrière-plan/carte de titre - supérieur ou égal à la valeur spécifiée (par défaut: 3840)",
      BgTcMinHeight:
        "Filtre de hauteur minimale arrière-plan/carte de titre - supérieur ou égal à la valeur spécifiée (par défaut: 2160)",

      // PlexPart
      PlexLibstoExclude:
        "Bibliothèques Plex, par nom, à exclure du traitement (liste séparée par des virgules)",
      PlexUrl:
        "URL du serveur Plex (par ex., http://192.168.1.1:32400 ou http://monserveurplex.com:32400). Ce champ n'est activé que lorsque Plex est sélectionné comme serveur multimédia actif",
      UsePlex:
        "Activer Plex comme serveur multimédia. NOTE: UN SEUL serveur multimédia peut être actif à la fois (Plex, Jellyfin ou Emby)",
      PlexUploadExistingAssets:
        "Si défini sur true, le script vérifiera les ressources locales et les téléchargera sur Plex, mais uniquement si Plex n'a pas déjà de données EXIF de Posterizarr, Kometa ou TCM",
      PlexUpload:
        "Si défini sur true, Posterizarr téléchargera directement l'illustration sur Plex (pratique si vous n'utilisez pas Kometa)",

      // JellyfinPart
      JellyfinLibstoExclude:
        "Bibliothèques Jellyfin, par nom de dossier local, à exclure du traitement (liste séparée par des virgules)",
      JellyfinUrl:
        "URL du serveur Jellyfin (par ex., http://192.168.1.1:8096 ou http://monserveurplex.com:8096). Ce champ est activé lorsque Jellyfin est sélectionné comme serveur multimédia actif OU lorsque JellySync est activé",
      UseJellyfin:
        "Activer Jellyfin comme serveur multimédia. NOTE: UN SEUL serveur multimédia peut être actif à la fois (Plex, Jellyfin ou Emby)",
      UseJellySync:
        "Activer la synchronisation avec votre serveur Jellyfin. Lorsqu'activé, les champs URL Jellyfin et clé API deviennent disponibles pour la configuration. NOTE: Cette bascule est désactivée lorsque Jellyfin est sélectionné comme serveur multimédia actif",
      JellyfinUploadExistingAssets:
        "Si défini sur true, le script vérifiera les ressources locales et les téléchargera sur Jellyfin, mais uniquement si Jellyfin n'a pas déjà de données EXIF de Posterizarr, Kometa ou TCM. NOTE: Cela nécessite que UseJellyfin soit activé",
      JellyfinReplaceThumbwithBackdrop:
        "Si défini sur true, le script remplacera l'image miniature par l'image d'arrière-plan. Cela ne se produit que si BackgroundPosters est également défini sur true. NOTE: Cela nécessite que UseJellyfin soit activé",

      // EmbyPart
      EmbyLibstoExclude:
        "Bibliothèques Emby, par nom de dossier local, à exclure du traitement (liste séparée par des virgules)",
      EmbyUrl:
        "URL du serveur Emby (par ex., http://192.168.1.1:8096/emby ou http://monserveurplex.com:8096/emby). Ce champ est activé lorsque Emby est sélectionné comme serveur multimédia actif OU lorsque EmbySync est activé",
      UseEmby:
        "Activer Emby comme serveur multimédia. NOTE: UN SEUL serveur multimédia peut être actif à la fois (Plex, Jellyfin ou Emby)",
      UseEmbySync:
        "Activer la synchronisation avec votre serveur Emby. Lorsqu'activé, les champs URL Emby et clé API deviennent disponibles pour la configuration. NOTE: Cette bascule est désactivée lorsque Emby est sélectionné comme serveur multimédia actif",
      EmbyUploadExistingAssets:
        "Si défini sur true, le script vérifiera les ressources locales et les téléchargera sur Emby, mais uniquement si Emby n'a pas déjà de données EXIF de Posterizarr, Kometa ou TCM. NOTE: Cela nécessite que UseEmby soit activé",
      EmbyReplaceThumbwithBackdrop:
        "Si défini sur true, le script remplacera l'image miniature par l'image d'arrière-plan. Cela ne se produit que si BackgroundPosters est également défini sur true. NOTE: Cela nécessite que UseEmby soit activé",

      // Notification
      SendNotification:
        "Définir sur true si vous souhaitez envoyer des notifications via Discord ou Apprise, sinon false",
      AppriseUrl:
        "Uniquement possible sur Docker - URL pour le fournisseur Apprise. Voir la documentation Apprise pour les détails",
      Discord: "URL Webhook Discord pour les notifications",
      DiscordUserName:
        "Nom d'utilisateur pour le webhook Discord (par défaut est Posterizarr)",
      UseUptimeKuma:
        "Définir sur true si vous souhaitez envoyer un webhook à Uptime-Kuma",
      UptimeKumaUrl: "URL Webhook Uptime-Kuma",

      // PrerequisitePart
      AssetPath:
        "Chemin pour stocker les affiches générées. Sur Docker, cela devrait être /assets",
      BackupPath:
        "Chemin pour stocker/télécharger les affiches Plex lors de l'utilisation du mode de sauvegarde",
      ManualAssetPath:
        "Si des ressources sont placées dans ce répertoire avec la convention de nommage exacte, elles seront préférées (doit suivre la même convention de nommage que /assets)",
      SkipAddText:
        "Si défini sur true, Posterizarr sautera l'ajout de texte à l'affiche si elle est signalée comme 'Affiche avec texte' par le fournisseur",
      SkipAddTextAndOverlay:
        "S’il est défini sur vrai, Posterizarr ignorera l’ajout de texte/superposition à l’affiche si elle est marquée comme 'Affiche avec texte' par le fournisseur.",
      FollowSymlink:
        "Si défini sur true, Posterizarr suivra les liens symboliques dans les répertoires spécifiés lors de la création de la table de hachage",
      ForceRunningDeletion:
        "Si défini sur true, Posterizarr supprimera automatiquement le fichier Running. ATTENTION: Peut entraîner plusieurs exécutions simultanées partageant le même répertoire temporaire",
      AutoUpdatePosterizarr:
        "Si défini sur true, Posterizarr se mettra à jour vers la dernière version (Uniquement pour les systèmes non-Docker)",
      show_skipped:
        "Si défini sur true, la journalisation détaillée des ressources déjà créées sera affichée. Sur les grandes bibliothèques, cela peut sembler bloquer le script",
      magickinstalllocation:
        "Le chemin vers l'installation d'ImageMagick où se trouve magick.exe. Si vous utilisez la version portable, laissez './magick'. Le conteneur gère cela automatiquement",
      maxLogs:
        "Nombre de dossiers de journaux que vous souhaitez conserver dans le dossier RotatedLogs (Historique des journaux)",
      logLevel:
        "Définit la verbosité de la journalisation. 1 = Avertissement/Erreur. 2 = Info/Avertissement/Erreur (par défaut). 3 = Info/Avertissement/Erreur/Débogage (le plus détaillé)",
      font: "Nom du fichier de police par défaut pour les superpositions de texte",
      RTLFont:
        "Nom du fichier de police de droite à gauche pour les langues RTL (arabe, hébreu, etc.)",
      backgroundfont: "Nom du fichier de police pour le texte d'arrière-plan",
      titlecardfont: "Nom du fichier de police pour le texte de carte de titre",
      collectionfont: "Nom du fichier de police pour les titres de collection",
      overlayfile:
        "Nom du fichier de superposition par défaut (par ex., overlay.png)",
      seasonoverlayfile: "Nom du fichier de superposition d'affiche de saison",
      backgroundoverlayfile: "Nom du fichier de superposition d'arrière-plan",
      titlecardoverlayfile: "Nom du fichier de superposition de carte de titre",
      collectionoverlayfile: "Nom du fichier de superposition de collection",
      poster4k:
        "Nom du fichier de superposition d'affiche 4K (la superposition doit correspondre aux dimensions d'affiche 2000x3000)",
      Poster1080p:
        "Nom du fichier de superposition d'affiche 1080p (la superposition doit correspondre aux dimensions d'affiche 2000x3000)",
      Background4k:
        "Nom du fichier de superposition d'arrière-plan 4K (la superposition doit correspondre aux dimensions d'arrière-plan 3840x2160)",
      Background1080p:
        "Nom du fichier de superposition d'arrière-plan 1080p (la superposition doit correspondre aux dimensions d'arrière-plan 3840x2160)",
      TC4k: "Nom du fichier de superposition de carte de titre 4K (la superposition doit correspondre aux dimensions 3840x2160)",
      TC1080p:
        "Nom du fichier de superposition de carte de titre 1080p (la superposition doit correspondre aux dimensions 3840x2160)",
      "4KDoVi":
        "Superposition spécifique pour les affiches 4K Dolby Vision. (2000x3000)",
      "4KHDR10":
        "Superposition spécifique pour les affiches 4K HDR10. (2000x3000)",
      "4KDoViHDR10":
        "Superposition spécifique pour les affiches 4K DoVi & HDR10. (2000x3000)",
      "4KDoViBackground":
        "Superposition spécifique pour les arrière-plans 4K Dolby Vision. (3840x2160)",
      "4KHDR10Background":
        "Superposition spécifique pour les arrière-plans 4K HDR10. (3840x2160)",
      "4KDoViHDR10Background":
        "Superposition spécifique pour les arrière-plans 4K DoVi & HDR10. (3840x2160)",
      "4KDoViTC":
        "Superposition spécifique pour les cartes de titre 4K Dolby Vision. (3840x2160)",
      "4KHDR10TC":
        "Superposition spécifique pour les cartes de titre 4K HDR10. (3840x2160)",
      "4KDoViHDR10TC":
        "Superposition spécifique pour les cartes de titre 4K DoVi & HDR10. (3840x2160)",
      UsePosterResolutionOverlays:
        "Définir sur true pour appliquer une superposition spécifique avec résolution pour les affiches 4k/1080p. Si vous voulez uniquement 4k, ajoutez également votre fichier de superposition par défaut pour Poster1080p",
      UseBackgroundResolutionOverlays:
        "Définir sur true pour appliquer une superposition spécifique avec résolution pour les arrière-plans 4k/1080p. Si vous voulez uniquement 4k, ajoutez également votre fichier de superposition par défaut pour Background1080p",
      UseTCResolutionOverlays:
        "Définir sur true pour appliquer une superposition spécifique avec résolution pour les cartes de titre 4k/1080p. Si vous voulez uniquement 4k, ajoutez votre fichier de superposition par défaut pour TC1080p",
      LibraryFolders:
        "Définir sur false pour une structure de ressources dans un dossier plat ou true pour diviser en dossiers de médias de bibliothèque comme Kometa en a besoin",
      Posters: "Définir sur true pour créer des affiches de films/séries",
      SeasonPosters:
        "Définir sur true pour créer également des affiches de saison",
      BackgroundPosters:
        "Définir sur true pour créer également des affiches d'arrière-plan",
      TitleCards: "Définir sur true pour créer également des cartes de titre",
      SkipTBA:
        "Définir sur true pour ignorer la création de carte de titre si le texte du titre est 'TBA'",
      SkipJapTitle:
        "Définir sur true pour ignorer la création de carte de titre si le texte du titre est en japonais ou chinois",
      AssetCleanup:
        "Définir sur true pour nettoyer les ressources qui ne sont plus dans Plex. IMPORTANT: Risque de perte de données des bibliothèques exclues - assurez-vous que toutes les bibliothèques de ressources actives sont incluses",
      AutoUpdateIM:
        "Définir sur true pour mettre à jour automatiquement la version portable d'ImageMagick (Ne fonctionne pas avec Docker/Unraid). Avertissement: Les versions non testées peuvent causer des problèmes",
      NewLineOnSpecificSymbols:
        "Définir sur true pour activer l'insertion automatique d'un caractère de nouvelle ligne à chaque occurrence de symboles spécifiques dans NewLineSymbols dans le texte du titre",
      NewLineSymbols:
        "Une liste de symboles qui déclencheront une insertion de nouvelle ligne lorsque NewLineOnSpecificSymbols est true. Séparez chaque symbole par une virgule (par ex., ' - ', ':')",
      SymbolsToKeepOnNewLine:
        "Une liste de symboles qui déclenchent une insertion de nouvelle ligne mais ne sont pas remplacés par le paramètre NewLineOnSpecificSymbols. Cela s'applique uniquement si le symbole est également inclus dans NewLineSymbols. Séparez chaque symbole par une virgule (par ex., '-', ':')",
      DisableHashValidation:
        "Définir sur true pour ignorer la validation de hachage (Par défaut: false). Note: Cela peut produire du gonflement, car chaque élément sera re-téléchargé sur les serveurs multimédias",
      DisableOnlineAssetFetch:
        "Définir sur true pour ignorer toutes les recherches en ligne et utiliser uniquement les ressources disponibles localement (Par défaut: false)",

      // OverlayPart
      ImageProcessing:
        "Définir sur true si vous voulez la partie ImageMagick (texte, superposition et/ou bordure); si false, il télécharge uniquement les affiches",
      outputQuality:
        "Qualité de sortie d'image (par défaut 92%). Définir à 100% double la taille de l'image",

      // PosterOverlayPart
      PosterFontAllCaps:
        "Définir sur true pour tout en majuscules sur les affiches, sinon false",
      PosterAddBorder:
        "Définir sur true pour ajouter une bordure à l'image d'affiche",
      PosterAddText:
        "Définir sur true pour ajouter du texte à l'image d'affiche",
      PosterAddOverlay:
        "Définir sur true pour ajouter le fichier de superposition défini à l'image d'affiche",
      PosterFontcolor:
        "Couleur du texte de police sur les affiches (par ex., #FFFFFF pour blanc)",
      PosterBordercolor:
        "Couleur de la bordure sur les affiches (par ex., #000000 pour noir)",
      PosterMinPointSize: "Taille minimale du texte dans l'affiche (en points)",
      PosterMaxPointSize: "Taille maximale du texte dans l'affiche (en points)",
      PosterBorderwidth: "Largeur de bordure en pixels",
      PosterMaxWidth: "Largeur maximale de la zone de texte sur l'affiche",
      PosterMaxHeight: "Hauteur maximale de la zone de texte sur l'affiche",
      PosterTextOffset:
        "Décalage de la zone de texte depuis le bas de l'image (utiliser le format +200 ou -150)",
      PosterAddTextStroke: "Définir sur true pour ajouter un contour au texte",
      PosterStrokecolor:
        "Couleur du contour de texte (par ex., #000000 pour noir)",
      PosterStrokewidth: "Largeur du contour en pixels",
      PosterLineSpacing:
        "Ajuster la hauteur entre les lignes de texte (Par défaut est 0)",
      PosterTextGravity:
        "Spécifie l'alignement du texte dans la zone de texte (Par défaut est south = bas centre)",

      // SeasonPosterOverlayPart
      SeasonPosterFontAllCaps:
        "Définir sur true pour tout en majuscules sur les affiches de saison, sinon false",
      SeasonPosterAddBorder:
        "Définir sur true pour ajouter une bordure à l'image d'affiche de saison",
      SeasonPosterAddText:
        "Définir sur true pour ajouter du texte à l'image d'affiche de saison",
      SeasonPosterAddOverlay:
        "Définir sur true pour ajouter le fichier de superposition défini à l'image d'affiche de saison",
      SeasonPosterFontcolor:
        "Couleur du texte de police sur les affiches de saison",
      SeasonPosterBordercolor:
        "Couleur de la bordure sur les affiches de saison",
      SeasonPosterMinPointSize:
        "Taille minimale du texte dans l'affiche de saison",
      SeasonPosterMaxPointSize:
        "Taille maximale du texte dans l'affiche de saison",
      SeasonPosterBorderwidth:
        "Largeur de bordure en pixels pour les affiches de saison",
      SeasonPosterMaxWidth:
        "Largeur maximale de la zone de texte sur l'affiche de saison",
      SeasonPosterMaxHeight:
        "Hauteur maximale de la zone de texte sur l'affiche de saison",
      SeasonPosterTextOffset:
        "Décalage de la zone de texte depuis le bas de l'affiche de saison (utiliser le format +200 ou -150)",
      SeasonPosterAddTextStroke:
        "Définir sur true pour ajouter un contour au texte sur les affiches de saison",
      SeasonPosterStrokecolor:
        "Couleur du contour de texte sur les affiches de saison",
      SeasonPosterStrokewidth:
        "Largeur du contour en pixels pour les affiches de saison",
      SeasonPosterLineSpacing:
        "Ajuster la hauteur entre les lignes de texte sur les affiches de saison (Par défaut est 0)",
      SeasonPosterShowFallback:
        "Définir sur true si vous souhaitez revenir à l'affiche de série si aucune affiche de saison n'a été trouvée",
      SeasonPosterTextGravity:
        "Spécifie l'alignement du texte dans la zone de texte sur les affiches de saison (Par défaut est south)",

      // BackgroundOverlayPart
      BackgroundFontAllCaps:
        "Définir sur true pour tout en majuscules sur les arrière-plans, sinon false",
      BackgroundAddOverlay:
        "Définir sur true pour ajouter le fichier de superposition d'arrière-plan défini à l'image d'arrière-plan",
      BackgroundAddBorder:
        "Définir sur true pour ajouter une bordure à l'image d'arrière-plan",
      BackgroundAddText:
        "Définir sur true pour ajouter du texte à l'image d'arrière-plan",
      BackgroundFontcolor: "Couleur du texte de police sur les arrière-plans",
      BackgroundBordercolor: "Couleur de la bordure sur les arrière-plans",
      BackgroundMinPointSize:
        "Taille minimale du texte dans l'image d'arrière-plan",
      BackgroundMaxPointSize:
        "Taille maximale du texte dans l'image d'arrière-plan",
      BackgroundBorderwidth:
        "Largeur de bordure en pixels pour les arrière-plans",
      BackgroundMaxWidth:
        "Largeur maximale de la zone de texte dans l'image d'arrière-plan",
      BackgroundMaxHeight:
        "Hauteur maximale de la zone de texte dans l'image d'arrière-plan",
      BackgroundTextOffset:
        "Décalage de la zone de texte depuis le bas de l'image d'arrière-plan (utiliser le format +200 ou -150)",
      BackgroundAddTextStroke:
        "Définir sur true pour ajouter un contour au texte sur les arrière-plans",
      BackgroundStrokecolor:
        "Couleur du contour de texte sur les arrière-plans",
      BackgroundStrokewidth:
        "Largeur du contour en pixels pour les arrière-plans",
      BackgroundLineSpacing:
        "Ajuster la hauteur entre les lignes de texte sur les arrière-plans (Par défaut est 0)",
      BackgroundTextGravity:
        "Spécifie l'alignement du texte dans la zone de texte sur les arrière-plans (Par défaut est south)",

      // TitleCardOverlayPart
      TitleCardUseBackgroundAsTitleCard:
        "Définir sur true si vous préférez l'arrière-plan de série comme carte de titre (par défaut est false, qui utilise l'image d'épisode)",
      TitleCardAddOverlay:
        "Définir sur true pour ajouter le fichier de superposition de carte de titre défini à l'image de carte de titre",
      TitleCardAddBorder:
        "Définir sur true pour ajouter une bordure à l'image de carte de titre",
      TitleCardBordercolor: "Couleur de la bordure sur les cartes de titre",
      TitleCardBorderwidth:
        "Largeur de bordure en pixels pour les cartes de titre",
      TitleCardBackgroundFallback:
        "Définir sur false si vous souhaitez ignorer le repli d'arrière-plan pour les images de carte de titre si aucune carte de titre n'a été trouvée",

      // TitleCardTitleTextPart
      TitleCardTitleFontAllCaps:
        "Définir sur true pour tout en majuscules pour le texte du titre d'épisode sur les cartes de titre, sinon false",
      TitleCardTitleAddEPTitleText:
        "Définir sur true pour ajouter le texte du titre d'épisode à l'image de carte de titre",
      TitleCardTitleFontcolor:
        "Couleur du texte de police du titre d'épisode sur les cartes de titre",
      TitleCardTitleMinPointSize:
        "Taille minimale du texte du titre d'épisode dans l'image de carte de titre",
      TitleCardTitleMaxPointSize:
        "Taille maximale du texte du titre d'épisode dans l'image de carte de titre",
      TitleCardTitleMaxWidth:
        "Largeur maximale de la zone de texte du titre d'épisode dans l'image de carte de titre",
      TitleCardTitleMaxHeight:
        "Hauteur maximale de la zone de texte du titre d'épisode dans l'image de carte de titre",
      TitleCardTitleTextOffset:
        "Décalage de la zone de texte du titre d'épisode depuis le bas de l'image de carte de titre (utiliser le format +200 ou -150)",
      TitleCardTitleAddTextStroke:
        "Définir sur true pour ajouter un contour au texte du titre d'épisode sur les cartes de titre",
      TitleCardTitleStrokecolor:
        "Couleur du contour du texte du titre d'épisode sur les cartes de titre",
      TitleCardTitleStrokewidth:
        "Largeur du contour en pixels pour le texte du titre d'épisode sur les cartes de titre",
      TitleCardTitleLineSpacing:
        "Ajuster la hauteur entre les lignes du texte du titre d'épisode sur les cartes de titre (Par défaut est 0)",
      TitleCardTitleTextGravity:
        "Spécifie l'alignement du texte du titre d'épisode dans la zone de texte sur les cartes de titre (Par défaut est south)",

      // TitleCardEPTextPart
      TitleCardEPSeasonTCText:
        "Texte personnalisé pour afficher la saison sur la carte de titre (par ex., 'S' pour S01)",
      TitleCardEPEpisodeTCText:
        "Texte personnalisé pour afficher l'épisode sur la carte de titre (par ex., 'E' pour E01)",
      TitleCardEPFontAllCaps:
        "Définir sur true pour tout en majuscules pour le texte d'épisode sur les cartes de titre, sinon false",
      TitleCardEPAddEPText:
        "Définir sur true pour ajouter le texte d'épisode à l'image de carte de titre",
      TitleCardEPFontcolor:
        "Couleur du texte de police d'épisode sur les cartes de titre",
      TitleCardEPMinPointSize:
        "Taille minimale du texte d'épisode dans l'image de carte de titre",
      TitleCardEPMaxPointSize:
        "Taille maximale du texte d'épisode dans l'image de carte de titre",
      TitleCardEPMaxWidth:
        "Largeur maximale de la zone de texte d'épisode dans l'image de carte de titre",
      TitleCardEPMaxHeight:
        "Hauteur maximale de la zone de texte d'épisode dans l'image de carte de titre",
      TitleCardEPTextOffset:
        "Décalage de la zone de texte d'épisode depuis le bas de l'image de carte de titre (utiliser le format +200 ou -150)",
      TitleCardEPAddTextStroke:
        "Définir sur true pour ajouter un contour au texte d'épisode sur les cartes de titre",
      TitleCardEPStrokecolor:
        "Couleur du contour du texte d'épisode sur les cartes de titre",
      TitleCardEPStrokewidth:
        "Largeur du contour en pixels pour le texte d'épisode sur les cartes de titre",
      TitleCardEPLineSpacing:
        "Ajuster la hauteur entre les lignes du texte d'épisode sur les cartes de titre (Par défaut est 0)",
      TitleCardEPTextGravity:
        "Spécifie l'alignement du texte d'épisode dans la zone de texte sur les cartes de titre (Par défaut est south)",

      // ShowTitleOnSeasonPosterPart
      ShowTitleAddShowTitletoSeason:
        "Définir sur true pour ajouter le titre de série aux affiches de saison",
      ShowTitleFontAllCaps:
        "Définir sur true pour tout en majuscules pour le titre de série sur les affiches de saison, sinon false",
      ShowTitleFontcolor:
        "Couleur du texte de police du titre de série sur les affiches de saison",
      ShowTitleMinPointSize:
        "Taille minimale du texte du titre de série sur les affiches de saison",
      ShowTitleMaxPointSize:
        "Taille maximale du texte du titre de série sur les affiches de saison",
      ShowTitleMaxWidth:
        "Largeur maximale de la zone de texte du titre de série sur les affiches de saison",
      ShowTitleMaxHeight:
        "Hauteur maximale de la zone de texte du titre de série sur les affiches de saison",
      ShowTitleTextOffset:
        "Décalage de la zone de texte du titre de série depuis le bas de l'affiche de saison (utiliser le format +200 ou -150)",
      ShowTitleAddTextStroke:
        "Définir sur true pour ajouter un contour au texte du titre de série sur les affiches de saison",
      ShowTitleStrokecolor:
        "Couleur du contour du texte du titre de série sur les affiches de saison",
      ShowTitleStrokewidth:
        "Largeur du contour en pixels pour le texte du titre de série sur les affiches de saison",
      ShowTitleLineSpacing:
        "Ajuster la hauteur entre les lignes du texte du titre de série sur les affiches de saison (Par défaut est 0)",
      ShowTitleTextGravity:
        "Spécifie l'alignement du texte du titre de série dans la zone de texte sur les affiches de saison (Par défaut est south)",

      // CollectionPosterOverlayPart
      CollectionPosterFontAllCaps:
        "Définir sur true pour tout en majuscules sur les affiches de collection, sinon false",
      CollectionPosterAddBorder:
        "Définir sur true pour ajouter une bordure à l'affiche de collection",
      CollectionPosterAddText:
        "Définir sur true pour ajouter du texte à l'affiche de collection",
      CollectionPosterAddTextStroke:
        "Définir sur true pour ajouter un contour au texte sur les affiches de collection",
      CollectionPosterAddOverlay:
        "Définir sur true pour ajouter le fichier de superposition défini à l'affiche de collection",
      CollectionPosterFontcolor:
        "Couleur du texte de police sur les affiches de collection",
      CollectionPosterBordercolor:
        "Couleur de la bordure sur les affiches de collection",
      CollectionPosterStrokecolor:
        "Couleur du contour du texte sur les affiches de collection",
      CollectionPosterMinPointSize:
        "Taille minimale du texte dans l'affiche de collection",
      CollectionPosterMaxPointSize:
        "Taille maximale du texte dans l'affiche de collection",
      CollectionPosterBorderwidth:
        "Largeur de bordure en pixels pour les affiches de collection",
      CollectionPosterStrokewidth:
        "Largeur du contour en pixels pour les affiches de collection",
      CollectionPosterTextOffset:
        "Décalage de la zone de texte depuis le bas de l'affiche de collection (utiliser le format +200 ou -150)",

      // CollectionTitlePosterPart
      CollectionTitleAddCollectionTitle:
        "Définir sur true pour ajouter le titre de collection aux affiches de collection",
      CollectionTitleFontAllCaps:
        "Définir sur true pour tout en majuscules pour le titre de collection, sinon false",
      CollectionTitleAddTextStroke:
        "Définir sur true pour ajouter un contour au texte du titre de collection",
      CollectionTitleFontcolor:
        "Couleur du texte de police du titre de collection",
      CollectionTitleStrokecolor:
        "Couleur du contour du texte du titre de collection",
      CollectionTitleMinPointSize:
        "Taille minimale du texte du titre de collection",
      CollectionTitleMaxPointSize:
        "Taille maximale du texte du titre de collection",
      CollectionTitleStrokewidth:
        "Largeur du contour en pixels pour le texte du titre de collection",
      CollectionTitleTextOffset:
        "Décalage de la zone de texte du titre de collection depuis le bas de l'affiche (utiliser le format +200 ou -150)",
      CollectionTitleMaxWidth:
        "Largeur maximale de la zone de texte sur l'affiche de collection",
      CollectionTitleMaxHeight:
        "Hauteur maximale de la zone de texte sur l'affiche de collection",
      CollectionTitleLineSpacing:
        "Ajuster la hauteur entre les lignes de texte sur les affiches de collection (Par défaut est 0)",
      CollectionTitleTextGravity:
        "Spécifie l'alignement du texte dans la zone de texte sur les affiches de collection (Par défaut est south)",
      CollectionPosterMaxWidth:
        "Largeur maximale de la zone de texte sur l'affiche de collection",
      CollectionPosterMaxHeight:
        "Hauteur maximale de la zone de texte sur l'affiche de collection",
      CollectionPosterLineSpacing:
        "Ajuster la hauteur entre les lignes de texte sur les affiches de collection (Par défaut est 0)",
      CollectionPosterTextGravity:
        "Spécifie l'alignement du texte dans la zone de texte sur les affiches de collection (Par défaut est south)",
    },
    it: {
      // WebUI Settings
      basicAuthEnabled:
        "Abilita l'autenticazione di base per proteggere l'interfaccia Web. Impostare su true per richiedere il login con username/password (Predefinito: false)",
      basicAuthUsername:
        "Nome utente per l'autenticazione di base. Cambialo dal valore predefinito 'admin' per una migliore sicurezza (Predefinito: admin)",
      basicAuthPassword:
        "Password per l'autenticazione di base. IMPORTANTE: Cambiala dal valore predefinito 'posterizarr' prima di abilitare l'autenticazione! (Predefinito: posterizarr)",
      webuiLogLevel:
        "Imposta il livello di log per il server backend WebUI. DEBUG: Log più dettagliato; INFO: Informazioni generali (predefinito); WARNING: Solo avvisi ed errori; ERROR: Solo errori; CRITICAL: Solo errori critici",
      // ApiPart
      tvdbapi:
        "La tua chiave API del progetto TVDB. Se sei un abbonato TVDB, puoi aggiungere il tuo PIN alla fine della tua chiave API nel formato TuaChiaveAPI#TuoPIN",
      tmdbtoken:
        "Il tuo token di accesso in lettura API TMDB (quello molto lungo)",
      FanartTvAPIKey: "La tua chiave API personale Fanart.tv",
      PlexToken:
        "Il tuo token di autenticazione Plex (Lascia vuoto se non usi Plex)",
      JellyfinAPIKey:
        "La tua chiave API Jellyfin (Puoi creare una chiave API da dentro Jellyfin in Impostazioni > Avanzate > Chiavi API)",
      EmbyAPIKey:
        "La tua chiave API Emby (Puoi creare una chiave API da dentro Emby in Impostazioni > Avanzate > Chiavi API)",
      FavProvider:
        "Imposta il tuo provider preferito: tmdb (consigliato), fanart, tvdb, o plex (non consigliato per textless)",
      tmdb_vote_sorting:
        "Ordinamento immagini tramite API TMDB: vote_average, vote_count, o primary (vista TMDB predefinita)",
      PreferredLanguageOrder:
        "Specifica le preferenze di lingua. Predefinito è xx,en,de (xx è Textless). Usa i codici lingua ISO 3166-1 a 2 cifre. Impostare su 'xx' solo per cercare poster senza testo",
      PreferredSeasonLanguageOrder:
        "Specifica le preferenze di lingua per le stagioni. Predefinito è xx,en,de (xx è Textless). Usa i codici lingua ISO 3166-1 a 2 cifre",
      PreferredBackgroundLanguageOrder:
        "Specifica le preferenze di lingua per gli sfondi. Predefinito è PleaseFillMe (prenderà l'ordine della lingua dei poster). Impostare su 'xx' solo per cercare senza testo",
      PreferredTCLanguageOrder:
        "Specifica le preferenze di lingua per le title card/immagini degli episodi. Predefinito è PleaseFillMe (prenderà l'ordine della lingua dei poster). Usa i codici lingua ISO 3166-1 a 2 cifre",
      WidthHeightFilter:
        "Se impostato su true, verrà applicato un filtro di risoluzione aggiuntivo ai poster/sfondi (TMDB e TVDB) e alle title card (solo TMDB)",
      PosterMinWidth:
        "Filtro larghezza minima poster - maggiore o uguale al valore specificato (predefinito: 2000)",
      PosterMinHeight:
        "Filtro altezza minima poster - maggiore o uguale al valore specificato (predefinito: 3000)",
      BgTcMinWidth:
        "Filtro larghezza minima sfondo/title card - maggiore o uguale al valore specificato (predefinito: 3840)",
      BgTcMinHeight:
        "Filtro altezza minima sfondo/title card - maggiore o uguale al valore specificato (predefinito: 2160)",

      // PlexPart
      PlexLibstoExclude:
        "Librerie Plex, per nome, da escludere dall'elaborazione (elenco separato da virgole)",
      PlexUrl:
        "URL del server Plex (es., http://192.168.1.1:32400 o http://mioserverplex.com:32400). Questo campo è abilitato solo quando Plex è selezionato come server multimediale attivo",
      UsePlex:
        "Abilita Plex come server multimediale. NOTA: Solo UN server multimediale può essere attivo alla volta (Plex, Jellyfin o Emby)",
      PlexUploadExistingAssets:
        "Se impostato su true, lo script verificherà le risorse locali e le caricherà su Plex, ma solo se Plex non ha già dati EXIF da Posterizarr, Kometa o TCM",
      PlexUpload:
        "Se impostato su true, Posterizarr caricherà direttamente l'artwork su Plex (utile se non usi Kometa)",

      // JellyfinPart
      JellyfinLibstoExclude:
        "Librerie Jellyfin, per nome cartella locale, da escludere dall'elaborazione (elenco separato da virgole)",
      JellyfinUrl:
        "URL del server Jellyfin (es., http://192.168.1.1:8096 o http://mioserverplex.com:8096). Questo campo è abilitato quando Jellyfin è selezionato come server multimediale attivo O quando JellySync è abilitato",
      UseJellyfin:
        "Abilita Jellyfin come server multimediale. NOTA: Solo UN server multimediale può essere attivo alla volta (Plex, Jellyfin o Emby)",
      UseJellySync:
        "Abilita la sincronizzazione con il tuo server Jellyfin. Quando abilitato, i campi URL Jellyfin e chiave API diventano disponibili per la configurazione. NOTA: Questo interruttore è disabilitato quando Jellyfin è selezionato come server multimediale attivo",
      JellyfinUploadExistingAssets:
        "Se impostato su true, lo script verificherà le risorse locali e le caricherà su Jellyfin, ma solo se Jellyfin non ha già dati EXIF da Posterizarr, Kometa o TCM. NOTA: Questo richiede che UseJellyfin sia abilitato",
      JellyfinReplaceThumbwithBackdrop:
        "Se impostato su true, lo script sostituirà l'immagine miniatura con l'immagine di sfondo. Questo avviene solo se anche BackgroundPosters è impostato su true. NOTA: Questo richiede che UseJellyfin sia abilitato",

      // EmbyPart
      EmbyLibstoExclude:
        "Librerie Emby, per nome cartella locale, da escludere dall'elaborazione (elenco separato da virgole)",
      EmbyUrl:
        "URL del server Emby (es., http://192.168.1.1:8096/emby o http://mioserverplex.com:8096/emby). Questo campo è abilitato quando Emby è selezionato come server multimediale attivo O quando EmbySync è abilitato",
      UseEmby:
        "Abilita Emby come server multimediale. NOTA: Solo UN server multimediale può essere attivo alla volta (Plex, Jellyfin o Emby)",
      UseEmbySync:
        "Abilita la sincronizzazione con il tuo server Emby. Quando abilitato, i campi URL Emby e chiave API diventano disponibili per la configurazione. NOTA: Questo interruttore è disabilitato quando Emby è selezionato come server multimediale attivo",
      EmbyUploadExistingAssets:
        "Se impostato su true, lo script verificherà le risorse locali e le caricherà su Emby, ma solo se Emby non ha già dati EXIF da Posterizarr, Kometa o TCM. NOTA: Questo richiede che UseEmby sia abilitato",
      EmbyReplaceThumbwithBackdrop:
        "Se impostato su true, lo script sostituirà l'immagine miniatura con l'immagine di sfondo. Questo avviene solo se anche BackgroundPosters è impostato su true. NOTA: Questo richiede che UseEmby sia abilitato",

      // Notification
      SendNotification:
        "Impostare su true se vuoi inviare notifiche tramite Discord o Apprise, altrimenti false",
      AppriseUrl:
        "Possibile solo su Docker - URL per il provider Apprise. Vedi la documentazione Apprise per i dettagli",
      Discord: "URL Webhook Discord per le notifiche",
      DiscordUserName:
        "Nome utente per il webhook Discord (predefinito è Posterizarr)",
      UseUptimeKuma: "Impostare su true se vuoi inviare webhook a Uptime-Kuma",
      UptimeKumaUrl: "URL Webhook Uptime-Kuma",

      // PrerequisitePart
      AssetPath:
        "Percorso per memorizzare i poster generati. Su Docker, dovrebbe essere /assets",
      BackupPath:
        "Percorso per memorizzare/scaricare i poster Plex quando si usa la modalità backup",
      ManualAssetPath:
        "Se le risorse sono posizionate in questa directory con la convenzione di denominazione esatta, verranno preferite (deve seguire la stessa convenzione di denominazione di /assets)",
      SkipAddText:
        "Se impostato su true, Posterizarr salterà l'aggiunta di testo al poster se è contrassegnato come 'Poster con testo' dal provider",
      SkipAddTextAndOverlay:
        "Se impostato su true, Posterizarr salterà l’aggiunta di testo/sovrapposizione al poster se è contrassegnato come 'Poster con testo' dal provider.",
      FollowSymlink:
        "Se impostato su true, Posterizarr seguirà i collegamenti simbolici nelle directory specificate durante la creazione della tabella hash",
      ForceRunningDeletion:
        "Se impostato su true, Posterizarr eliminerà automaticamente il file Running. ATTENZIONE: Può causare più esecuzioni simultanee che condividono la stessa directory temporanea",
      AutoUpdatePosterizarr:
        "Se impostato su true, Posterizarr si aggiornerà alla versione più recente (Solo per sistemi non-Docker)",
      show_skipped:
        "Se impostato su true, verrà visualizzato il logging dettagliato delle risorse già create. Su librerie grandi, potrebbe sembrare che lo script si blocchi",
      magickinstalllocation:
        "Il percorso dell'installazione di ImageMagick dove si trova magick.exe. Se usi la versione portatile, lascia './magick'. Il container gestisce questo automaticamente",
      maxLogs:
        "Numero di cartelle di log che vuoi conservare nella cartella RotatedLogs (Cronologia log)",
      logLevel:
        "Imposta la verbosità del logging. 1 = Avviso/Errore. 2 = Info/Avviso/Errore (predefinito). 3 = Info/Avviso/Errore/Debug (più dettagliato)",
      font: "Nome file del font predefinito per le sovrapposizioni di testo",
      RTLFont:
        "Nome file del font da destra a sinistra per le lingue RTL (arabo, ebraico, ecc.)",
      backgroundfont: "Nome file del font per il testo di sfondo",
      titlecardfont: "Nome file del font per il testo delle title card",
      collectionfont: "Nome file del font per i titoli delle collezioni",
      overlayfile:
        "Nome file della sovrapposizione predefinita (es., overlay.png)",
      seasonoverlayfile: "Nome file della sovrapposizione poster stagione",
      backgroundoverlayfile: "Nome file della sovrapposizione sfondo",
      titlecardoverlayfile: "Nome file della sovrapposizione title card",
      collectionoverlayfile: "Nome file della sovrapposizione collezione",
      poster4k:
        "Nome file della sovrapposizione poster 4K (la sovrapposizione deve corrispondere alle dimensioni del poster 2000x3000)",
      Poster1080p:
        "Nome file della sovrapposizione poster 1080p (la sovrapposizione deve corrispondere alle dimensioni del poster 2000x3000)",
      Background4k:
        "Nome file della sovrapposizione sfondo 4K (la sovrapposizione deve corrispondere alle dimensioni dello sfondo 3840x2160)",
      Background1080p:
        "Nome file della sovrapposizione sfondo 1080p (la sovrapposizione deve corrispondere alle dimensioni dello sfondo 3840x2160)",
      TC4k: "Nome file della sovrapposizione title card 4K (la sovrapposizione deve corrispondere alle dimensioni 3840x2160)",
      TC1080p:
        "Nome file della sovrapposizione title card 1080p (la sovrapposizione deve corrispondere alle dimensioni 3840x2160)",
      "4KDoVi":
        "Sovrapposizione specifica per i poster 4K Dolby Vision. (2000x3000)",
      "4KHDR10": "Sovrapposizione specifica per i poster 4K HDR10. (2000x3000)",
      "4KDoViHDR10":
        "Sovrapposizione specifica per i poster 4K DoVi & HDR10. (2000x3000)",
      "4KDoViBackground":
        "Sovrapposizione specifica per gli sfondi 4K Dolby Vision. (3840x2160)",
      "4KHDR10Background":
        "Sovrapposizione specifica per gli sfondi 4K HDR10. (3840x2160)",
      "4KDoViHDR10Background":
        "Sovrapposizione specifica per gli sfondi 4K DoVi & HDR10. (3840x2160)",
      "4KDoViTC":
        "Sovrapposizione specifica per le title card 4K Dolby Vision. (3840x2160)",
      "4KHDR10TC":
        "Sovrapposizione specifica per le title card 4K HDR10. (3840x2160)",
      "4KDoViHDR10TC":
        "Sovrapposizione specifica per le title card 4K DoVi & HDR10. (3840x2160)",
      UsePosterResolutionOverlays:
        "Impostare su true per applicare una sovrapposizione specifica con risoluzione per i poster 4k/1080p. Se vuoi solo 4k, aggiungi anche il tuo file di sovrapposizione predefinito per Poster1080p",
      UseBackgroundResolutionOverlays:
        "Impostare su true per applicare una sovrapposizione specifica con risoluzione per gli sfondi 4k/1080p. Se vuoi solo 4k, aggiungi anche il tuo file di sovrapposizione predefinito per Background1080p",
      UseTCResolutionOverlays:
        "Impostare su true per applicare una sovrapposizione specifica con risoluzione per le title card 4k/1080p. Se vuoi solo 4k, aggiungi il tuo file di sovrapposizione predefinito per TC1080p",
      LibraryFolders:
        "Impostare su false per una struttura di risorse in una cartella piatta o true per dividerle in cartelle di media della libreria come richiesto da Kometa",
      Posters: "Impostare su true per creare poster di film/serie",
      SeasonPosters: "Impostare su true per creare anche poster delle stagioni",
      BackgroundPosters: "Impostare su true per creare anche poster di sfondo",
      TitleCards: "Impostare su true per creare anche title card",
      SkipTBA:
        "Impostare su true per saltare la creazione di title card se il testo del titolo è 'TBA'",
      SkipJapTitle:
        "Impostare su true per saltare la creazione di title card se il testo del titolo è in giapponese o cinese",
      AssetCleanup:
        "Impostare su true per pulire le risorse che non sono più in Plex. IMPORTANTE: Rischio di perdita di dati dalle librerie escluse - assicurati che tutte le librerie di risorse attive siano incluse",
      AutoUpdateIM:
        "Impostare su true per aggiornare automaticamente la versione portatile di ImageMagick (Non funziona con Docker/Unraid). Avviso: Versioni non testate potrebbero causare problemi",
      NewLineOnSpecificSymbols:
        "Impostare su true per abilitare l'inserimento automatico di un carattere di nuova riga ad ogni occorrenza di simboli specifici in NewLineSymbols nel testo del titolo",
      NewLineSymbols:
        "Un elenco di simboli che attiveranno un inserimento di nuova riga quando NewLineOnSpecificSymbols è true. Separa ogni simbolo con una virgola (es., ' - ', ':')",
      SymbolsToKeepOnNewLine:
        "Un elenco di simboli che attivano un inserimento di nuova riga ma non vengono sostituiti dall'impostazione NewLineOnSpecificSymbols. Questo si applica solo se il simbolo è incluso anche in NewLineSymbols. Separa ogni simbolo con una virgola (es., '-', ':')",
      DisableHashValidation:
        "Impostare su true per saltare la validazione hash (Predefinito: false). Nota: Questo può produrre gonfiamento, poiché ogni elemento verrà ri-caricato sui server multimediali",
      DisableOnlineAssetFetch:
        "Impostare su true per saltare tutte le ricerche online e usare solo le risorse disponibili localmente (Predefinito: false)",

      // OverlayPart
      ImageProcessing:
        "Impostare su true se vuoi la parte ImageMagick (testo, sovrapposizione e/o bordo); se false, scarica solo i poster",
      outputQuality:
        "Qualità di output dell'immagine (predefinito è 92%). Impostare a 100% raddoppia la dimensione dell'immagine",

      // PosterOverlayPart
      PosterFontAllCaps:
        "Impostare su true per tutto in maiuscolo sui poster, altrimenti false",
      PosterAddBorder:
        "Impostare su true per aggiungere un bordo all'immagine del poster",
      PosterAddText:
        "Impostare su true per aggiungere testo all'immagine del poster",
      PosterAddOverlay:
        "Impostare su true per aggiungere il file di sovrapposizione definito all'immagine del poster",
      PosterFontcolor:
        "Colore del testo del font sui poster (es., #FFFFFF per bianco)",
      PosterBordercolor: "Colore del bordo sui poster (es., #000000 per nero)",
      PosterMinPointSize: "Dimensione minima del testo nel poster (in punti)",
      PosterMaxPointSize: "Dimensione massima del testo nel poster (in punti)",
      PosterBorderwidth: "Larghezza del bordo in pixel",
      PosterMaxWidth: "Larghezza massima della casella di testo sul poster",
      PosterMaxHeight: "Altezza massima della casella di testo sul poster",
      PosterTextOffset:
        "Offset della casella di testo dal fondo dell'immagine (usa formato +200 o -150)",
      PosterAddTextStroke:
        "Impostare su true per aggiungere un contorno al testo",
      PosterStrokecolor:
        "Colore del contorno del testo (es., #000000 per nero)",
      PosterStrokewidth: "Larghezza del contorno in pixel",
      PosterLineSpacing:
        "Regola l'altezza tra le righe di testo (Predefinito è 0)",
      PosterTextGravity:
        "Specifica l'allineamento del testo all'interno della casella di testo (Predefinito è south = basso centro)",

      // SeasonPosterOverlayPart
      SeasonPosterFontAllCaps:
        "Impostare su true per tutto in maiuscolo sui poster delle stagioni, altrimenti false",
      SeasonPosterAddBorder:
        "Impostare su true per aggiungere un bordo all'immagine del poster della stagione",
      SeasonPosterAddText:
        "Impostare su true per aggiungere testo all'immagine del poster della stagione",
      SeasonPosterAddOverlay:
        "Impostare su true per aggiungere il file di sovrapposizione definito all'immagine del poster della stagione",
      SeasonPosterFontcolor:
        "Colore del testo del font sui poster delle stagioni",
      SeasonPosterBordercolor: "Colore del bordo sui poster delle stagioni",
      SeasonPosterMinPointSize:
        "Dimensione minima del testo nel poster della stagione",
      SeasonPosterMaxPointSize:
        "Dimensione massima del testo nel poster della stagione",
      SeasonPosterBorderwidth:
        "Larghezza del bordo in pixel per i poster delle stagioni",
      SeasonPosterMaxWidth:
        "Larghezza massima della casella di testo sul poster della stagione",
      SeasonPosterMaxHeight:
        "Altezza massima della casella di testo sul poster della stagione",
      SeasonPosterTextOffset:
        "Offset della casella di testo dal fondo del poster della stagione (usa formato +200 o -150)",
      SeasonPosterAddTextStroke:
        "Impostare su true per aggiungere un contorno al testo sui poster delle stagioni",
      SeasonPosterStrokecolor:
        "Colore del contorno del testo sui poster delle stagioni",
      SeasonPosterStrokewidth:
        "Larghezza del contorno in pixel per i poster delle stagioni",
      SeasonPosterLineSpacing:
        "Regola l'altezza tra le righe di testo sui poster delle stagioni (Predefinito è 0)",
      SeasonPosterShowFallback:
        "Impostare su true se vuoi ripiegare sul poster della serie se non è stato trovato alcun poster della stagione",
      SeasonPosterTextGravity:
        "Specifica l'allineamento del testo all'interno della casella di testo sui poster delle stagioni (Predefinito è south)",

      // BackgroundOverlayPart
      BackgroundFontAllCaps:
        "Impostare su true per tutto in maiuscolo sugli sfondi, altrimenti false",
      BackgroundAddOverlay:
        "Impostare su true per aggiungere il file di sovrapposizione sfondo definito all'immagine di sfondo",
      BackgroundAddBorder:
        "Impostare su true per aggiungere un bordo all'immagine di sfondo",
      BackgroundAddText:
        "Impostare su true per aggiungere testo all'immagine di sfondo",
      BackgroundFontcolor: "Colore del testo del font sugli sfondi",
      BackgroundBordercolor: "Colore del bordo sugli sfondi",
      BackgroundMinPointSize:
        "Dimensione minima del testo nell'immagine di sfondo",
      BackgroundMaxPointSize:
        "Dimensione massima del testo nell'immagine di sfondo",
      BackgroundBorderwidth: "Larghezza del bordo in pixel per gli sfondi",
      BackgroundMaxWidth:
        "Larghezza massima della casella di testo nell'immagine di sfondo",
      BackgroundMaxHeight:
        "Altezza massima della casella di testo nell'immagine di sfondo",
      BackgroundTextOffset:
        "Offset della casella di testo dal fondo dell'immagine di sfondo (usa formato +200 o -150)",
      BackgroundAddTextStroke:
        "Impostare su true per aggiungere un contorno al testo sugli sfondi",
      BackgroundStrokecolor: "Colore del contorno del testo sugli sfondi",
      BackgroundStrokewidth: "Larghezza del contorno in pixel per gli sfondi",
      BackgroundLineSpacing:
        "Regola l'altezza tra le righe di testo sugli sfondi (Predefinito è 0)",
      BackgroundTextGravity:
        "Specifica l'allineamento del testo all'interno della casella di testo sugli sfondi (Predefinito è south)",

      // TitleCardOverlayPart
      TitleCardUseBackgroundAsTitleCard:
        "Impostare su true se preferisci lo sfondo della serie come title card (predefinito è false, che usa l'immagine dell'episodio)",
      TitleCardAddOverlay:
        "Impostare su true per aggiungere il file di sovrapposizione title card definito all'immagine della title card",
      TitleCardAddBorder:
        "Impostare su true per aggiungere un bordo all'immagine della title card",
      TitleCardBordercolor: "Colore del bordo sulle title card",
      TitleCardBorderwidth: "Larghezza del bordo in pixel per le title card",
      TitleCardBackgroundFallback:
        "Impostare su false se vuoi saltare il ripiego sullo sfondo per le immagini delle title card se non è stata trovata alcuna title card",

      // TitleCardTitleTextPart
      TitleCardTitleFontAllCaps:
        "Impostare su true per tutto in maiuscolo per il testo del titolo dell'episodio sulle title card, altrimenti false",
      TitleCardTitleAddEPTitleText:
        "Impostare su true per aggiungere il testo del titolo dell'episodio all'immagine della title card",
      TitleCardTitleFontcolor:
        "Colore del testo del font del titolo dell'episodio sulle title card",
      TitleCardTitleMinPointSize:
        "Dimensione minima del testo del titolo dell'episodio nell'immagine della title card",
      TitleCardTitleMaxPointSize:
        "Dimensione massima del testo del titolo dell'episodio nell'immagine della title card",
      TitleCardTitleMaxWidth:
        "Larghezza massima della casella di testo del titolo dell'episodio nell'immagine della title card",
      TitleCardTitleMaxHeight:
        "Altezza massima della casella di testo del titolo dell'episodio nell'immagine della title card",
      TitleCardTitleTextOffset:
        "Offset della casella di testo del titolo dell'episodio dal fondo dell'immagine della title card (usa formato +200 o -150)",
      TitleCardTitleAddTextStroke:
        "Impostare su true per aggiungere un contorno al testo del titolo dell'episodio sulle title card",
      TitleCardTitleStrokecolor:
        "Colore del contorno del testo del titolo dell'episodio sulle title card",
      TitleCardTitleStrokewidth:
        "Larghezza del contorno in pixel per il testo del titolo dell'episodio sulle title card",
      TitleCardTitleLineSpacing:
        "Regola l'altezza tra le righe del testo del titolo dell'episodio sulle title card (Predefinito è 0)",
      TitleCardTitleTextGravity:
        "Specifica l'allineamento del testo del titolo dell'episodio all'interno della casella di testo sulle title card (Predefinito è south)",

      // TitleCardEPTextPart
      TitleCardEPSeasonTCText:
        "Testo personalizzato per visualizzare la stagione sulla title card (es., 'S' per S01)",
      TitleCardEPEpisodeTCText:
        "Testo personalizzato per visualizzare l'episodio sulla title card (es., 'E' per E01)",
      TitleCardEPFontAllCaps:
        "Impostare su true per tutto in maiuscolo per il testo dell'episodio sulle title card, altrimenti false",
      TitleCardEPAddEPText:
        "Impostare su true per aggiungere il testo dell'episodio all'immagine della title card",
      TitleCardEPFontcolor:
        "Colore del testo del font dell'episodio sulle title card",
      TitleCardEPMinPointSize:
        "Dimensione minima del testo dell'episodio nell'immagine della title card",
      TitleCardEPMaxPointSize:
        "Dimensione massima del testo dell'episodio nell'immagine della title card",
      TitleCardEPMaxWidth:
        "Larghezza massima della casella di testo dell'episodio nell'immagine della title card",
      TitleCardEPMaxHeight:
        "Altezza massima della casella di testo dell'episodio nell'immagine della title card",
      TitleCardEPTextOffset:
        "Offset della casella di testo dell'episodio dal fondo dell'immagine della title card (usa formato +200 o -150)",
      TitleCardEPAddTextStroke:
        "Impostare su true per aggiungere un contorno al testo dell'episodio sulle title card",
      TitleCardEPStrokecolor:
        "Colore del contorno del testo dell'episodio sulle title card",
      TitleCardEPStrokewidth:
        "Larghezza del contorno in pixel per il testo dell'episodio sulle title card",
      TitleCardEPLineSpacing:
        "Regola l'altezza tra le righe del testo dell'episodio sulle title card (Predefinito è 0)",
      TitleCardEPTextGravity:
        "Specifica l'allineamento del testo dell'episodio all'interno della casella di testo sulle title card (Predefinito è south)",

      // ShowTitleOnSeasonPosterPart
      ShowTitleAddShowTitletoSeason:
        "Impostare su true per aggiungere il titolo della serie ai poster delle stagioni",
      ShowTitleFontAllCaps:
        "Impostare su true per tutto in maiuscolo per il titolo della serie sui poster delle stagioni, altrimenti false",
      ShowTitleFontcolor:
        "Colore del testo del font del titolo della serie sui poster delle stagioni",
      ShowTitleMinPointSize:
        "Dimensione minima del testo del titolo della serie sui poster delle stagioni",
      ShowTitleMaxPointSize:
        "Dimensione massima del testo del titolo della serie sui poster delle stagioni",
      ShowTitleMaxWidth:
        "Larghezza massima della casella di testo del titolo della serie sui poster delle stagioni",
      ShowTitleMaxHeight:
        "Altezza massima della casella di testo del titolo della serie sui poster delle stagioni",
      ShowTitleTextOffset:
        "Offset della casella di testo del titolo della serie dal fondo del poster della stagione (usa formato +200 o -150)",
      ShowTitleAddTextStroke:
        "Impostare su true per aggiungere un contorno al testo del titolo della serie sui poster delle stagioni",
      ShowTitleStrokecolor:
        "Colore del contorno del testo del titolo della serie sui poster delle stagioni",
      ShowTitleStrokewidth:
        "Larghezza del contorno in pixel per il testo del titolo della serie sui poster delle stagioni",
      ShowTitleLineSpacing:
        "Regola l'altezza tra le righe del testo del titolo della serie sui poster delle stagioni (Predefinito è 0)",
      ShowTitleTextGravity:
        "Specifica l'allineamento del testo del titolo della serie all'interno della casella di testo sui poster delle stagioni (Predefinito è south)",

      // CollectionPosterOverlayPart
      CollectionPosterFontAllCaps:
        "Impostare su true per tutto in maiuscolo sui poster delle collezioni, altrimenti false",
      CollectionPosterAddBorder:
        "Impostare su true per aggiungere un bordo al poster della collezione",
      CollectionPosterAddText:
        "Impostare su true per aggiungere testo al poster della collezione",
      CollectionPosterAddTextStroke:
        "Impostare su true per aggiungere un contorno al testo sui poster delle collezioni",
      CollectionPosterAddOverlay:
        "Impostare su true per aggiungere il file di sovrapposizione definito al poster della collezione",
      CollectionPosterFontcolor:
        "Colore del testo del font sui poster delle collezioni",
      CollectionPosterBordercolor:
        "Colore del bordo sui poster delle collezioni",
      CollectionPosterStrokecolor:
        "Colore del contorno del testo sui poster delle collezioni",
      CollectionPosterMinPointSize:
        "Dimensione minima del testo nel poster della collezione",
      CollectionPosterMaxPointSize:
        "Dimensione massima del testo nel poster della collezione",
      CollectionPosterBorderwidth:
        "Larghezza del bordo in pixel per i poster delle collezioni",
      CollectionPosterStrokewidth:
        "Larghezza del contorno in pixel per i poster delle collezioni",
      CollectionPosterTextOffset:
        "Offset della casella di testo dal fondo del poster della collezione (usa formato +200 o -150)",

      // CollectionTitlePosterPart
      CollectionTitleAddCollectionTitle:
        "Impostare su true per aggiungere il titolo della collezione ai poster delle collezioni",
      CollectionTitleFontAllCaps:
        "Impostare su true per tutto in maiuscolo per il titolo della collezione, altrimenti false",
      CollectionTitleAddTextStroke:
        "Impostare su true per aggiungere un contorno al testo del titolo della collezione",
      CollectionTitleFontcolor:
        "Colore del testo del font del titolo della collezione",
      CollectionTitleStrokecolor:
        "Colore del contorno del testo del titolo della collezione",
      CollectionTitleMinPointSize:
        "Dimensione minima del testo del titolo della collezione",
      CollectionTitleMaxPointSize:
        "Dimensione massima del testo del titolo della collezione",
      CollectionTitleStrokewidth:
        "Larghezza del contorno in pixel per il testo del titolo della collezione",
      CollectionTitleTextOffset:
        "Offset della casella di testo del titolo della collezione dal fondo del poster (usa formato +200 o -150)",
      CollectionTitleMaxWidth:
        "Larghezza massima della casella di testo sul poster della collezione",
      CollectionTitleMaxHeight:
        "Altezza massima della casella di testo sul poster della collezione",
      CollectionTitleLineSpacing:
        "Regola l'altezza tra le righe di testo sui poster delle collezioni (Predefinito è 0)",
      CollectionTitleTextGravity:
        "Specifica l'allineamento del testo all'interno della casella di testo sui poster delle collezioni (Predefinito è south)",
      CollectionPosterMaxWidth:
        "Larghezza massima della casella di testo sul poster della collezione",
      CollectionPosterMaxHeight:
        "Altezza massima della casella di testo sul poster della collezione",
      CollectionPosterLineSpacing:
        "Regola l'altezza tra le righe di testo sui poster delle collezioni (Predefinito è 0)",
      CollectionPosterTextGravity:
        "Specifica l'allineamento del testo all'interno della casella di testo sui poster delle collezioni (Predefinito è south)",
    },
    pt: {
      // WebUI Settings
      basicAuthEnabled:
        "Ativar autenticação básica para proteger a interface Web. Defina como true para exigir login com nome de usuário/senha (Padrão: false)",
      basicAuthUsername:
        "Nome de usuário para autenticação básica. Altere do padrão 'admin' para melhor segurança (Padrão: admin)",
      basicAuthPassword:
        "Senha para autenticação básica. IMPORTANTE: Altere do padrão 'posterizarr' antes de ativar a autenticação! (Padrão: posterizarr)",
      webuiLogLevel:
        "Defina o nível de log para o servidor backend WebUI. DEBUG: Log mais detalhado; INFO: Informações gerais (padrão); WARNING: Apenas avisos e erros; ERROR: Apenas erros; CRITICAL: Apenas erros críticos",
      // ApiPart
      tvdbapi:
        "Sua chave API do projeto TVDB. Se você é um assinante TVDB, pode anexar seu PIN ao final da sua chave API no formato SuaChave#SeuPIN",
      tmdbtoken: "Seu token de acesso de leitura da API TMDB (o muito longo)",
      FanartTvAPIKey: "Sua chave API pessoal Fanart.tv",
      PlexToken:
        "Seu token de autenticação Plex (Deixe vazio se não usar Plex)",
      JellyfinAPIKey:
        "Sua chave API Jellyfin (Você pode criar uma chave API dentro do Jellyfin em Configurações > Avançado > Chaves API)",
      EmbyAPIKey:
        "Sua chave API Emby (Você pode criar uma chave API dentro do Emby em Configurações > Avançado > Chaves API)",
      FavProvider:
        "Defina seu provedor preferido: tmdb (recomendado), fanart, tvdb, ou plex (não recomendado para sem texto)",
      tmdb_vote_sorting:
        "Ordenação de imagens via API TMDB: vote_average, vote_count, ou primary (visualização padrão TMDB)",
      PreferredLanguageOrder:
        "Especifique as preferências de idioma. Padrão é xx,en,de (xx é Sem Texto). Use códigos de idioma ISO 3166-1 de 2 dígitos. Definir como 'xx' apenas para pesquisar pôsteres sem texto",
      PreferredSeasonLanguageOrder:
        "Especifique as preferências de idioma para temporadas. Padrão é xx,en,de (xx é Sem Texto). Use códigos de idioma ISO 3166-1 de 2 dígitos",
      PreferredBackgroundLanguageOrder:
        "Especifique as preferências de idioma para fundos. Padrão é PleaseFillMe (pegará sua ordem de idioma de pôster). Definir como 'xx' apenas para pesquisar sem texto",
      PreferredTCLanguageOrder:
        "Especifique as preferências de idioma para cartões de título/imagens de episódios. Padrão é PleaseFillMe (pegará sua ordem de idioma de pôster). Use códigos de idioma ISO 3166-1 de 2 dígitos",
      WidthHeightFilter:
        "Se definido como true, um filtro de resolução adicional será aplicado aos pôsteres/fundos (TMDB e TVDB) e aos cartões de título (apenas TMDB)",
      PosterMinWidth:
        "Filtro de largura mínima do pôster - maior ou igual ao valor especificado (padrão: 2000)",
      PosterMinHeight:
        "Filtro de altura mínima do pôster - maior ou igual ao valor especificado (padrão: 3000)",
      BgTcMinWidth:
        "Filtro de largura mínima fundo/cartão de título - maior ou igual ao valor especificado (padrão: 3840)",
      BgTcMinHeight:
        "Filtro de altura mínima fundo/cartão de título - maior ou igual ao valor especificado (padrão: 2160)",

      // PlexPart
      PlexLibstoExclude:
        "Bibliotecas Plex, por nome, a serem excluídas do processamento (lista separada por vírgulas)",
      PlexUrl:
        "URL do servidor Plex (ex., http://192.168.1.1:32400 ou http://meuservidorplex.com:32400). Este campo só é ativado quando Plex é selecionado como servidor de mídia ativo",
      UsePlex:
        "Ativar Plex como servidor de mídia. NOTA: Apenas UM servidor de mídia pode estar ativo por vez (Plex, Jellyfin ou Emby)",
      PlexUploadExistingAssets:
        "Se definido como true, o script verificará os recursos locais e os enviará para o Plex, mas apenas se o Plex ainda não tiver dados EXIF do Posterizarr, Kometa ou TCM",
      PlexUpload:
        "Se definido como true, Posterizarr enviará diretamente a arte para o Plex (útil se você não usar Kometa)",

      // JellyfinPart
      JellyfinLibstoExclude:
        "Bibliotecas Jellyfin, por nome de pasta local, a serem excluídas do processamento (lista separada por vírgulas)",
      JellyfinUrl:
        "URL do servidor Jellyfin (ex., http://192.168.1.1:8096 ou http://meuservidorplex.com:8096). Este campo é ativado quando Jellyfin é selecionado como servidor de mídia ativo OU quando JellySync está ativado",
      UseJellyfin:
        "Ativar Jellyfin como servidor de mídia. NOTA: Apenas UM servidor de mídia pode estar ativo por vez (Plex, Jellyfin ou Emby)",
      UseJellySync:
        "Ativar sincronização com seu servidor Jellyfin. Quando ativado, os campos URL Jellyfin e chave API ficam disponíveis para configuração. NOTA: Esta alternância é desativada quando Jellyfin é selecionado como servidor de mídia ativo",
      JellyfinUploadExistingAssets:
        "Se definido como true, o script verificará os recursos locais e os enviará para o Jellyfin, mas apenas se o Jellyfin ainda não tiver dados EXIF do Posterizarr, Kometa ou TCM. NOTA: Isso requer que UseJellyfin esteja ativado",
      JellyfinReplaceThumbwithBackdrop:
        "Se definido como true, o script substituirá a imagem de miniatura pela imagem de fundo. Isso só ocorre se BackgroundPosters também estiver definido como true. NOTA: Isso requer que UseJellyfin esteja ativado",

      // EmbyPart
      EmbyLibstoExclude:
        "Bibliotecas Emby, por nome de pasta local, a serem excluídas do processamento (lista separada por vírgulas)",
      EmbyUrl:
        "URL do servidor Emby (ex., http://192.168.1.1:8096/emby ou http://meuservidorplex.com:8096/emby). Este campo é ativado quando Emby é selecionado como servidor de mídia ativo OU quando EmbySync está ativado",
      UseEmby:
        "Ativar Emby como servidor de mídia. NOTA: Apenas UM servidor de mídia pode estar ativo por vez (Plex, Jellyfin ou Emby)",
      UseEmbySync:
        "Ativar sincronização com seu servidor Emby. Quando ativado, os campos URL Emby e chave API ficam disponíveis para configuração. NOTA: Esta alternância é desativada quando Emby é selecionado como servidor de mídia ativo",
      EmbyUploadExistingAssets:
        "Se definido como true, o script verificará os recursos locais e os enviará para o Emby, mas apenas se o Emby ainda não tiver dados EXIF do Posterizarr, Kometa ou TCM. NOTA: Isso requer que UseEmby esteja ativado",
      EmbyReplaceThumbwithBackdrop:
        "Se definido como true, o script substituirá a imagem de miniatura pela imagem de fundo. Isso só ocorre se BackgroundPosters também estiver definido como true. NOTA: Isso requer que UseEmby esteja ativado",

      // Notification
      SendNotification:
        "Defina como true se quiser enviar notificações via Discord ou Apprise, caso contrário false",
      AppriseUrl:
        "Possível apenas no Docker - URL para o provedor Apprise. Consulte a documentação Apprise para detalhes",
      Discord: "URL Webhook Discord para notificações",
      DiscordUserName:
        "Nome de usuário para o webhook Discord (padrão é Posterizarr)",
      UseUptimeKuma:
        "Defina como true se quiser enviar webhook para Uptime-Kuma",
      UptimeKumaUrl: "URL Webhook Uptime-Kuma",

      // PrerequisitePart
      AssetPath:
        "Caminho para armazenar pôsteres gerados. No Docker, deve ser /assets",
      BackupPath:
        "Caminho para armazenar/baixar pôsteres Plex ao usar o modo de backup",
      ManualAssetPath:
        "Se os recursos forem colocados neste diretório com a convenção de nomenclatura exata, eles serão preferidos (deve seguir a mesma convenção de nomenclatura de /assets)",
      SkipAddText:
        "Se definido como true, Posterizarr pulará a adição de texto ao pôster se estiver marcado como 'Pôster com texto' pelo provedor",
      SkipAddTextAndOverlay:
        "Se definido como verdadeiro, o Posterizarr irá ignorar a adição de texto/sobreposição ao poster se este estiver marcado como 'Poster com texto' pelo fornecedor.",
      FollowSymlink:
        "Se definido como true, Posterizarr seguirá links simbólicos nos diretórios especificados durante a criação da tabela hash",
      ForceRunningDeletion:
        "Se definido como true, Posterizarr excluirá automaticamente o arquivo Running. AVISO: Pode resultar em várias execuções simultâneas compartilhando o mesmo diretório temporário",
      AutoUpdatePosterizarr:
        "Se definido como true, Posterizarr se atualizará para a versão mais recente (Apenas para sistemas não-Docker)",
      show_skipped:
        "Se definido como true, o log detalhado de recursos já criados será exibido. Em bibliotecas grandes, pode parecer que o script está travado",
      magickinstalllocation:
        "O caminho para a instalação do ImageMagick onde magick.exe está localizado. Se estiver usando a versão portátil, deixe como './magick'. O container gerencia isso automaticamente",
      maxLogs:
        "Número de pastas de log que você deseja manter na pasta RotatedLogs (Histórico de logs)",
      logLevel:
        "Define a verbosidade do log. 1 = Aviso/Erro. 2 = Info/Aviso/Erro (padrão). 3 = Info/Aviso/Erro/Debug (mais detalhado)",
      font: "Nome do arquivo de fonte padrão para sobreposições de texto",
      RTLFont:
        "Nome do arquivo de fonte da direita para esquerda para idiomas RTL (árabe, hebraico, etc.)",
      backgroundfont: "Nome do arquivo de fonte para texto de fundo",
      titlecardfont: "Nome do arquivo de fonte para texto de cartão de título",
      collectionfont: "Nome do arquivo de fonte para títulos de coleção",
      overlayfile: "Nome do arquivo de sobreposição padrão (ex., overlay.png)",
      seasonoverlayfile:
        "Nome do arquivo de sobreposição de pôster de temporada",
      backgroundoverlayfile: "Nome do arquivo de sobreposição de fundo",
      titlecardoverlayfile:
        "Nome do arquivo de sobreposição de cartão de título",
      collectionoverlayfile: "Nome do arquivo de sobreposição de coleção",
      poster4k:
        "Nome do arquivo de sobreposição de pôster 4K (a sobreposição deve corresponder às dimensões do pôster 2000x3000)",
      Poster1080p:
        "Nome do arquivo de sobreposição de pôster 1080p (a sobreposição deve corresponder às dimensões do pôster 2000x3000)",
      Background4k:
        "Nome do arquivo de sobreposição de fundo 4K (a sobreposição deve corresponder às dimensões do fundo 3840x2160)",
      Background1080p:
        "Nome do arquivo de sobreposição de fundo 1080p (a sobreposição deve corresponder às dimensões do fundo 3840x2160)",
      TC4k: "Nome do arquivo de sobreposição de cartão de título 4K (a sobreposição deve corresponder às dimensões 3840x2160)",
      TC1080p:
        "Nome do arquivo de sobreposição de cartão de título 1080p (a sobreposição deve corresponder às dimensões 3840x2160)",
      "4KDoVi":
        "Sobreposição específica para pôsteres 4K Dolby Vision. (2000x3000)",
      "4KHDR10": "Sobreposição específica para pôsteres 4K HDR10. (2000x3000)",
      "4KDoViHDR10":
        "Sobreposição específica para pôsteres 4K DoVi & HDR10. (2000x3000)",
      "4KDoViBackground":
        "Sobreposição específica para fundos 4K Dolby Vision. (3840x2160)",
      "4KHDR10Background":
        "Sobreposição específica para fundos 4K HDR10. (3840x2160)",
      "4KDoViHDR10Background":
        "Sobreposição específica para fundos 4K DoVi & HDR10. (3840x2160)",
      "4KDoViTC":
        "Sobreposição específica para cartões de título 4K Dolby Vision. (3840x2160)",
      "4KHDR10TC":
        "Sobreposição específica para cartões de título 4K HDR10. (3840x2160)",
      "4KDoViHDR10TC":
        "Sobreposição específica para cartões de título 4K DoVi & HDR10. (3840x2160)",
      UsePosterResolutionOverlays:
        "Defina como true para aplicar sobreposição específica com resolução para pôsteres 4k/1080p. Se você quiser apenas 4k, adicione também seu arquivo de sobreposição padrão para Poster1080p",
      UseBackgroundResolutionOverlays:
        "Defina como true para aplicar sobreposição específica com resolução para fundos 4k/1080p. Se você quiser apenas 4k, adicione também seu arquivo de sobreposição padrão para Background1080p",
      UseTCResolutionOverlays:
        "Defina como true para aplicar sobreposição específica com resolução para cartões de título 4k/1080p. Se você quiser apenas 4k, adicione seu arquivo de sobreposição padrão para TC1080p",
      LibraryFolders:
        "Defina como false para estrutura de recursos em uma pasta plana ou true para dividir em pastas de mídia de biblioteca como Kometa precisa",
      Posters: "Defina como true para criar pôsteres de filmes/séries",
      SeasonPosters: "Defina como true para criar também pôsteres de temporada",
      BackgroundPosters: "Defina como true para criar também pôsteres de fundo",
      TitleCards: "Defina como true para criar também cartões de título",
      SkipTBA:
        "Defina como true para pular a criação de cartão de título se o texto do título for 'TBA'",
      SkipJapTitle:
        "Defina como true para pular a criação de cartão de título se o texto do título estiver em japonês ou chinês",
      AssetCleanup:
        "Defina como true para limpar recursos que não estão mais no Plex. IMPORTANTE: Risco de perda de dados de bibliotecas excluídas - certifique-se de que todas as bibliotecas de recursos ativos estão incluídas",
      AutoUpdateIM:
        "Defina como true para atualizar automaticamente a versão portátil do ImageMagick (Não funciona com Docker/Unraid). Aviso: Versões não testadas podem causar problemas",
      NewLineOnSpecificSymbols:
        "Defina como true para ativar a inserção automática de um caractere de nova linha a cada ocorrência de símbolos específicos em NewLineSymbols no texto do título",
      NewLineSymbols:
        "Uma lista de símbolos que acionarão uma inserção de nova linha quando NewLineOnSpecificSymbols for true. Separe cada símbolo com vírgula (ex., ' - ', ':')",
      SymbolsToKeepOnNewLine:
        "Uma lista de símbolos que acionam uma inserção de nova linha mas não são substituídos pela configuração NewLineOnSpecificSymbols. Isso se aplica apenas se o símbolo também estiver incluído em NewLineSymbols. Separe cada símbolo com uma vírgula (ex., '-', ':')",
      DisableHashValidation:
        "Defina como true para pular a validação de hash (Padrão: false). Nota: Isso pode produzir inchaço, pois cada item será re-enviado aos servidores de mídia",
      DisableOnlineAssetFetch:
        "Defina como true para pular todas as pesquisas online e usar apenas recursos disponíveis localmente (Padrão: false)",

      // OverlayPart
      ImageProcessing:
        "Defina como true se quiser a parte ImageMagick (texto, sobreposição e/ou borda); se false, apenas baixa os pôsteres",
      outputQuality:
        "Qualidade de saída da imagem (padrão é 92%). Definir para 100% dobra o tamanho da imagem",

      // PosterOverlayPart
      PosterFontAllCaps:
        "Defina como true para tudo em maiúsculas nos pôsteres, caso contrário false",
      PosterAddBorder:
        "Defina como true para adicionar uma borda à imagem do pôster",
      PosterAddText: "Defina como true para adicionar texto à imagem do pôster",
      PosterAddOverlay:
        "Defina como true para adicionar o arquivo de sobreposição definido à imagem do pôster",
      PosterFontcolor:
        "Cor do texto da fonte nos pôsteres (ex., #FFFFFF para branco)",
      PosterBordercolor: "Cor da borda nos pôsteres (ex., #000000 para preto)",
      PosterMinPointSize: "Tamanho mínimo do texto no pôster (em pontos)",
      PosterMaxPointSize: "Tamanho máximo do texto no pôster (em pontos)",
      PosterBorderwidth: "Largura da borda em pixels",
      PosterMaxWidth: "Largura máxima da caixa de texto no pôster",
      PosterMaxHeight: "Altura máxima da caixa de texto no pôster",
      PosterTextOffset:
        "Deslocamento da caixa de texto do fundo da imagem (use formato +200 ou -150)",
      PosterAddTextStroke: "Defina como true para adicionar contorno ao texto",
      PosterStrokecolor: "Cor do contorno do texto (ex., #000000 para preto)",
      PosterStrokewidth: "Largura do contorno em pixels",
      PosterLineSpacing:
        "Ajustar a altura entre as linhas de texto (Padrão é 0)",
      PosterTextGravity:
        "Especifica o alinhamento do texto dentro da caixa de texto (Padrão é south = baixo centro)",

      // SeasonPosterOverlayPart
      SeasonPosterFontAllCaps:
        "Defina como true para tudo em maiúsculas nos pôsteres de temporada, caso contrário false",
      SeasonPosterAddBorder:
        "Defina como true para adicionar uma borda à imagem do pôster de temporada",
      SeasonPosterAddText:
        "Defina como true para adicionar texto à imagem do pôster de temporada",
      SeasonPosterAddOverlay:
        "Defina como true para adicionar o arquivo de sobreposição definido à imagem do pôster de temporada",
      SeasonPosterFontcolor: "Cor do texto da fonte nos pôsteres de temporada",
      SeasonPosterBordercolor: "Cor da borda nos pôsteres de temporada",
      SeasonPosterMinPointSize:
        "Tamanho mínimo do texto no pôster de temporada",
      SeasonPosterMaxPointSize:
        "Tamanho máximo do texto no pôster de temporada",
      SeasonPosterBorderwidth:
        "Largura da borda em pixels para pôsteres de temporada",
      SeasonPosterMaxWidth:
        "Largura máxima da caixa de texto no pôster de temporada",
      SeasonPosterMaxHeight:
        "Altura máxima da caixa de texto no pôster de temporada",
      SeasonPosterTextOffset:
        "Deslocamento da caixa de texto do fundo do pôster de temporada (use formato +200 ou -150)",
      SeasonPosterAddTextStroke:
        "Defina como true para adicionar contorno ao texto nos pôsteres de temporada",
      SeasonPosterStrokecolor:
        "Cor do contorno do texto nos pôsteres de temporada",
      SeasonPosterStrokewidth:
        "Largura do contorno em pixels para pôsteres de temporada",
      SeasonPosterLineSpacing:
        "Ajustar a altura entre as linhas de texto nos pôsteres de temporada (Padrão é 0)",
      SeasonPosterShowFallback:
        "Defina como true se quiser voltar ao pôster da série se nenhum pôster de temporada foi encontrado",
      SeasonPosterTextGravity:
        "Especifica o alinhamento do texto dentro da caixa de texto nos pôsteres de temporada (Padrão é south)",

      // BackgroundOverlayPart
      BackgroundFontAllCaps:
        "Defina como true para tudo em maiúsculas nos fundos, caso contrário false",
      BackgroundAddOverlay:
        "Defina como true para adicionar o arquivo de sobreposição de fundo definido à imagem de fundo",
      BackgroundAddBorder:
        "Defina como true para adicionar uma borda à imagem de fundo",
      BackgroundAddText:
        "Defina como true para adicionar texto à imagem de fundo",
      BackgroundFontcolor: "Cor do texto da fonte nos fundos",
      BackgroundBordercolor: "Cor da borda nos fundos",
      BackgroundMinPointSize: "Tamanho mínimo do texto na imagem de fundo",
      BackgroundMaxPointSize: "Tamanho máximo do texto na imagem de fundo",
      BackgroundBorderwidth: "Largura da borda em pixels para fundos",
      BackgroundMaxWidth: "Largura máxima da caixa de texto na imagem de fundo",
      BackgroundMaxHeight: "Altura máxima da caixa de texto na imagem de fundo",
      BackgroundTextOffset:
        "Deslocamento da caixa de texto do fundo da imagem de fundo (use formato +200 ou -150)",
      BackgroundAddTextStroke:
        "Defina como true para adicionar contorno ao texto nos fundos",
      BackgroundStrokecolor: "Cor do contorno do texto nos fundos",
      BackgroundStrokewidth: "Largura do contorno em pixels para fundos",
      BackgroundLineSpacing:
        "Ajustar a altura entre as linhas de texto nos fundos (Padrão é 0)",
      BackgroundTextGravity:
        "Especifica o alinhamento do texto dentro da caixa de texto nos fundos (Padrão é south)",

      // TitleCardOverlayPart
      TitleCardUseBackgroundAsTitleCard:
        "Defina como true se preferir o fundo da série como cartão de título (padrão é false, que usa a imagem do episódio)",
      TitleCardAddOverlay:
        "Defina como true para adicionar o arquivo de sobreposição de cartão de título definido à imagem do cartão de título",
      TitleCardAddBorder:
        "Defina como true para adicionar uma borda à imagem do cartão de título",
      TitleCardBordercolor: "Cor da borda nos cartões de título",
      TitleCardBorderwidth: "Largura da borda em pixels para cartões de título",
      TitleCardBackgroundFallback:
        "Defina como false se quiser pular o retorno ao fundo para imagens de cartão de título se nenhum cartão de título foi encontrado",

      // TitleCardTitleTextPart
      TitleCardTitleFontAllCaps:
        "Defina como true para tudo em maiúsculas para o texto do título do episódio nos cartões de título, caso contrário false",
      TitleCardTitleAddEPTitleText:
        "Defina como true para adicionar o texto do título do episódio à imagem do cartão de título",
      TitleCardTitleFontcolor:
        "Cor do texto da fonte do título do episódio nos cartões de título",
      TitleCardTitleMinPointSize:
        "Tamanho mínimo do texto do título do episódio na imagem do cartão de título",
      TitleCardTitleMaxPointSize:
        "Tamanho máximo do texto do título do episódio na imagem do cartão de título",
      TitleCardTitleMaxWidth:
        "Largura máxima da caixa de texto do título do episódio na imagem do cartão de título",
      TitleCardTitleMaxHeight:
        "Altura máxima da caixa de texto do título do episódio na imagem do cartão de título",
      TitleCardTitleTextOffset:
        "Deslocamento da caixa de texto do título do episódio do fundo da imagem do cartão de título (use formato +200 ou -150)",
      TitleCardTitleAddTextStroke:
        "Defina como true para adicionar contorno ao texto do título do episódio nos cartões de título",
      TitleCardTitleStrokecolor:
        "Cor do contorno do texto do título do episódio nos cartões de título",
      TitleCardTitleStrokewidth:
        "Largura do contorno em pixels para o texto do título do episódio nos cartões de título",
      TitleCardTitleLineSpacing:
        "Ajustar a altura entre as linhas do texto do título do episódio nos cartões de título (Padrão é 0)",
      TitleCardTitleTextGravity:
        "Especifica o alinhamento do texto do título do episódio dentro da caixa de texto nos cartões de título (Padrão é south)",

      // TitleCardEPTextPart
      TitleCardEPSeasonTCText:
        "Texto personalizado para exibir a temporada no cartão de título (ex., 'S' para S01)",
      TitleCardEPEpisodeTCText:
        "Texto personalizado para exibir o episódio no cartão de título (ex., 'E' para E01)",
      TitleCardEPFontAllCaps:
        "Defina como true para tudo em maiúsculas para o texto do episódio nos cartões de título, caso contrário false",
      TitleCardEPAddEPText:
        "Defina como true para adicionar o texto do episódio à imagem do cartão de título",
      TitleCardEPFontcolor:
        "Cor do texto da fonte do episódio nos cartões de título",
      TitleCardEPMinPointSize:
        "Tamanho mínimo do texto do episódio na imagem do cartão de título",
      TitleCardEPMaxPointSize:
        "Tamanho máximo do texto do episódio na imagem do cartão de título",
      TitleCardEPMaxWidth:
        "Largura máxima da caixa de texto do episódio na imagem do cartão de título",
      TitleCardEPMaxHeight:
        "Altura máxima da caixa de texto do episódio na imagem do cartão de título",
      TitleCardEPTextOffset:
        "Deslocamento da caixa de texto do episódio do fundo da imagem do cartão de título (use formato +200 ou -150)",
      TitleCardEPAddTextStroke:
        "Defina como true para adicionar contorno ao texto do episódio nos cartões de título",
      TitleCardEPStrokecolor:
        "Cor do contorno do texto do episódio nos cartões de título",
      TitleCardEPStrokewidth:
        "Largura do contorno em pixels para o texto do episódio nos cartões de título",
      TitleCardEPLineSpacing:
        "Ajustar a altura entre as linhas do texto do episódio nos cartões de título (Padrão é 0)",
      TitleCardEPTextGravity:
        "Especifica o alinhamento do texto do episódio dentro da caixa de texto nos cartões de título (Padrão é south)",

      // ShowTitleOnSeasonPosterPart
      ShowTitleAddShowTitletoSeason:
        "Defina como true para adicionar o título da série aos pôsteres de temporada",
      ShowTitleFontAllCaps:
        "Defina como true para tudo em maiúsculas para o título da série nos pôsteres de temporada, caso contrário false",
      ShowTitleFontcolor:
        "Cor do texto da fonte do título da série nos pôsteres de temporada",
      ShowTitleMinPointSize:
        "Tamanho mínimo do texto do título da série nos pôsteres de temporada",
      ShowTitleMaxPointSize:
        "Tamanho máximo do texto do título da série nos pôsteres de temporada",
      ShowTitleMaxWidth:
        "Largura máxima da caixa de texto do título da série nos pôsteres de temporada",
      ShowTitleMaxHeight:
        "Altura máxima da caixa de texto do título da série nos pôsteres de temporada",
      ShowTitleTextOffset:
        "Deslocamento da caixa de texto do título da série do fundo do pôster de temporada (use formato +200 ou -150)",
      ShowTitleAddTextStroke:
        "Defina como true para adicionar contorno ao texto do título da série nos pôsteres de temporada",
      ShowTitleStrokecolor:
        "Cor do contorno do texto do título da série nos pôsteres de temporada",
      ShowTitleStrokewidth:
        "Largura do contorno em pixels para o texto do título da série nos pôsteres de temporada",
      ShowTitleLineSpacing:
        "Ajustar a altura entre as linhas do texto do título da série nos pôsteres de temporada (Padrão é 0)",
      ShowTitleTextGravity:
        "Especifica o alinhamento do texto do título da série dentro da caixa de texto nos pôsteres de temporada (Padrão é south)",

      // CollectionPosterOverlayPart
      CollectionPosterFontAllCaps:
        "Defina como true para tudo em maiúsculas nos pôsteres de coleção, caso contrário false",
      CollectionPosterAddBorder:
        "Defina como true para adicionar uma borda ao pôster de coleção",
      CollectionPosterAddText:
        "Defina como true para adicionar texto ao pôster de coleção",
      CollectionPosterAddTextStroke:
        "Defina como true para adicionar contorno ao texto nos pôsteres de coleção",
      CollectionPosterAddOverlay:
        "Defina como true para adicionar o arquivo de sobreposição definido ao pôster de coleção",
      CollectionPosterFontcolor:
        "Cor do texto da fonte nos pôsteres de coleção",
      CollectionPosterBordercolor: "Cor da borda nos pôsteres de coleção",
      CollectionPosterStrokecolor:
        "Cor do contorno do texto nos pôsteres de coleção",
      CollectionPosterMinPointSize:
        "Tamanho mínimo do texto no pôster de coleção",
      CollectionPosterMaxPointSize:
        "Tamanho máximo do texto no pôster de coleção",
      CollectionPosterBorderwidth:
        "Largura da borda em pixels para pôsteres de coleção",
      CollectionPosterStrokewidth:
        "Largura do contorno em pixels para pôsteres de coleção",
      CollectionPosterTextOffset:
        "Deslocamento da caixa de texto do fundo do pôster de coleção (use formato +200 ou -150)",

      // CollectionTitlePosterPart
      CollectionTitleAddCollectionTitle:
        "Defina como true para adicionar o título da coleção aos pôsteres de coleção",
      CollectionTitleFontAllCaps:
        "Defina como true para tudo em maiúsculas para o título da coleção, caso contrário false",
      CollectionTitleAddTextStroke:
        "Defina como true para adicionar contorno ao texto do título da coleção",
      CollectionTitleFontcolor: "Cor do texto da fonte do título da coleção",
      CollectionTitleStrokecolor:
        "Cor do contorno do texto do título da coleção",
      CollectionTitleMinPointSize:
        "Tamanho mínimo do texto do título da coleção",
      CollectionTitleMaxPointSize:
        "Tamanho máximo do texto do título da coleção",
      CollectionTitleStrokewidth:
        "Largura do contorno em pixels para o texto do título da coleção",
      CollectionTitleTextOffset:
        "Deslocamento da caixa de texto do título da coleção do fundo do pôster (use formato +200 ou -150)",
      CollectionTitleMaxWidth:
        "Largura máxima da caixa de texto no pôster de coleção",
      CollectionTitleMaxHeight:
        "Altura máxima da caixa de texto no pôster de coleção",
      CollectionTitleLineSpacing:
        "Ajustar a altura entre as linhas de texto nos pôsteres de coleção (Padrão é 0)",
      CollectionTitleTextGravity:
        "Especifica o alinhamento do texto dentro da caixa de texto nos pôsteres de coleção (Padrão é south)",
      CollectionPosterMaxWidth:
        "Largura máxima da caixa de texto no pôster de coleção",
      CollectionPosterMaxHeight:
        "Altura máxima da caixa de texto no pôster de coleção",
      CollectionPosterLineSpacing:
        "Ajustar a altura entre as linhas de texto nos pôsteres de coleção (Padrão é 0)",
      CollectionPosterTextGravity:
        "Especifica o alinhamento do texto dentro da caixa de texto nos pôsteres de coleção (Padrão é south)",
    },
  };

  return tooltips[language] || tooltips.en;
};

// Helper function to remove redundant prefixes from setting keys for display
const getCleanSettingKey = (key) => {
  // FIX: Exclude the main feature toggles from prefix removal
  const keysToExclude = [
    "Posters",
    "SeasonPosters",
    "BackgroundPosters",
    "TitleCards",
  ];

  if (keysToExclude.includes(key)) {
    return key;
  }

  const prefixes = [
    "CollectionTitle",
    "CollectionPoster",
    "SeasonPoster",
    "TitleCardTitle",
    "TitleCardEP",
    "TitleCard",
    "ShowTitle",
    "Background",
    "Poster",
  ];

  for (const prefix of prefixes) {
    if (key.startsWith(prefix)) {
      const remainder = key.slice(prefix.length);
      // Only remove prefix if there's something left after it
      // The original logic is fine for fields *within* groups (e.g., PosterAddBorder -> AddBorder)
      if (remainder) {
        return remainder;
      }
    }
  }

  return key;
};

function ConfigEditor() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useToast();
  const CONFIG_TOOLTIPS = getConfigTooltips(i18n.language);
  const [config, setConfig] = useState(null);
  const [uiGroups, setUiGroups] = useState(null);
  const [displayNames, setDisplayNames] = useState({});
  const [usingFlatStructure, setUsingFlatStructure] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null); // Error state for display
  const [expandedGroups, setExpandedGroups] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [overlayFiles, setOverlayFiles] = useState([]);
  const [uploadingOverlay, setUploadingOverlay] = useState(false);
  const [previewOverlay, setPreviewOverlay] = useState(null); // For preview modal
  const [fontFiles, setFontFiles] = useState([]);
  const [uploadingFont, setUploadingFont] = useState(false);
  const [previewFont, setPreviewFont] = useState(null); // For font preview modal
  const hasInitializedGroups = useRef(false);
  const initialAuthStatus = useRef(null); // Track initial auth status when config is loaded

  // Auto-save state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const lastSavedConfigRef = useRef(null);

  // UI-only state for Sync toggles (not saved to config)
  const [useJellySync, setUseJellySync] = useState(false);
  const [useEmbySync, setUseEmbySync] = useState(false);

  // Validation state for min/max pairs
  const [validationErrors, setValidationErrors] = useState({});

  // Define min/max field pairs that need validation
  const MIN_MAX_PAIRS = [
    { min: "PosterMinPointSize", max: "PosterMaxPointSize" },
    { min: "SeasonPosterMinPointSize", max: "SeasonPosterMaxPointSize" },
    { min: "BackgroundMinPointSize", max: "BackgroundMaxPointSize" },
    { min: "TitleCardTitleMinPointSize", max: "TitleCardTitleMaxPointSize" },
    { min: "TitleCardEPMinPointSize", max: "TitleCardEPMaxPointSize" },
    { min: "ShowTitleMinPointSize", max: "ShowTitleMaxPointSize" },
    { min: "CollectionTitleMinPointSize", max: "CollectionTitleMaxPointSize" },
    {
      min: "CollectionPosterMinPointSize",
      max: "CollectionPosterMaxPointSize",
    },
  ];

  // Define parent-child dimension constraints
  // Text max width/height cannot exceed parent poster/background min width/height
  const PARENT_CHILD_CONSTRAINTS = [
    // Poster-based constraints (use PosterMinWidth/PosterMinHeight as parent)
    { parent: "PosterMinWidth", child: "PosterMaxWidth", type: "width" },
    { parent: "PosterMinHeight", child: "PosterMaxHeight", type: "height" },
    { parent: "PosterMinWidth", child: "SeasonPosterMaxWidth", type: "width" },
    {
      parent: "PosterMinHeight",
      child: "SeasonPosterMaxHeight",
      type: "height",
    },
    {
      parent: "PosterMinWidth",
      child: "CollectionPosterMaxWidth",
      type: "width",
    },
    {
      parent: "PosterMinHeight",
      child: "CollectionPosterMaxHeight",
      type: "height",
    },
    {
      parent: "PosterMinWidth",
      child: "CollectionTitleMaxWidth",
      type: "width",
    },
    {
      parent: "PosterMinHeight",
      child: "CollectionTitleMaxHeight",
      type: "height",
    },

    // Background/TitleCard-based constraints (use BgTcMinWidth/BgTcMinHeight as parent)
    { parent: "BgTcMinWidth", child: "BackgroundMaxWidth", type: "width" },
    { parent: "BgTcMinHeight", child: "BackgroundMaxHeight", type: "height" },
    { parent: "BgTcMinWidth", child: "TitleCardTitleMaxWidth", type: "width" },
    {
      parent: "BgTcMinHeight",
      child: "TitleCardTitleMaxHeight",
      type: "height",
    },
    { parent: "BgTcMinWidth", child: "TitleCardEPMaxWidth", type: "width" },
    { parent: "BgTcMinHeight", child: "TitleCardEPMaxHeight", type: "height" },
    { parent: "BgTcMinWidth", child: "ShowTitleMaxWidth", type: "width" },
    { parent: "BgTcMinHeight", child: "ShowTitleMaxHeight", type: "height" },
  ];

  // Dropdown states - using object to handle multiple instances per field type
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [dropdownPositions, setDropdownPositions] = useState({}); // Track if dropdown opens up or down
  const dropdownRefs = useRef({});

  const toggleDropdown = (key) => {
    // Calculate position before toggling if dropdown is about to open
    if (!openDropdowns[key]) {
      const ref = dropdownRefs.current[key];
      if (ref) {
        const shouldOpenUp = calculateDropdownPosition({ current: ref });
        setDropdownPositions((prev) => ({
          ...prev,
          [key]: shouldOpenUp,
        }));
      }
    }

    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const closeDropdown = (key) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: false,
    }));
  };

  const isDropdownOpen = (key) => openDropdowns[key] || false;
  const isDropdownUp = (key) => dropdownPositions[key] || false;

  // Legacy single dropdown states for non-repeating fields
  const [favProviderDropdownOpen, setFavProviderDropdownOpen] = useState(false);
  const [tmdbSortingDropdownOpen, setTmdbSortingDropdownOpen] = useState(false);
  const [logLevelDropdownOpen, setLogLevelDropdownOpen] = useState(false);
  const [webuiLogLevelDropdownOpen, setWebuiLogLevelDropdownOpen] =
    useState(false);
  const [favProviderDropdownUp, setFavProviderDropdownUp] = useState(false);
  const [tmdbSortingDropdownUp, setTmdbSortingDropdownUp] = useState(false);
  const [logLevelDropdownUp, setLogLevelDropdownUp] = useState(false);
  const [webuiLogLevelDropdownUp, setWebuiLogLevelDropdownUp] = useState(false);

  const favProviderDropdownRef = useRef(null);
  const tmdbSortingDropdownRef = useRef(null);
  const logLevelDropdownRef = useRef(null);
  const webuiLogLevelDropdownRef = useRef(null);

  // WebUI Log Level state
  const [webuiLogLevel, setWebuiLogLevel] = useState("INFO");

  // List of overlay file fields
  const OVERLAY_FILE_FIELDS = [
    "overlayfile",
    "seasonoverlayfile",
    "backgroundoverlayfile",
    "titlecardoverlayfile",
    "collectionoverlayfile",
    "poster4k",
    "Poster1080p",
    "Background4k",
    "Background1080p",
    "TC4k",
    "TC1080p",
    "4KDoVi",
    "4KHDR10",
    "4KDoViHDR10",
    "4KDoViBackground",
    "4KHDR10Background",
    "4KDoViHDR10Background",
    "4KDoViTC",
    "4KHDR10TC",
    "4KDoViHDR10TC",
  ];

  // List of font file fields
  const FONT_FILE_FIELDS = [
    "font",
    "RTLFont",
    "backgroundfont",
    "titlecardfont",
    "collectionfont",
  ];

  // Map URL path to tab name
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes("/config/webui")) return "WebUI";
    if (path.includes("/config/general")) return "General";
    if (path.includes("/config/services")) return "Media Servers";
    if (path.includes("/config/api")) return "Service APIs";
    if (path.includes("/config/languages")) return "Languages";
    if (path.includes("/config/visuals")) return "Visuals";
    if (path.includes("/config/overlays")) return "Overlays";
    if (path.includes("/config/collections")) return "Collections";
    if (path.includes("/config/notifications")) return "Notifications";
    return "General"; // Default
  };

  const activeTab = getActiveTabFromPath();

  // Auto-resize textarea function
  const autoResize = (textarea) => {
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  };

  // Tab organization
  const tabs = {
    WebUI: {
      groups: ["WebUI Settings"],
      icon: Lock,
    },
    General: {
      groups: ["General Settings", "PrerequisitePart"],
      icon: Settings,
    },
    "Media Servers": {
      groups: [
        "Plex Settings",
        "Jellyfin Settings",
        "Emby Settings",
        "PlexPart",
        "JellyfinPart",
        "EmbyPart",
      ],
      icon: Database,
    },
    "Service APIs": {
      groups: ["API Keys & Tokens", "ApiPart"],
      icon: Settings,
    },
    Languages: {
      groups: ["Language & Preferences"],
      icon: Type,
    },
    Visuals: {
      groups: [
        "Image Processing",
        "Image Filters",
        "Overlay Files",
        "Resolution Overlays",
        "Fonts",
        "Text Formatting",
        "OverlayPart",
      ],
      icon: Palette,
    },
    Overlays: {
      groups: [
        "Poster Settings",
        "Season Poster Settings",
        "Background Settings",
        "Title Card Overlay",
        "Title Card Title Text",
        "Title Card Episode Text",
        "Show Title on Season",
        "PosterOverlayPart",
        "SeasonPosterOverlayPart",
        "BackgroundOverlayPart",
        "TitleCardOverlayPart",
        "TitleCardTitleTextPart",
        "TitleCardEPTextPart",
        "ShowTitleOnSeasonPosterPart",
      ],
      icon: Palette,
    },
    Collections: {
      groups: [
        "Collection Title",
        "Collection Poster",
        "CollectionTitlePosterPart",
        "CollectionPosterOverlayPart",
      ],
      icon: Type,
    },
    Notifications: {
      groups: ["Notifications", "Notification"],
      icon: Bell,
    },
  };

  useEffect(() => {
    fetchConfig();
    fetchOverlayFiles();
    fetchFontFiles();
    fetchWebuiLogLevel();
  }, []);

  // Add keyboard shortcut for saving (Ctrl+Enter or Cmd+Enter)
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Save on Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!saving) {
          saveConfig();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [saving, config]);

  useEffect(() => {
    if (config && !hasInitializedGroups.current) {
      const groups = getGroupsByTab(activeTab);
      // Only auto-expand if there's exactly one section
      if (groups.length === 1) {
        setExpandedGroups({ [groups[0]]: true });
      }
      hasInitializedGroups.current = true;
    }
  }, [config, activeTab]);

  useEffect(() => {
    if (activeTab && config && hasInitializedGroups.current) {
      const groups = getGroupsByTab(activeTab);
      // Only auto-expand if there's exactly one section
      if (groups.length === 1) {
        setExpandedGroups((prev) => ({
          ...prev,
          [groups[0]]: true,
        }));
      }
    }
  }, [activeTab]);

  // Scroll to top when changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  // Auto-expand groups when searching
  useEffect(() => {
    if (searchQuery && activeTab) {
      const filteredGroups = getFilteredGroupsByTab(activeTab);
      const newExpandedState = {};
      filteredGroups.forEach((groupName) => {
        newExpandedState[groupName] = true;
      });
      setExpandedGroups(newExpandedState);
    }
  }, [searchQuery, activeTab]);

  // Auto-save when config changes (with 5 second debounce)
  useEffect(() => {
    if (!config || !autoSaveEnabled || !lastSavedConfigRef.current) return;

    const currentConfigStr = JSON.stringify(config);
    const hasChanges = currentConfigStr !== lastSavedConfigRef.current;

    if (hasChanges) {
      setHasUnsavedChanges(true);

      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer for auto-save after 5 seconds of inactivity
      autoSaveTimerRef.current = setTimeout(() => {
        console.log("Auto-saving config after 5 seconds of inactivity...");
        saveConfig(true); // true = auto-save
      }, 5000);
    }

    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [config, autoSaveEnabled]);

  // Function to calculate dropdown position
  const calculateDropdownPosition = (ref) => {
    if (!ref || !ref.current) return false;

    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Dropdown max height is 240px (max-h-60 = 15rem = 240px)
    // Add buffer of 8px for margin
    const dropdownHeight = 248;

    // Only open upward if there's enough space above AND more space above than below
    // This prevents cut-off at the top of the screen
    if (spaceAbove > spaceBelow && spaceAbove >= dropdownHeight) {
      return true;
    }

    return false;
  };

  // Click-outside detection for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check dynamic dropdowns (overlay, font, gravity, color)
      Object.keys(dropdownRefs.current).forEach((key) => {
        const ref = dropdownRefs.current[key];
        if (ref && !ref.contains(event.target)) {
          closeDropdown(key);
        }
      });

      // Check static dropdowns
      if (
        favProviderDropdownRef.current &&
        !favProviderDropdownRef.current.contains(event.target)
      ) {
        setFavProviderDropdownOpen(false);
      }
      if (
        tmdbSortingDropdownRef.current &&
        !tmdbSortingDropdownRef.current.contains(event.target)
      ) {
        setTmdbSortingDropdownOpen(false);
      }
      if (
        logLevelDropdownRef.current &&
        !logLevelDropdownRef.current.contains(event.target)
      ) {
        setLogLevelDropdownOpen(false);
      }
      if (
        webuiLogLevelDropdownRef.current &&
        !webuiLogLevelDropdownRef.current.contains(event.target)
      ) {
        setWebuiLogLevelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null); // Clear any previous errors
    try {
      const response = await fetch(`${API_URL}/config`);
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
        setUiGroups(data.ui_groups || null);
        setDisplayNames(data.display_names || {});
        setUsingFlatStructure(data.using_flat_structure || false);

        // Store config for change detection
        lastSavedConfigRef.current = JSON.stringify(data.config);
        setHasUnsavedChanges(false);

        // Store initial auth status when config is first loaded
        if (initialAuthStatus.current === null) {
          const authEnabled = data.using_flat_structure
            ? data.config?.basicAuthEnabled
            : data.config?.WebUI?.basicAuthEnabled;
          initialAuthStatus.current = Boolean(authEnabled);
          console.log("Initial auth status saved:", initialAuthStatus.current);
        }

        // Validate min/max pairs on initial load
        validateMinMaxPairs(data.config);

        console.log(
          "Config structure:",
          data.using_flat_structure ? "FLAT" : "GROUPED"
        );
        console.log(
          "Display names loaded:",
          Object.keys(data.display_names || {}).length
        );
      } else {
        const errorMsg = "Failed to load config";
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = `Failed to load configuration: ${err.message}`;
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverlayFiles = async () => {
    try {
      const response = await fetch(`${API_URL}/overlayfiles`);
      const data = await response.json();

      if (data.success) {
        // Filter only image files (not fonts)
        const imageFiles = (data.files || []).filter(
          (file) => file.type === "image"
        );
        setOverlayFiles(imageFiles);
        console.log(`Loaded ${imageFiles.length} overlay files`);
      }
    } catch (err) {
      console.error("Failed to load overlay files:", err);
    }
  };

  const handleOverlayFileUpload = async (file) => {
    if (!file) return;

    setUploadingOverlay(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/overlayfiles/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`File "${data.filename}" uploaded successfully!`);
        // Refresh overlay files list
        await fetchOverlayFiles();
      } else {
        showError(data.detail || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showError("Failed to upload file");
    } finally {
      setUploadingOverlay(false);
    }
  };

  const fetchFontFiles = async () => {
    try {
      const response = await fetch(`${API_URL}/fonts`);
      const data = await response.json();

      if (data.success) {
        setFontFiles(data.files || []);
        console.log(`Loaded ${data.files.length} font files`);
      }
    } catch (err) {
      console.error("Failed to load font files:", err);
    }
  };

  // Fetch WebUI backend log level
  const fetchWebuiLogLevel = async () => {
    try {
      const response = await fetch(`${API_URL}/webui-settings`);
      const data = await response.json();

      if (data.success && data.settings.log_level) {
        setWebuiLogLevel(data.settings.log_level);
        console.log(`WebUI Log Level loaded: ${data.settings.log_level}`);
      }
    } catch (err) {
      console.error("Failed to load WebUI log level:", err);
    }
  };

  // Update WebUI backend log level
  const updateWebuiLogLevel = async (level) => {
    try {
      const response = await fetch(`${API_URL}/webui-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: {
            log_level: level,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWebuiLogLevel(level);
        showSuccess(`WebUI Backend Log Level set to ${level}`);
        console.log(`WebUI Log Level updated to: ${level}`);
      } else {
        showError(data.detail || "Failed to update log level");
      }
    } catch (err) {
      console.error("Failed to update WebUI log level:", err);
      showError("Failed to update log level");
    }
  };

  const handleFontFileUpload = async (file) => {
    if (!file) return;

    setUploadingFont(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/fonts/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`Font "${data.filename}" uploaded successfully!`);
        // Refresh font files list
        await fetchFontFiles();
      } else {
        showError(data.detail || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showError("Failed to upload file");
    } finally {
      setUploadingFont(false);
    }
  };

  const saveConfig = async (isAutoSave = false) => {
    // Validate min/max pairs before saving
    const isValid = validateMinMaxPairs(config);

    if (!isValid) {
      const errorCount = Object.keys(validationErrors).length;
      showError(
        `Cannot save: ${errorCount} validation ${
          errorCount === 1 ? "error" : "errors"
        } found. Please fix value conflicts.`
      );
      return;
    }

    setSaving(true);
    setError(null);

    //  Get the ORIGINAL auth status from when config was loaded
    const oldAuthEnabled = initialAuthStatus.current;

    //  Get CURRENT auth status from the config being saved
    const newAuthEnabled = usingFlatStructure
      ? config?.basicAuthEnabled
      : config?.WebUI?.basicAuthEnabled;

    // Check if auth status is changing
    const authChanging = oldAuthEnabled !== Boolean(newAuthEnabled);

    if (!isAutoSave) {
      console.log("Auth status check:", {
        oldAuthEnabled,
        newAuthEnabled: Boolean(newAuthEnabled),
        authChanging,
      });
    }

    try {
      const response = await fetch(`${API_URL}/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }), // Send flat config directly
      });

      const data = await response.json();

      if (data.success) {
        // Update saved config reference
        lastSavedConfigRef.current = JSON.stringify(config);
        setHasUnsavedChanges(false);

        // If Auth status is changing, immediately reload without showing messages
        if (authChanging) {
          console.log("Auth status changed - reloading page...");

          // Clear any existing auth credentials from session storage
          sessionStorage.removeItem("auth_credentials");

          // Immediately force a full page reload
          // Use replace to prevent back button issues
          window.location.replace(window.location.href);
          return; // This prevents any further execution
        }

        // Normal save without auth change - update initial auth status
        initialAuthStatus.current = Boolean(newAuthEnabled);

        // Show success message
        if (isAutoSave) {
          console.log(`Auto-saved config (${data.changes_count || 0} changes)`);
          showInfo(
            t("configEditor.autoSaved", { count: data.changes_count || 0 })
          );
        } else {
          showSuccess(
            t("configEditor.savedSuccessfully", {
              count: data.changes_count || 0,
            })
          );
        }
      } else {
        showError("Failed to save configuration");
      }
    } catch (err) {
      if (!isAutoSave) {
        showError(`Error: ${err.message}`);
      } else {
        console.error("Auto-save error:", err.message);
      }
    } finally {
      // Only reset saving state if not reloading
      if (!authChanging) {
        setSaving(false);
      }
    }
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Validate min/max pairs in the config
  const validateMinMaxPairs = (configToValidate) => {
    const errors = {};

    // Validate standard min/max pairs (e.g., MinPointSize vs MaxPointSize)
    MIN_MAX_PAIRS.forEach(({ min, max }) => {
      let minValue, maxValue;

      // Get values from flat or nested structure
      if (usingFlatStructure) {
        minValue = configToValidate[min];
        maxValue = configToValidate[max];
      } else {
        // Try to find the values in the nested structure
        for (const section of Object.keys(configToValidate || {})) {
          if (configToValidate[section]?.[min] !== undefined) {
            minValue = configToValidate[section][min];
          }
          if (configToValidate[section]?.[max] !== undefined) {
            maxValue = configToValidate[section][max];
          }
        }
      }

      // Convert to numbers for comparison
      const minNum = parseFloat(minValue);
      const maxNum = parseFloat(maxValue);

      // Only validate if both values exist and are valid numbers
      if (!isNaN(minNum) && !isNaN(maxNum)) {
        if (minNum > maxNum) {
          errors[
            min
          ] = `Minimum value (${minNum}) cannot be greater than maximum value (${maxNum})`;
          errors[
            max
          ] = `Maximum value (${maxNum}) cannot be less than minimum value (${minNum})`;
        }
      }
    });

    // Validate parent-child dimension constraints
    // Text max width/height cannot exceed parent poster/background min width/height
    PARENT_CHILD_CONSTRAINTS.forEach(({ parent, child, type }) => {
      let parentValue, childValue;

      // Get values from flat or nested structure
      if (usingFlatStructure) {
        parentValue = configToValidate[parent];
        childValue = configToValidate[child];
      } else {
        // Try to find the values in the nested structure
        for (const section of Object.keys(configToValidate || {})) {
          if (configToValidate[section]?.[parent] !== undefined) {
            parentValue = configToValidate[section][parent];
          }
          if (configToValidate[section]?.[child] !== undefined) {
            childValue = configToValidate[section][child];
          }
        }
      }

      // Convert to numbers for comparison
      const parentNum = parseFloat(parentValue);
      const childNum = parseFloat(childValue);

      // Only validate if both values exist and are valid numbers
      if (!isNaN(parentNum) && !isNaN(childNum)) {
        if (childNum > parentNum) {
          const dimension = type === "width" ? "width" : "height";
          errors[
            child
          ] = `Text ${dimension} (${childNum}) cannot be greater than parent image ${dimension} (${parentNum})`;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateValue = (key, value) => {
    let updatedConfig;

    if (usingFlatStructure) {
      updatedConfig = {
        ...config,
        [key]: value,
      };
      setConfig(updatedConfig);
    } else {
      const [section, field] = key.includes(".") ? key.split(".") : [null, key];
      if (section) {
        updatedConfig = {
          ...config,
          [section]: {
            ...config[section],
            [field]: value,
          },
        };
        setConfig(updatedConfig);
      }
    }

    // Check if this field is part of a min/max pair OR parent-child constraint and trigger validation
    const isMinMaxField = MIN_MAX_PAIRS.some(
      ({ min, max }) =>
        key === min ||
        key === max ||
        key.endsWith(`.${min}`) ||
        key.endsWith(`.${max}`)
    );

    const isParentChildField = PARENT_CHILD_CONSTRAINTS.some(
      ({ parent, child }) =>
        key === parent ||
        key === child ||
        key.endsWith(`.${parent}`) ||
        key.endsWith(`.${child}`)
    );

    if ((isMinMaxField || isParentChildField) && updatedConfig) {
      // Use setTimeout to ensure state has updated before validating
      setTimeout(() => validateMinMaxPairs(updatedConfig), 0);
    }
  };

  const getDisplayName = (key) => {
    if (displayNames[key]) {
      return displayNames[key];
    }
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .trim();
  };

  const getGroupsByTab = (tabName) => {
    if (!config) return [];

    const tabGroups = tabs[tabName]?.groups || [];

    if (usingFlatStructure && uiGroups) {
      return tabGroups.filter((groupName) => {
        const groupKeys = uiGroups[groupName] || [];
        return groupKeys.some((key) => key in config);
      });
    } else {
      return tabGroups.filter((groupName) => config[groupName]);
    }
  };

  const getFieldsForGroup = (groupName) => {
    if (!config) return [];

    if (usingFlatStructure && uiGroups) {
      const groupKeys = uiGroups[groupName] || [];
      return groupKeys.filter((key) => key in config);
    } else {
      return Object.keys(config[groupName] || {});
    }
  };

  const formatGroupName = (groupName) => {
    if (groupName.includes(" ")) {
      return groupName;
    }
    return groupName
      .replace(/Part$/, "")
      .replace(/([A-Z])/g, " $1")
      .trim();
  };

  const getGroupIcon = (groupName) => {
    if (
      groupName.includes("Plex") ||
      groupName.includes("Jellyfin") ||
      groupName.includes("Emby") ||
      groupName.includes("Server") ||
      groupName.includes("Settings")
    )
      return Database;
    if (groupName.includes("Overlay") || groupName.includes("Visual"))
      return Palette;
    if (
      groupName.includes("Text") ||
      groupName.includes("Font") ||
      groupName.includes("Collection")
    )
      return Type;
    if (groupName.includes("Notification")) return Bell;
    return Settings;
  };

  const getInputIcon = (key, value) => {
    const keyLower = key.toLowerCase();

    if (typeof value === "boolean" || value === "true" || value === "false")
      return Check;
    if (Array.isArray(value)) return List;
    if (
      keyLower.includes("password") ||
      keyLower.includes("token") ||
      keyLower.includes("key") ||
      keyLower.includes("secret")
    )
      return Lock;
    if (typeof value === "number") return Hash;
    return Type;
  };

  // Filter functions for search
  const matchesSearch = (text) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const getFilteredFieldsForGroup = (groupName) => {
    const allFields = getFieldsForGroup(groupName);
    if (!searchQuery.trim()) return allFields;

    return allFields.filter((key) => {
      const displayName = getDisplayName(key);
      const value = usingFlatStructure ? config[key] : config[groupName]?.[key];
      const stringValue =
        value === null || value === undefined ? "" : String(value);

      // Search in key name, display name, and value
      return (
        matchesSearch(key) ||
        matchesSearch(displayName) ||
        matchesSearch(stringValue)
      );
    });
  };

  const getFilteredGroupsByTab = (tabName) => {
    const groups = getGroupsByTab(tabName);
    if (!searchQuery.trim()) return groups;

    return groups.filter((groupName) => {
      // Check if group name matches
      if (
        matchesSearch(groupName) ||
        matchesSearch(formatGroupName(groupName))
      ) {
        return true;
      }

      // Check if any field in the group matches
      const fieldsInGroup = getFilteredFieldsForGroup(groupName);
      return fieldsInGroup.length > 0;
    });
  };

  // Tooltip Component
  const Tooltip = ({ text, children }) => {
    if (!text) return children;

    return (
      <div className="group relative inline-flex items-center">
        {children}
        <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-80">
          <div className="bg-gray-900 text-white text-sm rounded-lg px-4 py-3 shadow-xl border border-gray-700">
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 border-l border-b border-gray-700 rotate-45"></div>
            {text}
          </div>
        </div>
      </div>
    );
  };

  const getGroupIconForDisplay = (groupName) => {
    const tabIcon = tabs[activeTab]?.icon;
    if (tabIcon) {
      return tabIcon;
    }
    // Fallback auf die alte Logik
    return getGroupIcon(groupName);
  };

  // Get README link for a group
  const getReadmeLink = (groupName) => {
    return README_LINKS[groupName] || null;
  };

  // Helper function to check if a media server field should be disabled
  const isFieldDisabled = (key, groupName) => {
    if (!config) return false;

    const getValue = (fieldKey) => {
      const val = usingFlatStructure
        ? config[fieldKey]
        : config[fieldKey.split(".")[0]]?.[fieldKey.split(".")[1]];
      return val === "true" || val === true;
    };

    // Mapping between UI display group names and their prefixes in flat config
    const groupPrefixMap = {
      "Poster Settings": "Poster",
      "Season Poster Settings": "SeasonPoster",
      "Background Settings": "Background",
      "Title Card Overlay": "TitleCard",
      "Title Card Title Text": "TitleCardTitle",
      "Title Card Episode Text": "TitleCardEP",
      "Show Title on Season": "ShowTitle",
      "Collection Title": "CollectionTitle",
      "Collection Poster": "CollectionPoster",
    };

    const getGroupValue = (group, field) => {
      if (usingFlatStructure) {
        // In flat structure, fields are prefixed with group prefix
        const prefix = groupPrefixMap[group] || "";
        const flatKey = prefix + field;
        const val = config[flatKey];

        // Convert string booleans to actual booleans
        const boolVal = val === "true" || val === true;

        // Debug logging
        console.log(
          `Checking ${group}.${field} -> ${flatKey} = ${val} (converted to: ${boolVal})`
        );

        return boolVal;
      }
      const val = config[group]?.[field];
      const boolVal = val === "true" || val === true;
      console.log(
        `Checking ${group}.${field} (nested) = ${val} (converted to: ${boolVal})`
      );
      return boolVal;
    };

    // Check media server status
    const plexEnabled = getValue("UsePlex");
    const jellyfinEnabled = getValue("UseJellyfin");
    const embyEnabled = getValue("UseEmby");

    // === PLEX FIELDS ===
    // All Plex fields are disabled if Plex is not enabled
    const plexFields = [
      "PlexUrl",
      "PlexToken",
      "PlexLibstoExclude",
      "PlexUploadExistingAssets",
      "PlexUpload",
    ];
    if (plexFields.includes(key) && !plexEnabled) {
      return true;
    }

    // === JELLYFIN FIELDS ===
    // Connection fields (URL, API, Libs) are enabled if Jellyfin OR JellySync is enabled
    const jellyfinConnectionFields = [
      "JellyfinUrl",
      "JellyfinAPIKey",
      "JellyfinLibstoExclude",
    ];
    if (
      jellyfinConnectionFields.includes(key) &&
      !jellyfinEnabled &&
      !useJellySync
    ) {
      return true;
    }

    // Upload/Replace fields ONLY depend on UseJellyfin (NOT on Sync)
    const jellyfinUploadFields = [
      "JellyfinUploadExistingAssets",
      "JellyfinReplaceThumbwithBackdrop",
    ];
    if (jellyfinUploadFields.includes(key) && !jellyfinEnabled) {
      return true;
    }

    // === EMBY FIELDS ===
    // Connection fields (URL, API, Libs) are enabled if Emby OR EmbySync is enabled
    const embyConnectionFields = ["EmbyUrl", "EmbyAPIKey", "EmbyLibstoExclude"];
    if (embyConnectionFields.includes(key) && !embyEnabled && !useEmbySync) {
      return true;
    }

    // Upload/Replace fields ONLY depend on UseEmby (NOT on Sync)
    const embyUploadFields = [
      "EmbyUploadExistingAssets",
      "EmbyReplaceThumbwithBackdrop",
    ];
    if (embyUploadFields.includes(key) && !embyEnabled) {
      return true;
    }

    // === TEXT FORMATTING CONDITIONAL DISABLING ===
    // SymbolsToKeepOnNewLine is only enabled when NewLineOnSpecificSymbols is true
    if (key === "SymbolsToKeepOnNewLine") {
      const newLineOnSpecificSymbols = getValue("NewLineOnSpecificSymbols");
      if (!newLineOnSpecificSymbols) return true;
    }

    // NewLineSymbols is only enabled when NewLineOnSpecificSymbols is true
    if (key === "NewLineSymbols") {
      const newLineOnSpecificSymbols = getValue("NewLineOnSpecificSymbols");
      if (!newLineOnSpecificSymbols) return true;
    }

    // === OVERLAY AND TEXT CONDITIONAL DISABLING ===
    const keyLower = key.toLowerCase();

    console.log(
      `isFieldDisabled called: key="${key}", groupName="${groupName}", keyLower="${keyLower}"`
    );

    // Groups where AddBorder affects bordercolor and borderwidth
    const borderGroups = [
      "Collection Poster",
      "Background Settings",
      "Season Poster Settings",
      "Poster Settings",
      "Title Card Overlay",
    ];

    // Groups where AddText affects text-related fields
    const textGroups = [
      "Collection Poster",
      "Background Settings",
      "Season Poster Settings",
      "Poster Settings",
    ];

    // Groups where AddTextStroke affects stroke fields
    const strokeGroups = [
      "Collection Poster",
      "Background Settings",
      "Season Poster Settings",
      "Poster Settings",
      "Show Title on Season",
      "Title Card Title Text",
      "Title Card Episode Text",
      "Collection Title",
    ];

    // Border-related fields
    if (
      borderGroups.includes(groupName) &&
      (keyLower.includes("bordercolor") || keyLower.includes("borderwidth"))
    ) {
      console.log(`🔶 Border field detected in ${groupName}`);
      const addBorder = getGroupValue(groupName, "AddBorder");
      console.log(`   AddBorder = ${addBorder}, returning ${!addBorder}`);
      if (!addBorder) return true;
    }

    // Text-related fields (when AddText is false)
    const textFieldSuffixes = [
      "addtextstroke",
      "strokecolor",
      "strokewidth",
      "minpointsize",
      "maxpointsize",
      "maxwidth",
      "maxheight",
      "text_offset",
      "textoffset", // Flat structure uses CamelCase without underscore
      "linespacing",
      "textgravity",
      "fontallcaps",
      "fontcolor",
    ];

    if (
      textGroups.includes(groupName) &&
      textFieldSuffixes.some((suffix) => keyLower.endsWith(suffix))
    ) {
      console.log(`Text field detected: ${keyLower} in ${groupName}`);
      const addText = getGroupValue(groupName, "AddText");
      console.log(`   AddText = ${addText}, returning ${!addText}`);
      if (!addText) return true;
    }

    // Stroke-related fields (when AddTextStroke is false)
    const strokeFieldSuffixes = ["strokecolor", "strokewidth"];

    if (
      strokeGroups.includes(groupName) &&
      strokeFieldSuffixes.some((suffix) => keyLower.endsWith(suffix))
    ) {
      console.log(`Stroke field detected: ${keyLower} in ${groupName}`);
      const addTextStroke = getGroupValue(groupName, "AddTextStroke");
      console.log(
        `   AddTextStroke = ${addTextStroke}, returning ${!addTextStroke}`
      );
      if (!addTextStroke) return true;
    }

    // Show Title on Season - when AddShowTitletoSeason is false
    if (
      groupName === "Show Title on Season" &&
      textFieldSuffixes.some((suffix) => keyLower.endsWith(suffix))
    ) {
      console.log(`📺 Show Title field detected: ${keyLower}`);
      const addShowTitle = getGroupValue(groupName, "AddShowTitletoSeason");
      console.log(
        `   AddShowTitletoSeason = ${addShowTitle}, returning ${!addShowTitle}`
      );
      if (!addShowTitle) return true;
    }

    // Title Card Title Text - when AddEPTitleText is false
    if (
      groupName === "Title Card Title Text" &&
      textFieldSuffixes.some((suffix) => keyLower.endsWith(suffix))
    ) {
      console.log(`🎬 Title Card Title field detected: ${keyLower}`);
      const addEPTitleText = getGroupValue(groupName, "AddEPTitleText");
      console.log(
        `   AddEPTitleText = ${addEPTitleText}, returning ${!addEPTitleText}`
      );
      if (!addEPTitleText) return true;
    }

    // Title Card Episode Text - when AddEPText is false
    if (
      groupName === "Title Card Episode Text" &&
      textFieldSuffixes.some((suffix) => keyLower.endsWith(suffix))
    ) {
      console.log(`🎞️ Title Card Episode field detected: ${keyLower}`);
      const addEPText = getGroupValue(groupName, "AddEPText");
      console.log(`   AddEPText = ${addEPText}, returning ${!addEPText}`);
      if (!addEPText) return true;
    }

    // Collection Title - when AddCollectionTitle is false
    if (
      groupName === "Collection Title" &&
      textFieldSuffixes.some((suffix) => keyLower.endsWith(suffix))
    ) {
      console.log(`Collection Title field detected: ${keyLower}`);
      const addCollectionTitle = getGroupValue(groupName, "AddCollectionTitle");
      console.log(
        `   AddCollectionTitle = ${addCollectionTitle}, returning ${!addCollectionTitle}`
      );
      if (!addCollectionTitle) return true;
    }

    return false;
  };

  const renderInput = (groupName, key, value) => {
    const Icon = getInputIcon(key, value);
    const fieldKey = usingFlatStructure ? key : `${groupName}.${key}`;
    const displayName = getDisplayName(key);

    // ============ OVERLAY FILE DROPDOWN WITH UPLOAD ============
    if (OVERLAY_FILE_FIELDS.includes(key)) {
      const stringValue =
        value === null || value === undefined ? "" : String(value);
      const dropdownKey = `overlay-${fieldKey}`;

      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            {/* Dropdown */}
            <div
              className="relative flex-1"
              ref={(el) => (dropdownRefs.current[dropdownKey] = el)}
            >
              <button
                onClick={() => toggleDropdown(dropdownKey)}
                className="w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between"
              >
                <span
                  className={
                    stringValue ? "text-theme-text" : "text-theme-muted"
                  }
                >
                  {stringValue || "-- Select Overlay File --"}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-theme-muted transition-transform ${
                    isDropdownOpen(dropdownKey) ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen(dropdownKey) && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => closeDropdown(dropdownKey)}
                  />
                  <div
                    className="fixed z-50 rounded-lg bg-theme-card border border-theme shadow-lg max-h-60 overflow-y-auto"
                    style={{
                      left: dropdownRefs.current[
                        dropdownKey
                      ]?.getBoundingClientRect().left,
                      width: dropdownRefs.current[dropdownKey]?.offsetWidth,
                      ...(isDropdownUp(dropdownKey)
                        ? {
                            bottom:
                              window.innerHeight -
                              dropdownRefs.current[
                                dropdownKey
                              ]?.getBoundingClientRect().top +
                              8,
                          }
                        : {
                            top:
                              dropdownRefs.current[
                                dropdownKey
                              ]?.getBoundingClientRect().bottom + 8,
                          }),
                    }}
                  >
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                        Select Overlay File
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          closeDropdown(dropdownKey);
                          updateValue(fieldKey, "");
                        }}
                        className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                          !stringValue
                            ? "bg-theme-primary text-white"
                            : "text-gray-300 hover:bg-theme-hover"
                        }`}
                      >
                        -- Select Overlay File --
                      </button>
                      {overlayFiles.map((file) => (
                        <button
                          key={file.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            closeDropdown(dropdownKey);
                            updateValue(fieldKey, file.name);
                          }}
                          className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                            stringValue === file.name
                              ? "bg-theme-primary text-white"
                              : "text-gray-300 hover:bg-theme-hover"
                          }`}
                        >
                          {file.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Upload Button */}
            <label
              className={`flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer ${
                uploadingOverlay ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <input
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleOverlayFileUpload(file);
                    e.target.value = ""; // Reset input
                  }
                }}
                className="hidden"
                disabled={uploadingOverlay}
              />
              {uploadingOverlay ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Upload</span>
            </label>

            {/* Preview Button */}
            {stringValue && (
              <button
                onClick={() => setPreviewOverlay(stringValue)}
                className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm"
                title="Preview overlay image"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}
          </div>

          {/* Current file display */}
          {stringValue && (
            <p className="text-xs text-theme-muted">
              Current:{" "}
              <span className="font-mono text-theme-primary">
                {stringValue}
              </span>
            </p>
          )}

          {/* Help text */}
          <p className="text-xs text-theme-muted">
            Upload PNG, JPG, or JPEG files to the Overlayfiles directory
          </p>
        </div>
      );
    }

    // ============ FONT FILE DROPDOWN WITH UPLOAD ============
    if (FONT_FILE_FIELDS.includes(key)) {
      const stringValue =
        value === null || value === undefined ? "" : String(value);
      const dropdownKey = `font-${fieldKey}`;

      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            {/* Dropdown */}
            <div
              className="relative flex-1"
              ref={(el) => (dropdownRefs.current[dropdownKey] = el)}
            >
              <button
                onClick={() => toggleDropdown(dropdownKey)}
                className="w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between"
              >
                <span
                  className={
                    stringValue ? "text-theme-text" : "text-theme-muted"
                  }
                >
                  {stringValue || "-- Select Font File --"}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-theme-muted transition-transform ${
                    isDropdownOpen(dropdownKey) ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen(dropdownKey) && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => closeDropdown(dropdownKey)}
                  />
                  <div
                    className="fixed z-50 rounded-lg bg-theme-card border border-theme shadow-lg max-h-60 overflow-y-auto"
                    style={{
                      left: dropdownRefs.current[
                        dropdownKey
                      ]?.getBoundingClientRect().left,
                      width: dropdownRefs.current[dropdownKey]?.offsetWidth,
                      ...(isDropdownUp(dropdownKey)
                        ? {
                            bottom:
                              window.innerHeight -
                              dropdownRefs.current[
                                dropdownKey
                              ]?.getBoundingClientRect().top +
                              8,
                          }
                        : {
                            top:
                              dropdownRefs.current[
                                dropdownKey
                              ]?.getBoundingClientRect().bottom + 8,
                          }),
                    }}
                  >
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                        Select Font File
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          closeDropdown(dropdownKey);
                          updateValue(fieldKey, "");
                        }}
                        className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                          !stringValue
                            ? "bg-theme-primary text-white"
                            : "text-gray-300 hover:bg-theme-hover"
                        }`}
                      >
                        -- Select Font File --
                      </button>
                      {fontFiles.map((file) => (
                        <button
                          key={file}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            closeDropdown(dropdownKey);
                            updateValue(fieldKey, file);
                          }}
                          className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                            stringValue === file
                              ? "bg-theme-primary text-white"
                              : "text-gray-300 hover:bg-theme-hover"
                          }`}
                        >
                          {file}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Upload Button */}
            <label
              className={`flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer ${
                uploadingFont ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFontFileUpload(file);
                    e.target.value = ""; // Reset input
                  }
                }}
                className="hidden"
                disabled={uploadingFont}
              />
              {uploadingFont ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Upload</span>
            </label>

            {/* Preview Button */}
            {stringValue && (
              <button
                onClick={() => setPreviewFont(stringValue)}
                className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm"
                title="Preview font"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}
          </div>

          {/* Current file display */}
          {stringValue && (
            <p className="text-xs text-theme-muted">
              Current:{" "}
              <span className="font-mono text-theme-primary">
                {stringValue}
              </span>
            </p>
          )}

          {/* Help text */}
          <p className="text-xs text-theme-muted">
            Upload TTF, OTF, WOFF, or WOFF2 font files to the Overlayfiles
            directory
          </p>
        </div>
      );
    }

    // ============ LANGUAGE ORDER SELECTOR ============
    if (
      key === "PreferredLanguageOrder" ||
      key === "PreferredSeasonLanguageOrder" ||
      key === "PreferredBackgroundLanguageOrder" ||
      key === "PreferredTCLanguageOrder"
    ) {
      return (
        <LanguageOrderSelector
          value={Array.isArray(value) ? value : []}
          onChange={(newValue) => updateValue(fieldKey, newValue)}
          label={displayName}
          helpText={CONFIG_TOOLTIPS[key]}
        />
      );
    }

    // ============ LIBRARY EXCLUSION SELECTOR ============
    if (key === "PlexLibstoExclude") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <LibraryExclusionSelector
          value={Array.isArray(value) ? value : []}
          onChange={(newValue) => updateValue(fieldKey, newValue)}
          helpText={CONFIG_TOOLTIPS[key]}
          mediaServerType="plex"
          config={config}
          disabled={disabled}
          showIncluded={true}
        />
      );
    }

    if (key === "JellyfinLibstoExclude") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <LibraryExclusionSelector
          value={Array.isArray(value) ? value : []}
          onChange={(newValue) => updateValue(fieldKey, newValue)}
          helpText={CONFIG_TOOLTIPS[key]}
          mediaServerType="jellyfin"
          config={config}
          disabled={disabled}
          showIncluded={true}
        />
      );
    }

    if (key === "EmbyLibstoExclude") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <LibraryExclusionSelector
          value={Array.isArray(value) ? value : []}
          onChange={(newValue) => updateValue(fieldKey, newValue)}
          helpText={CONFIG_TOOLTIPS[key]}
          mediaServerType="emby"
          config={config}
          disabled={disabled}
          showIncluded={true}
        />
      );
    }

    // Handle arrays with pill-style tags
    if (Array.isArray(value)) {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-3">
          <textarea
            defaultValue={value.join(", ")}
            onBlur={(e) => {
              const arrayValue = e.target.value
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item !== "");
              updateValue(fieldKey, arrayValue);
            }}
            onInput={(e) => autoResize(e.target)}
            ref={(textarea) => textarea && autoResize(textarea)}
            rows={1}
            disabled={disabled}
            className={`w-full px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px] ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder="Enter comma-separated values"
          />
          {value.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-theme-bg rounded-lg border border-theme">
              {value.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-theme-primary/20 text-theme-primary rounded-full text-sm border border-theme-primary/30"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    const type = typeof value;
    const keyLower = key.toLowerCase();
    const stringValue =
      value === null || value === undefined ? "" : String(value);

    // List of fields stored as real booleans (true/false)
    const booleanFields = ["basicAuthEnabled"];

    // List of fields stored as string "true"/"false" (lowercase)
    const lowercaseStringBooleanFields = [
      "UsePlex",
      "UseJellyfin",
      "UseEmby",
      "WidthHeightFilter",
      "PlexUploadExistingAssets",
      "JellyfinUploadExistingAssets",
      "JellyfinReplaceThumbwithBackdrop",
      "EmbyUploadExistingAssets",
      "EmbyReplaceThumbwithBackdrop",
      "show_skipped",
      "AssetCleanup",
      "FollowSymlink",
      "SkipTBA",
      "SkipJapTitle",
      "SkipAddText",
      "SkipAddTextAndOverlay",
      "DisableOnlineAssetFetch",
      "AutoUpdateIM",
      "AutoUpdatePosterizarr",
      "ForceRunningDeletion",
      "DisableHashValidation",
      "ImageProcessing",
      "NewLineOnSpecificSymbols",
      "Posters",
      "SeasonPosters",
      "BackgroundPosters",
      "TitleCards",
      "LibraryFolders",
      "PlexUpload",
      "PosterFontAllCaps",
      "PosterAddBorder",
      "PosterAddText",
      "PosterAddOverlay",
      "PosterAddTextStroke",
      "BackgroundFontAllCaps",
      "BackgroundAddOverlay",
      "BackgroundAddBorder",
      "BackgroundAddText",
      "BackgroundAddTextStroke",
      "TitleCardUseBackgroundAsTitleCard",
      "TitleCardAddOverlay",
      "TitleCardAddBorder",
      "TitleCardBackgroundFallback",
      "TitleCardTitleFontAllCaps",
      "TitleCardTitleAddEPTitleText",
      "TitleCardTitleAddTextStroke",
      "TitleCardEPFontAllCaps",
      "TitleCardEPAddEPText",
      "TitleCardEPAddTextStroke",
      "SeasonPosterFontAllCaps",
      "SeasonPosterAddBorder",
      "SeasonPosterAddText",
      "SeasonPosterAddOverlay",
      "SeasonPosterAddTextStroke",
      "SeasonPosterShowFallback",
      "ShowTitleAddShowTitletoSeason",
      "ShowTitleFontAllCaps",
      "ShowTitleAddTextStroke",
      "CollectionTitleAddCollectionTitle",
      "CollectionTitleFontAllCaps",
      "CollectionTitleAddTextStroke",
      "CollectionPosterFontAllCaps",
      "CollectionPosterAddBorder",
      "CollectionPosterAddText",
      "CollectionPosterAddTextStroke",
      "CollectionPosterAddOverlay",
      "UsePosterResolutionOverlays",
      "UseBackgroundResolutionOverlays",
      "UseTCResolutionOverlays",
    ];

    // List of fields stored as string "True"/"False" (CAPITAL)
    const capitalizedStringBooleanFields = [
      "SendNotification",
      "UseUptimeKuma",
    ];

    // Enhanced boolean toggle switch - supports 3 types: Boolean, "true"/"false", "True"/"False"
    if (
      type === "boolean" ||
      value === "true" ||
      value === "false" ||
      value === "True" ||
      value === "False" ||
      lowercaseStringBooleanFields.includes(key) ||
      capitalizedStringBooleanFields.includes(key)
    ) {
      // Determine which type to use
      const isBoolean = booleanFields.includes(key);
      const isCapitalizedString = capitalizedStringBooleanFields.includes(key);
      const isLowercaseString = lowercaseStringBooleanFields.includes(key);

      // Determine current state (enabled/disabled)
      const isEnabled =
        value === "true" || value === true || value === "True" || value === 1;

      // Special handling for Media Server toggles (only one can be active)
      const isMediaServerToggle = [
        "UsePlex",
        "UseJellyfin",
        "UseEmby",
      ].includes(key);

      // Check if this field should be disabled
      const disabled = isFieldDisabled(key, groupName);

      // Determine the reason for being disabled
      const getDisabledReason = () => {
        if (!disabled) return null;

        // Check for media server dependencies
        if (key.includes("Plex")) return "Plex to be enabled";
        if (key.includes("Jellyfin")) return "Jellyfin to be enabled";
        if (key.includes("Emby")) return "Emby to be enabled";

        // Check for overlay/text dependencies based on field type
        const keyLower = key.toLowerCase();

        // Border fields
        if (
          keyLower.includes("bordercolor") ||
          keyLower.includes("borderwidth")
        ) {
          return "Add Border to be enabled";
        }

        // Text stroke fields
        if (
          keyLower.includes("strokecolor") ||
          keyLower.includes("strokewidth")
        ) {
          return "Add Text Stroke to be enabled";
        }

        // General text fields
        if (
          keyLower.includes("fontallcaps") ||
          keyLower.includes("fontcolor") ||
          keyLower.includes("minpointsize") ||
          keyLower.includes("maxpointsize") ||
          keyLower.includes("maxwidth") ||
          keyLower.includes("maxheight") ||
          keyLower.includes("linespacing") ||
          keyLower.includes("textgravity") ||
          keyLower.includes("addtextstroke") ||
          keyLower.includes("textoffset")
        ) {
          return "Add Text to be enabled";
        }

        return "required settings to be enabled";
      };

      return (
        <div
          className={`flex items-center justify-between h-[42px] px-4 bg-theme-bg rounded-lg border border-theme transition-all ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-theme-primary/30"
          }`}
        >
          <div className="text-sm font-medium text-theme-text">
            {displayName}
            {disabled && (
              <span className="text-xs text-theme-muted ml-2">
                (Requires {getDisabledReason()})
              </span>
            )}
          </div>
          <label
            className={`relative inline-flex items-center ${
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              checked={isEnabled}
              disabled={disabled}
              onChange={(e) => {
                // Decide based on field type which value to save
                let newValue;

                if (isBoolean) {
                  // Real booleans for Auth
                  newValue = e.target.checked;
                } else if (isCapitalizedString) {
                  // String with capital letters for Notifications
                  newValue = e.target.checked ? "True" : "False";
                } else {
                  // String with lowercase letters for everything else (default)
                  newValue = e.target.checked ? "true" : "false";
                }

                // Special handling for Media Server toggles - Radio button behavior
                if (isMediaServerToggle && e.target.checked) {
                  // When turning ON a media server, turn OFF the others
                  // We need to batch all updates together to avoid race conditions
                  let batchedConfig;

                  if (usingFlatStructure) {
                    batchedConfig = {
                      ...config,
                      UsePlex: key === "UsePlex" ? newValue : "false",
                      UseJellyfin: key === "UseJellyfin" ? newValue : "false",
                      UseEmby: key === "UseEmby" ? newValue : "false",
                    };
                  } else {
                    batchedConfig = {
                      ...config,
                      PlexPart: {
                        ...config.PlexPart,
                        UsePlex: key === "UsePlex" ? newValue : "false",
                      },
                      JellyfinPart: {
                        ...config.JellyfinPart,
                        UseJellyfin: key === "UseJellyfin" ? newValue : "false",
                      },
                      EmbyPart: {
                        ...config.EmbyPart,
                        UseEmby: key === "UseEmby" ? newValue : "false",
                      },
                    };
                  }

                  setConfig(batchedConfig);
                } else {
                  updateValue(fieldKey, newValue);
                }
              }}
              className="sr-only peer"
              id={`${groupName}-${key}`}
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-theme-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
          </label>
        </div>
      );
    }

    // ============ DROPDOWN FOR FAVPROVIDER ============
    if (key === "FavProvider") {
      const providerOptions = ["tmdb", "tvdb", "fanart"];

      return (
        <div className="space-y-2">
          <div className="relative" ref={favProviderDropdownRef}>
            <button
              onClick={() => {
                const shouldOpenUp = calculateDropdownPosition(
                  favProviderDropdownRef
                );
                setFavProviderDropdownUp(shouldOpenUp);
                setFavProviderDropdownOpen(!favProviderDropdownOpen);
              }}
              className="w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between"
            >
              <span>{stringValue.toUpperCase()}</span>
              <ChevronDown
                className={`w-5 h-5 text-theme-muted transition-transform ${
                  favProviderDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {favProviderDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setFavProviderDropdownOpen(false)}
                />
                <div
                  className={`absolute z-50 left-0 right-0 ${
                    favProviderDropdownUp ? "bottom-full mb-2" : "top-full mt-2"
                  } rounded-lg bg-theme-card border border-theme shadow-lg overflow-hidden`}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                      Select Provider
                    </div>
                    {providerOptions.map((option) => (
                      <button
                        key={option}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setFavProviderDropdownOpen(false);
                          updateValue(fieldKey, option);
                        }}
                        className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                          stringValue.toLowerCase() === option
                            ? "bg-theme-primary text-white"
                            : "text-gray-300 hover:bg-theme-hover"
                        }`}
                      >
                        {option.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-theme-muted">
            Select your preferred metadata provider (recommended: TMDB)
          </p>
        </div>
      );
    }

    // ============ DROPDOWN FOR TMDB_VOTE_SORTING ============
    if (key === "tmdb_vote_sorting") {
      const sortingOptions = [
        { value: "vote_average", label: "Vote Average" },
        { value: "vote_count", label: "Vote Count" },
        { value: "primary", label: "Primary (Default TMDB View)" },
      ];

      return (
        <div className="space-y-2">
          <div className="relative" ref={tmdbSortingDropdownRef}>
            <button
              onClick={() => {
                const shouldOpenUp = calculateDropdownPosition(
                  tmdbSortingDropdownRef
                );
                setTmdbSortingDropdownUp(shouldOpenUp);
                setTmdbSortingDropdownOpen(!tmdbSortingDropdownOpen);
              }}
              className="w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between"
            >
              <span>
                {sortingOptions.find((opt) => opt.value === stringValue)
                  ?.label || "Select sorting"}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-theme-muted transition-transform ${
                  tmdbSortingDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {tmdbSortingDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setTmdbSortingDropdownOpen(false)}
                />
                <div
                  className={`absolute z-50 left-0 right-0 ${
                    tmdbSortingDropdownUp ? "bottom-full mb-2" : "top-full mt-2"
                  } rounded-lg bg-theme-card border border-theme shadow-lg overflow-hidden`}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                      Select Sorting
                    </div>
                    {sortingOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setTmdbSortingDropdownOpen(false);
                          updateValue(fieldKey, option.value);
                        }}
                        className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                          stringValue === option.value
                            ? "bg-theme-primary text-white"
                            : "text-gray-300 hover:bg-theme-hover"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-theme-muted">
            Picture sorting method via TMDB API
          </p>
        </div>
      );
    }

    // ============ SERVICES MIT VALIDATE-BUTTONS ============

    // Plex Token mit Validate-Button
    if (key === "PlexToken") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={stringValue}
                onChange={(e) => updateValue(fieldKey, e.target.value)}
                disabled={disabled}
                className={`w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                placeholder={
                  disabled ? "Enable Plex first" : "Enter Plex token"
                }
              />
              <Lock
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted ${
                  disabled ? "opacity-50" : ""
                }`}
              />
            </div>
            <ValidateButton
              type="plex"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
              disabled={disabled}
            />
          </div>
          <p className="text-xs text-theme-muted">
            {disabled
              ? "This field is only available when Plex is selected as your media server"
              : "Your Plex authentication token"}
          </p>
        </div>
      );
    }

    // Jellyfin API Key mit Validate-Button
    if (key === "JellyfinAPIKey") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={stringValue}
                onChange={(e) => updateValue(fieldKey, e.target.value)}
                disabled={disabled}
                className={`w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                placeholder={
                  disabled
                    ? "Enable Jellyfin or JellySync first"
                    : "Enter Jellyfin API key"
                }
              />
              <Lock
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted ${
                  disabled ? "opacity-50" : ""
                }`}
              />
            </div>
            <ValidateButton
              type="jellyfin"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
              disabled={disabled}
            />
          </div>
          <p className="text-xs text-theme-muted">
            {disabled
              ? "This field is available when Jellyfin is selected as your media server OR when JellySync is enabled"
              : "Create API key in Jellyfin at Settings → Advanced → API Keys"}
          </p>
        </div>
      );
    }

    // Emby API Key mit Validate-Button
    if (key === "EmbyAPIKey") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={stringValue}
                onChange={(e) => updateValue(fieldKey, e.target.value)}
                disabled={disabled}
                className={`w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                placeholder={
                  disabled
                    ? "Enable Emby or EmbySync first"
                    : "Enter Emby API key"
                }
              />
              <Lock
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted ${
                  disabled ? "opacity-50" : ""
                }`}
              />
            </div>
            <ValidateButton
              type="emby"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
              disabled={disabled}
            />
          </div>
          <p className="text-xs text-theme-muted">
            {disabled
              ? "This field is available when Emby is selected as your media server OR when EmbySync is enabled"
              : "Create API key in Emby at Settings → Advanced → API Keys"}
          </p>
        </div>
      );
    }

    // ============ MEDIA SERVER URL FIELDS ============

    // Plex URL
    if (key === "PlexUrl") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-2">
          <textarea
            value={stringValue}
            onChange={(e) => {
              updateValue(fieldKey, e.target.value);
              autoResize(e.target);
            }}
            onInput={(e) => autoResize(e.target)}
            ref={(textarea) => textarea && autoResize(textarea)}
            disabled={disabled}
            rows={1}
            className={`w-full px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px] ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder={
              disabled ? "Enable Plex first" : "http://192.168.1.1:32400"
            }
          />
          <p className="text-xs text-theme-muted">
            {disabled
              ? "This field is only available when Plex is selected as your media server"
              : "Your Plex server URL (e.g., http://192.168.1.1:32400)"}
          </p>
        </div>
      );
    }

    // Jellyfin URL
    if (key === "JellyfinUrl") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-2">
          <textarea
            value={stringValue}
            onChange={(e) => {
              updateValue(fieldKey, e.target.value);
              autoResize(e.target);
            }}
            onInput={(e) => autoResize(e.target)}
            ref={(textarea) => textarea && autoResize(textarea)}
            disabled={disabled}
            rows={1}
            className={`w-full px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px] ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder={
              disabled
                ? "Enable Jellyfin or JellySync first"
                : "http://192.168.1.1:8096"
            }
          />
          <p className="text-xs text-theme-muted">
            {disabled
              ? "This field is available when Jellyfin is selected as your media server OR when JellySync is enabled"
              : "Your Jellyfin server URL (e.g., http://192.168.1.1:8096)"}
          </p>
        </div>
      );
    }

    // Emby URL
    if (key === "EmbyUrl") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-2">
          <textarea
            value={stringValue}
            onChange={(e) => {
              updateValue(fieldKey, e.target.value);
              autoResize(e.target);
            }}
            onInput={(e) => autoResize(e.target)}
            ref={(textarea) => textarea && autoResize(textarea)}
            disabled={disabled}
            rows={1}
            className={`w-full px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px] ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder={
              disabled
                ? "Enable Emby or EmbySync first"
                : "http://192.168.1.1:8096/emby"
            }
          />
          <p className="text-xs text-theme-muted">
            {disabled
              ? "This field is available when Emby is selected as your media server OR when EmbySync is enabled"
              : "Your Emby server URL (e.g., http://192.168.1.1:8096/emby)"}
          </p>
        </div>
      );
    }

    // ============ API KEYS MIT VALIDATE-BUTTONS ============

    // TMDB Token mit Validate-Button
    if (key === "tmdbtoken") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={stringValue}
                onChange={(e) => updateValue(fieldKey, e.target.value)}
                className="w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10"
                placeholder="Enter TMDB Read Access Token"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            </div>
            <ValidateButton
              type="tmdb"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
            />
          </div>
          <p className="text-xs text-theme-muted">
            Your TMDB API Read Access Token (the really long one)
          </p>
        </div>
      );
    }

    // TVDB API Key mit Validate-Button
    if (key === "tvdbapi") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={stringValue}
                onChange={(e) => updateValue(fieldKey, e.target.value)}
                className="w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10"
                placeholder="Enter TVDB API Key (optionally with #PIN)"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            </div>
            <ValidateButton
              type="tvdb"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
            />
          </div>
          <p className="text-xs text-theme-muted">
            Format: YourApiKey or YourApiKey#YourPin (for subscribers)
          </p>
        </div>
      );
    }

    // Fanart.tv API Key mit Validate-Button
    if (key === "FanartTvAPIKey") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={stringValue}
                onChange={(e) => updateValue(fieldKey, e.target.value)}
                className="w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10"
                placeholder="Enter Fanart.tv Personal API Key"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            </div>
            <ValidateButton
              type="fanart"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
            />
          </div>
          <p className="text-xs text-theme-muted">
            Your Fanart.tv Personal API Key
          </p>
        </div>
      );
    }

    // ============ NOTIFICATIONS with VALIDATE-BUTTONS ============

    // Discord Webhook mit Validate-Button
    if (key === "Discord") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <textarea
              value={stringValue}
              onChange={(e) => {
                updateValue(fieldKey, e.target.value);
                autoResize(e.target);
              }}
              onInput={(e) => autoResize(e.target)}
              ref={(textarea) => textarea && autoResize(textarea)}
              rows={1}
              className="flex-1 px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px]"
              placeholder="https://discord.com/api/webhooks/..."
            />
            <ValidateButton
              type="discord"
              config={config}
              label="Test"
              onSuccess={showSuccess}
              onError={showError}
            />
          </div>
          <p className="text-xs text-theme-muted">
            Discord webhook URL (sends a test message when validated)
          </p>
        </div>
      );
    }

    // Apprise URL mit Validate-Button
    if (key === "AppriseUrl") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <textarea
              value={stringValue}
              onChange={(e) => {
                updateValue(fieldKey, e.target.value);
                autoResize(e.target);
              }}
              onInput={(e) => autoResize(e.target)}
              ref={(textarea) => textarea && autoResize(textarea)}
              rows={1}
              className="flex-1 px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px]"
              placeholder="discord://... or telegram://... etc."
            />
            <ValidateButton
              type="apprise"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
            />
          </div>
          <p className="text-xs text-theme-muted">
            Apprise notification URL (format check only)
          </p>
        </div>
      );
    }

    // Uptime Kuma URL mit Validate-Button
    if (key === "UptimeKumaUrl") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <textarea
              value={stringValue}
              onChange={(e) => {
                updateValue(fieldKey, e.target.value);
                autoResize(e.target);
              }}
              onInput={(e) => autoResize(e.target)}
              ref={(textarea) => textarea && autoResize(textarea)}
              rows={1}
              className="flex-1 px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px]"
              placeholder="https://uptime-kuma.domain.com/api/push/..."
            />
            <ValidateButton
              type="uptimekuma"
              config={config}
              label="Test"
              onSuccess={showSuccess}
              onError={showError}
            />
          </div>
          <p className="text-xs text-theme-muted">
            Uptime Kuma push monitor URL (sends test ping when validated)
          </p>
        </div>
      );
    }

    // Handle text_offset specially with enhanced number input
    if (keyLower.includes("offset") || keyLower === "text_offset") {
      const disabled = isFieldDisabled(key, groupName);

      // Parse the current value - keep the sign!
      let parsedValue = 0;
      if (stringValue) {
        // Remove + if present, keep - if present
        const cleanValue = stringValue.replace(/^\+/, "");
        parsedValue = parseInt(cleanValue, 10) || 0;
      }

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={parsedValue}
              disabled={disabled}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === "-") {
                  updateValue(fieldKey, "");
                } else {
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    // Format with explicit + or - sign
                    const formattedValue = num >= 0 ? `+${num}` : `${num}`;
                    updateValue(fieldKey, formattedValue);
                  }
                }
              }}
              onBlur={(e) => {
                // Ensure proper formatting on blur
                const val = e.target.value;
                if (val === "" || val === "-" || val === "+") {
                  updateValue(fieldKey, "+0");
                } else {
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    const formattedValue = num >= 0 ? `+${num}` : `${num}`;
                    updateValue(fieldKey, formattedValue);
                  }
                }
              }}
              className={`flex-1 h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              placeholder="0"
            />
            <div className="flex items-center gap-1 px-3 py-2 bg-theme-bg border border-theme rounded-lg text-theme-muted text-sm font-mono min-w-[60px] justify-center">
              <span
                className={`font-bold ${
                  parsedValue >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {parsedValue >= 0 ? "+" : "-"}
              </span>
              <span>{Math.abs(parsedValue)}</span>
            </div>
          </div>
          <p className="text-xs text-theme-muted">
            Offset from bottom of image. Positive (+) moves up, negative (-)
            moves down
          </p>
        </div>
      );
    }

    // ============ LOG LEVEL (1, 2, or 3) ============
    if (key === "logLevel") {
      const numValue = String(stringValue || "2");
      const logLevelOptions = [
        { value: "1", label: "1 - Warning/Error messages only" },
        { value: "2", label: "2 - Info/Warning/Error messages (Default)" },
        { value: "3", label: "3 - Info/Warning/Error/Debug (Most verbose)" },
      ];

      return (
        <div className="space-y-2">
          <div className="relative" ref={logLevelDropdownRef}>
            <button
              onClick={() => {
                const shouldOpenUp =
                  calculateDropdownPosition(logLevelDropdownRef);
                setLogLevelDropdownUp(shouldOpenUp);
                setLogLevelDropdownOpen(!logLevelDropdownOpen);
              }}
              className="w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between"
            >
              <span>
                {logLevelOptions.find((opt) => opt.value === numValue)?.label ||
                  "Select log level"}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-theme-muted transition-transform ${
                  logLevelDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {logLevelDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLogLevelDropdownOpen(false)}
                />
                <div
                  className={`absolute z-50 left-0 right-0 ${
                    logLevelDropdownUp ? "bottom-full mb-2" : "top-full mt-2"
                  } rounded-lg bg-theme-card border border-theme shadow-lg overflow-hidden`}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                      Select Log Level
                    </div>
                    {logLevelOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setLogLevelDropdownOpen(false);
                          updateValue(fieldKey, option.value);
                        }}
                        className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                          numValue === option.value
                            ? "bg-theme-primary text-white"
                            : "text-gray-300 hover:bg-theme-hover"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-theme-muted">
            Logging verbosity: 1 = Warning/Error, 2 = Info/Warning/Error
            (default), 3 = Info/Warning/Error/Debug
          </p>
        </div>
      );
    }

    // ============ TEXT GRAVITY (Alignment) ============
    if (keyLower.includes("gravity") || keyLower.endsWith("textgravity")) {
      const gravityValue = String(stringValue || "South");
      const disabled = isFieldDisabled(key, groupName);
      const gravityOptions = [
        { value: "NorthWest", label: "NorthWest (Top Left)" },
        { value: "North", label: "North (Top Center)" },
        { value: "NorthEast", label: "NorthEast (Top Right)" },
        { value: "West", label: "West (Middle Left)" },
        { value: "Center", label: "Center (Middle Center)" },
        { value: "East", label: "East (Middle Right)" },
        { value: "SouthWest", label: "SouthWest (Bottom Left)" },
        { value: "South", label: "South (Bottom Center)" },
        { value: "SouthEast", label: "SouthEast (Bottom Right)" },
      ];

      const dropdownKey = `gravity-${fieldKey}`;

      return (
        <div className="space-y-2">
          <div
            className="relative"
            ref={(el) => (dropdownRefs.current[dropdownKey] = el)}
          >
            <button
              onClick={() => !disabled && toggleDropdown(dropdownKey)}
              disabled={disabled}
              className={`w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between ${
                disabled
                  ? "opacity-50 cursor-not-allowed hover:bg-theme-bg hover:border-theme"
                  : ""
              }`}
            >
              <span>
                {gravityOptions.find((opt) => opt.value === gravityValue)
                  ?.label || gravityValue}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-theme-muted transition-transform ${
                  isDropdownOpen(dropdownKey) ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen(dropdownKey) && !disabled && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => closeDropdown(dropdownKey)}
                />
                <div
                  className="fixed z-50 rounded-lg bg-theme-card border border-theme shadow-lg max-h-60 overflow-y-auto"
                  style={{
                    left: dropdownRefs.current[
                      dropdownKey
                    ]?.getBoundingClientRect().left,
                    width: dropdownRefs.current[dropdownKey]?.offsetWidth,
                    ...(isDropdownUp(dropdownKey)
                      ? {
                          bottom:
                            window.innerHeight -
                            dropdownRefs.current[
                              dropdownKey
                            ]?.getBoundingClientRect().top +
                            8,
                        }
                      : {
                          top:
                            dropdownRefs.current[
                              dropdownKey
                            ]?.getBoundingClientRect().bottom + 8,
                        }),
                  }}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                      Select Alignment
                    </div>
                    {gravityOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          closeDropdown(dropdownKey);
                          updateValue(fieldKey, option.value);
                        }}
                        className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                          gravityValue === option.value
                            ? "bg-theme-primary text-white"
                            : "text-gray-300 hover:bg-theme-hover"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-theme-muted">
            Text alignment position within the text box
          </p>
        </div>
      );
    }

    // ============ OUTPUT QUALITY (1-100%) ============
    if (key === "outputQuality") {
      // Parse the value - handle both "92" and "92%" formats for display
      // Strip % for input display, but save WITH % to config
      let displayValue = String(stringValue || "").trim();
      if (displayValue.endsWith("%")) {
        displayValue = displayValue.slice(0, -1).trim();
      }

      const numValue = displayValue === "" ? "" : Number(displayValue);
      const isInvalid =
        displayValue !== "" &&
        (numValue < 1 || numValue > 100 || isNaN(numValue));

      return (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={displayValue}
              onChange={(e) => {
                const val = e.target.value.trim();
                // Allow empty or valid integers between 1-100
                // Store WITH % symbol for backend compatibility
                if (val === "") {
                  updateValue(fieldKey, "");
                } else {
                  const numVal = Number(val);
                  if (
                    !isNaN(numVal) &&
                    numVal >= 1 &&
                    numVal <= 100 &&
                    Number.isInteger(numVal)
                  ) {
                    // Save with % symbol (integers only)
                    updateValue(fieldKey, val + "%");
                  }
                }
              }}
              onBlur={(e) => {
                // Enforce bounds on blur and round to integer
                let val = e.target.value.trim();
                if (val !== "") {
                  const numVal = Number(val);
                  if (!isNaN(numVal)) {
                    const intVal = Math.round(numVal);
                    if (intVal < 1) {
                      updateValue(fieldKey, "1%");
                    } else if (intVal > 100) {
                      updateValue(fieldKey, "100%");
                    } else {
                      // Save with % symbol (integers only)
                      updateValue(fieldKey, String(intVal) + "%");
                    }
                  }
                }
              }}
              className={`w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border ${
                isInvalid ? "border-red-500" : "border-theme"
              } rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all`}
              placeholder="1-100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted text-sm font-medium pointer-events-none">
              %
            </span>
          </div>
          <p className="text-xs text-theme-muted">
            Image quality percentage (1-100). Default: 92%. Setting to 100%
            doubles file size
          </p>
          {isInvalid && (
            <p className="text-xs text-red-400">
              Value must be between 1 and 100
            </p>
          )}
        </div>
      );
    }

    // ============ COLOR FIELDS (WITH COLOR PICKER) ============
    if (
      keyLower.includes("color") ||
      keyLower.includes("fontcolor") ||
      keyLower.includes("bordercolor") ||
      keyLower.includes("strokecolor")
    ) {
      const disabled = isFieldDisabled(key, groupName);

      // Determine if current value is hex or color name
      const isHexColor = stringValue.match(/^#[0-9A-Fa-f]{6}$/);
      const currentInputType = isHexColor ? "hex" : "name";

      // Common CSS color names supported by ImageMagick
      const colorNames = [
        "white",
        "black",
        "red",
        "green",
        "blue",
        "yellow",
        "cyan",
        "magenta",
        "gray",
        "grey",
        "silver",
        "maroon",
        "olive",
        "lime",
        "aqua",
        "teal",
        "navy",
        "fuchsia",
        "purple",
        "orange",
        "brown",
        "pink",
        "gold",
        "violet",
        "indigo",
        "turquoise",
        "tan",
        "khaki",
        "coral",
        "salmon",
        "crimson",
        "lavender",
        "plum",
        "orchid",
        "chocolate",
        "sienna",
      ].sort();

      // Convert hex to RGB for preview contrast calculation
      const hexToRgb = (hex) => {
        if (!hex || !hex.startsWith("#")) return null;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : null;
      };

      const rgb = isHexColor ? hexToRgb(stringValue) : null;

      return (
        <div className="space-y-2">
          {/* Input Type Toggle */}
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => {
                if (currentInputType === "hex" && !disabled) {
                  // Switch to name, default to white
                  updateValue(fieldKey, "white");
                }
              }}
              disabled={disabled}
              className={`flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm ${
                currentInputType === "name"
                  ? "bg-theme-primary text-white border-theme-primary"
                  : ""
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Color Name
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentInputType === "name" && !disabled) {
                  // Switch to hex, default to white
                  updateValue(fieldKey, "#FFFFFF");
                }
              }}
              disabled={disabled}
              className={`flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm ${
                currentInputType === "hex"
                  ? "bg-theme-primary text-white border-theme-primary"
                  : ""
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Hex Code
            </button>
          </div>

          {currentInputType === "name" ? (
            // Color Name Dropdown
            <div
              className="relative"
              ref={(el) => (dropdownRefs.current[`color-${fieldKey}`] = el)}
            >
              <button
                onClick={() => !disabled && toggleDropdown(`color-${fieldKey}`)}
                disabled={disabled}
                className={`w-full h-[42px] pl-12 pr-10 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between ${
                  disabled
                    ? "opacity-50 cursor-not-allowed hover:bg-theme-bg hover:border-theme"
                    : ""
                }`}
              >
                <span
                  className={
                    stringValue ? "text-theme-text" : "text-theme-muted"
                  }
                >
                  {stringValue
                    ? stringValue.charAt(0).toUpperCase() + stringValue.slice(1)
                    : "-- Select Color --"}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-theme-muted transition-transform ${
                    isDropdownOpen(`color-${fieldKey}`) ? "rotate-180" : ""
                  }`}
                />
              </button>

              {stringValue && (
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded border-2 border-gray-400 shadow-sm pointer-events-none z-10"
                  style={{ backgroundColor: stringValue }}
                  title={stringValue}
                />
              )}

              {isDropdownOpen(`color-${fieldKey}`) && !disabled && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => closeDropdown(`color-${fieldKey}`)}
                  />
                  <div
                    className="fixed z-50 rounded-lg bg-theme-card border border-theme shadow-lg max-h-60 overflow-y-auto"
                    style={{
                      left: dropdownRefs.current[
                        `color-${fieldKey}`
                      ]?.getBoundingClientRect().left,
                      width:
                        dropdownRefs.current[`color-${fieldKey}`]?.offsetWidth,
                      ...(isDropdownUp(`color-${fieldKey}`)
                        ? {
                            bottom:
                              window.innerHeight -
                              dropdownRefs.current[
                                `color-${fieldKey}`
                              ]?.getBoundingClientRect().top +
                              8,
                          }
                        : {
                            top:
                              dropdownRefs.current[
                                `color-${fieldKey}`
                              ]?.getBoundingClientRect().bottom + 8,
                          }),
                    }}
                  >
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                        Select Color
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          closeDropdown(`color-${fieldKey}`);
                          updateValue(fieldKey, "");
                        }}
                        className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                          !stringValue
                            ? "bg-theme-primary text-white"
                            : "text-gray-300 hover:bg-theme-hover"
                        }`}
                      >
                        -- Select Color --
                      </button>
                      {colorNames.map((color) => (
                        <button
                          key={color}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            closeDropdown(`color-${fieldKey}`);
                            updateValue(fieldKey, color);
                          }}
                          className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left flex items-center gap-2 ${
                            stringValue.toLowerCase() === color
                              ? "bg-theme-primary text-white"
                              : "text-gray-300 hover:bg-theme-hover"
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded border border-gray-400"
                            style={{ backgroundColor: color }}
                          />
                          {color.charAt(0).toUpperCase() + color.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Hex Color Picker
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={stringValue}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    // Allow empty or partial hex while typing
                    if (
                      val === "" ||
                      val === "#" ||
                      /^#[0-9A-F]{0,6}$/.test(val)
                    ) {
                      updateValue(fieldKey, val);
                    }
                  }}
                  onBlur={(e) => {
                    // Validate and fix on blur
                    let val = e.target.value.toUpperCase();
                    if (!val.startsWith("#")) {
                      val = "#" + val;
                    }
                    // Pad with zeros if incomplete
                    if (val.length < 7) {
                      val = val.padEnd(7, "0");
                    }
                    // Validate hex format
                    if (/^#[0-9A-F]{6}$/.test(val)) {
                      updateValue(fieldKey, val);
                    } else {
                      // Fallback to white if invalid
                      updateValue(fieldKey, "#FFFFFF");
                    }
                  }}
                  disabled={disabled}
                  className={`w-full h-[42px] px-12 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono ${
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  placeholder="#FFFFFF"
                  maxLength={7}
                />
                {/* Color preview swatch on the left */}
                <div
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border-2 border-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: stringValue || "#FFFFFF" }}
                  title={stringValue}
                />
              </div>
              {/* Native color picker */}
              <input
                type="color"
                value={
                  stringValue && /^#[0-9A-Fa-f]{6}$/.test(stringValue)
                    ? stringValue
                    : "#FFFFFF"
                }
                onChange={(e) =>
                  updateValue(fieldKey, e.target.value.toUpperCase())
                }
                disabled={disabled}
                className={`h-[42px] w-[42px] bg-theme-bg border border-theme rounded-lg cursor-pointer ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Pick color"
              />
            </div>
          )}

          {/* Preview and current value */}
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <div
              className="w-full h-8 rounded border border-theme flex items-center justify-center font-mono text-sm"
              style={{
                backgroundColor: stringValue || "#FFFFFF",
                color:
                  rgb && rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114 > 128
                    ? "#000000"
                    : "#FFFFFF",
              }}
            >
              {stringValue || "No color"}
            </div>
          </div>
          <p className="text-xs text-theme-muted">
            Choose a color name or hex code (e.g., #FFFFFF)
          </p>
        </div>
      );
    }

    // ============ NUMERIC FIELDS (WITH VALIDATION) ============
    if (
      type === "number" ||
      keyLower.includes("port") ||
      keyLower.includes("size") ||
      keyLower.includes("width") ||
      keyLower.includes("height") ||
      keyLower.includes("pointsize") ||
      keyLower.includes("borderwidth") ||
      keyLower.includes("strokewidth") ||
      keyLower.includes("spacing") ||
      keyLower === "maxlogs"
    ) {
      const disabled = isFieldDisabled(key, groupName);
      const hasError = validationErrors[key];

      return (
        <div className="space-y-2">
          <input
            type="number"
            min="0"
            step="1"
            value={stringValue}
            onChange={(e) => {
              const val = e.target.value;
              // Only allow empty string or valid non-negative numbers
              if (val === "" || (!isNaN(val) && Number(val) >= 0)) {
                updateValue(fieldKey, val);
              }
            }}
            onKeyDown={(e) => {
              // Prevent minus sign, 'e', '+', and other non-numeric keys
              if (
                e.key === "-" ||
                e.key === "e" ||
                e.key === "E" ||
                e.key === "+"
              ) {
                e.preventDefault();
              }
            }}
            disabled={disabled}
            className={`w-full h-[42px] px-4 py-2.5 bg-theme-bg border ${
              hasError ? "border-red-500" : "border-theme"
            } rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 ${
              hasError
                ? "focus:ring-red-500 focus:border-red-500"
                : "focus:ring-theme-primary focus:border-theme-primary"
            } transition-all ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder="Enter number"
          />
          {hasError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {hasError}
            </p>
          )}
        </div>
      );
    }

    // Generic password/token/key/secret handling (WITHOUT Validate button for other fields)
    if (
      keyLower.includes("password") ||
      keyLower.includes("token") ||
      keyLower.includes("key") ||
      keyLower.includes("secret")
    ) {
      return (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={stringValue}
              onChange={(e) => updateValue(fieldKey, e.target.value)}
              className="w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10"
              placeholder="Enter secure value"
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
          </div>
        </div>
      );
    }

    // Check if field should be disabled
    const disabled = isFieldDisabled(key, groupName);

    if (
      stringValue.length > 100 ||
      keyLower.includes("path") ||
      keyLower.includes("url")
    ) {
      return (
        <div className="space-y-2">
          <textarea
            value={stringValue}
            onChange={(e) => {
              updateValue(fieldKey, e.target.value);
              autoResize(e.target);
            }}
            onInput={(e) => autoResize(e.target)}
            ref={(textarea) => textarea && autoResize(textarea)}
            rows={1}
            disabled={disabled}
            className={`w-full px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px] ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <input
          type="text"
          value={stringValue}
          onChange={(e) => updateValue(fieldKey, e.target.value)}
          disabled={disabled}
          className={`w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-theme-primary mx-auto mb-4" />
          <p className="text-theme-muted">{t("configEditor.loadingConfig")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 rounded-xl p-6 border-2 border-red-600/50 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-300 text-lg font-semibold mb-2">
          {t("configEditor.errorLoadingConfig")}
        </p>
        <p className="text-red-200 mb-4">{error}</p>
        <button
          onClick={fetchConfig}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all shadow-lg hover:scale-105"
        >
          <RefreshCw className="w-5 h-5 inline mr-2" />
          {t("configEditor.retry")}
        </button>
      </div>
    );
  }

  const TabIcon = tabs[activeTab]?.icon || Settings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Left side - Unsaved changes indicator */}
        <div className="flex items-center gap-4">
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1 text-xs text-yellow-500">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              Unsaved changes
            </span>
          )}
          {Object.keys(validationErrors).length > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3 h-3" />
              {Object.keys(validationErrors).length} validation{" "}
              {Object.keys(validationErrors).length === 1 ? "error" : "errors"}
            </span>
          )}
        </div>

        {/* Right side - Buttons */}
        <div className="flex gap-3">
          <button
            onClick={fetchConfig}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 text-theme-primary ${
                loading ? "animate-spin" : ""
              }`}
            />
            <span className="text-theme-text">{t("configEditor.reload")}</span>
          </button>
          <button
            onClick={() => saveConfig(false)}
            disabled={saving || Object.keys(validationErrors).length > 0}
            className={`flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border ${
              Object.keys(validationErrors).length > 0
                ? "border-red-500"
                : hasUnsavedChanges
                ? "border-yellow-500 animate-pulse"
                : "border-theme"
            } hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            title={
              Object.keys(validationErrors).length > 0
                ? "Fix validation errors before saving"
                : t("configEditor.saveConfigTitle")
            }
          >
            {saving ? (
              <Loader2 className="w-4 h-4 text-theme-primary animate-spin" />
            ) : (
              <Save
                className={`w-4 h-4 ${
                  Object.keys(validationErrors).length > 0
                    ? "text-red-500"
                    : hasUnsavedChanges
                    ? "text-yellow-500"
                    : "text-theme-primary"
                }`}
              />
            )}
            <span className="text-theme-text">
              {saving
                ? t("configEditor.saving")
                : t("configEditor.saveChanges")}
            </span>
            {!saving && (
              <span className="hidden sm:inline text-xs opacity-70 ml-1">
                (Ctrl+↵)
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Auto-Save Toggle */}
      <div className="bg-theme-card rounded-xl p-4 border border-theme shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-theme-primary/10">
              <Save className="w-5 h-5 text-theme-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-theme-text">
                {t("configEditor.autoSave")}
              </h3>
              <p className="text-xs text-theme-muted mt-0.5">
                {t("configEditor.autoSaveDescription")}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 focus:ring-offset-theme-bg ${
              autoSaveEnabled ? "bg-theme-primary" : "bg-gray-600"
            }`}
            aria-label={t("configEditor.autoSave")}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoSaveEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-theme-card rounded-xl p-4 border border-theme shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("configEditor.searchPlaceholder")}
            className="w-full pl-12 pr-4 py-3 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-theme-muted mt-2">
            {t("configEditor.filteringSettings", { query: searchQuery })}
          </p>
        )}
      </div>

      {/* Expand/Collapse All Controls */}
      <div className="bg-theme-card rounded-xl p-4 border border-theme shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-theme-text">
            <span className="font-medium">
              {t("configEditor.section", {
                count: getFilteredGroupsByTab(activeTab).filter(
                  (groupName) => getFilteredFieldsForGroup(groupName).length > 0
                ).length,
              })}
            </span>
            {searchQuery && (
              <span className="ml-2 text-theme-muted text-sm">
                ({t("configEditor.filtered")})
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const allGroups = getFilteredGroupsByTab(activeTab);
                const newExpandedState = {};
                allGroups.forEach((groupName) => {
                  if (getFilteredFieldsForGroup(groupName).length > 0) {
                    newExpandedState[groupName] = true;
                  }
                });
                setExpandedGroups(newExpandedState);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
              <Expand className="w-4 h-4 text-theme-primary" />
              {t("configEditor.expandAll")}
            </button>
            <button
              onClick={() => {
                setExpandedGroups({});
              }}
              className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
              <Minimize className="w-4 h-4 text-theme-primary" />
              {t("configEditor.collapseAll")}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Groups */}
      <div className="space-y-4">
        {getFilteredGroupsByTab(activeTab).map((groupName) => {
          const GroupIcon = getGroupIconForDisplay(groupName);
          const isExpanded = expandedGroups[groupName];
          const fields = getFilteredFieldsForGroup(groupName);
          const settingsCount = fields.length;
          const readmeLink = getReadmeLink(groupName);

          // Don't show groups with no matching fields when searching
          if (searchQuery && settingsCount === 0) return null;

          return (
            <div
              key={groupName}
              className="bg-theme-card rounded-xl border border-theme overflow-hidden hover:border-theme-primary/50 transition-all shadow-sm"
            >
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(groupName)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-theme-hover transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-theme-primary/10 group-hover:bg-theme-primary/20 group-hover:scale-110 transition-all">
                    <GroupIcon className="w-6 h-6 text-theme-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold text-theme-primary">
                      {formatGroupName(groupName)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-theme-muted">
                        {settingsCount} setting
                        {settingsCount !== 1 ? "s" : ""}
                        {searchQuery && " (filtered)"}
                      </p>
                      {readmeLink && (
                        <a
                          href={readmeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 text-theme-text rounded-lg transition-all shadow-sm hover:scale-105"
                          title="Open settings documentation in GitHub README"
                        >
                          <Github className="w-3.5 h-3.5 text-theme-primary" />
                          <span>SETTINGS WIKI</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isExpanded
                        ? "bg-theme-card text-theme-primary border border-theme-primary/50 shadow-sm"
                        : "bg-theme-card text-theme-muted border border-theme"
                    }`}
                  >
                    {isExpanded ? "Open" : "Closed"}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-6 h-6 text-theme-primary transition-transform" />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-theme-muted transition-transform" />
                  )}
                </div>
              </button>

              {/* Group Content */}
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-theme bg-theme-bg/30">
                  <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {fields.map((key, index) => {
                      const value = usingFlatStructure
                        ? config[key]
                        : config[groupName]?.[key];

                      const displayName = getDisplayName(key);

                      // Create array to hold the field(s) to render
                      const fieldsToRender = [];

                      // Special styling for toggles to span both columns
                      const isFullWidthToggle =
                        (key === "NewLineOnSpecificSymbols" &&
                          groupName === "Text Formatting") ||
                        (key === "UsePosterResolutionOverlays" &&
                          groupName === "Resolution Overlays") ||
                        (key === "UseBackgroundResolutionOverlays" &&
                          groupName === "Resolution Overlays") ||
                        (key === "UseTCResolutionOverlays" &&
                          groupName === "Resolution Overlays");

                      // Special styling for Library Exclusion Selectors to span both columns
                      const isFullWidthLibrarySelector =
                        key === "PlexLibstoExclude" ||
                        key === "JellyfinLibstoExclude" ||
                        key === "EmbyLibstoExclude";

                      // Main field
                      fieldsToRender.push(
                        <div
                          key={key}
                          className={`space-y-3 ${
                            isFullWidthToggle || isFullWidthLibrarySelector
                              ? "lg:col-span-2"
                              : ""
                          }`}
                        >
                          <label className="block">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-theme-primary">
                                  {displayName}
                                </span>
                                {CONFIG_TOOLTIPS[key] && (
                                  <Tooltip text={CONFIG_TOOLTIPS[key]}>
                                    <HelpCircle className="w-4 h-4 text-theme-muted hover:text-theme-primary cursor-help transition-colors" />
                                  </Tooltip>
                                )}
                              </div>
                              {key !== displayName && (
                                <span className="text-xs text-theme-muted font-mono bg-theme-bg px-2 py-1 rounded">
                                  {getCleanSettingKey(key)}
                                </span>
                              )}
                            </div>
                            {renderInput(groupName, key, value)}
                          </label>
                        </div>
                      );

                      // Insert WebUI Log Level dropdown after basicAuthPassword in WebUI Settings
                      if (
                        key === "basicAuthPassword" &&
                        groupName === "WebUI Settings"
                      ) {
                        fieldsToRender.push(
                          <div key="webuiLogLevel-ui" className="space-y-3">
                            <label className="block">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-theme-primary">
                                    WebUI Backend Log Level
                                  </span>
                                  {CONFIG_TOOLTIPS["webuiLogLevel"] && (
                                    <Tooltip
                                      text={CONFIG_TOOLTIPS["webuiLogLevel"]}
                                    >
                                      <HelpCircle className="w-4 h-4 text-theme-muted hover:text-theme-primary cursor-help transition-colors" />
                                    </Tooltip>
                                  )}
                                </div>
                              </div>

                              {/* WebUI Log Level Dropdown */}
                              <div
                                className="relative"
                                ref={webuiLogLevelDropdownRef}
                              >
                                <button
                                  onClick={() => {
                                    const shouldOpenUp =
                                      calculateDropdownPosition(
                                        webuiLogLevelDropdownRef
                                      );
                                    setWebuiLogLevelDropdownUp(shouldOpenUp);
                                    setWebuiLogLevelDropdownOpen(
                                      !webuiLogLevelDropdownOpen
                                    );
                                  }}
                                  className="w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between"
                                >
                                  <span className="text-theme-text">
                                    {webuiLogLevel}
                                  </span>
                                  <ChevronDown
                                    className={`w-5 h-5 text-theme-muted transition-transform ${
                                      webuiLogLevelDropdownOpen
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                </button>

                                {webuiLogLevelDropdownOpen && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() =>
                                        setWebuiLogLevelDropdownOpen(false)
                                      }
                                    />
                                    <div
                                      className={`absolute z-50 left-0 right-0 ${
                                        webuiLogLevelDropdownUp
                                          ? "bottom-full mb-2"
                                          : "top-full mt-2"
                                      } rounded-lg bg-theme-card border border-theme shadow-lg overflow-hidden`}
                                    >
                                      <div className="p-2">
                                        <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                                          Select Log Level
                                        </div>
                                        {[
                                          "DEBUG",
                                          "INFO",
                                          "WARNING",
                                          "ERROR",
                                          "CRITICAL",
                                        ].map((level) => (
                                          <button
                                            key={level}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              e.preventDefault();
                                              setWebuiLogLevelDropdownOpen(
                                                false
                                              );
                                              updateWebuiLogLevel(level);
                                            }}
                                            className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                                              webuiLogLevel === level
                                                ? "bg-theme-primary text-white"
                                                : "text-gray-300 hover:bg-theme-hover"
                                            }`}
                                          >
                                            {level}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </label>
                          </div>
                        );
                      }

                      // Insert UseJellySync after UseJellyfin
                      if (
                        key === "UseJellyfin" &&
                        (groupName === "JellyfinPart" ||
                          groupName === "Jellyfin Settings")
                      ) {
                        // Check if UseJellyfin is enabled - if yes, disable the Sync toggle
                        const jellyfinEnabled = usingFlatStructure
                          ? config["UseJellyfin"] === "true" ||
                            config["UseJellyfin"] === true
                          : config["JellyfinPart"]?.UseJellyfin === "true" ||
                            config["JellyfinPart"]?.UseJellyfin === true;

                        fieldsToRender.push(
                          <div key="UseJellySync-ui" className="space-y-3">
                            <label className="block">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-theme-primary">
                                    Use JellySync
                                  </span>
                                  {CONFIG_TOOLTIPS["UseJellySync"] && (
                                    <Tooltip
                                      text={CONFIG_TOOLTIPS["UseJellySync"]}
                                    >
                                      <HelpCircle className="w-4 h-4 text-theme-muted hover:text-theme-primary cursor-help transition-colors" />
                                    </Tooltip>
                                  )}
                                </div>
                                <span className="text-xs text-theme-muted font-mono bg-theme-bg px-2 py-1 rounded">
                                  UI Only
                                </span>
                              </div>
                              <div
                                className={`flex items-center justify-between h-[42px] px-4 bg-theme-bg rounded-lg border border-theme transition-all ${
                                  jellyfinEnabled
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:border-theme-primary/30"
                                }`}
                              >
                                <div className="text-sm font-medium text-theme-text">
                                  Use JellySync
                                  {jellyfinEnabled && (
                                    <span className="text-xs text-theme-muted ml-2">
                                      (Disabled when Jellyfin is active)
                                    </span>
                                  )}
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={useJellySync}
                                    onChange={(e) =>
                                      setUseJellySync(e.target.checked)
                                    }
                                    disabled={jellyfinEnabled}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-theme-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                                </label>
                              </div>
                            </label>
                          </div>
                        );
                      }

                      // Insert UseEmbySync after UseEmby
                      if (
                        key === "UseEmby" &&
                        (groupName === "EmbyPart" ||
                          groupName === "Emby Settings")
                      ) {
                        // Check if UseEmby is enabled - if yes, disable the Sync toggle
                        const embyEnabled = usingFlatStructure
                          ? config["UseEmby"] === "true" ||
                            config["UseEmby"] === true
                          : config["EmbyPart"]?.UseEmby === "true" ||
                            config["EmbyPart"]?.UseEmby === true;

                        fieldsToRender.push(
                          <div key="UseEmbySync-ui" className="space-y-3">
                            <label className="block">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-theme-primary">
                                    Use EmbySync
                                  </span>
                                  {CONFIG_TOOLTIPS["UseEmbySync"] && (
                                    <Tooltip
                                      text={CONFIG_TOOLTIPS["UseEmbySync"]}
                                    >
                                      <HelpCircle className="w-4 h-4 text-theme-muted hover:text-theme-primary cursor-help transition-colors" />
                                    </Tooltip>
                                  )}
                                </div>
                                <span className="text-xs text-theme-muted font-mono bg-theme-bg px-2 py-1 rounded">
                                  UI Only
                                </span>
                              </div>
                              <div
                                className={`flex items-center justify-between h-[42px] px-4 bg-theme-bg rounded-lg border border-theme transition-all ${
                                  embyEnabled
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:border-theme-primary/30"
                                }`}
                              >
                                <div className="text-sm font-medium text-theme-text">
                                  Use EmbySync
                                  {embyEnabled && (
                                    <span className="text-xs text-theme-muted ml-2">
                                      (Disabled when Emby is active)
                                    </span>
                                  )}
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={useEmbySync}
                                    onChange={(e) =>
                                      setUseEmbySync(e.target.checked)
                                    }
                                    disabled={embyEnabled}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-theme-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                                </label>
                              </div>
                            </label>
                          </div>
                        );
                      }

                      return fieldsToRender;
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* No Results Message */}
        {searchQuery && getFilteredGroupsByTab(activeTab).length === 0 && (
          <div className="bg-theme-card rounded-xl p-12 border border-theme text-center">
            <Search className="w-12 h-12 text-theme-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-theme-text mb-2">
              {t("configEditor.noSettingsFound")}
            </h3>
            <p className="text-theme-muted mb-4">
              {t("configEditor.noSettingsMatch", {
                query: searchQuery,
                tab: activeTab,
              })}
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-theme-text font-medium transition-all shadow-sm"
            >
              {t("configEditor.clearSearch")}
            </button>
          </div>
        )}
      </div>

      {/* Overlay Preview Modal */}
      {previewOverlay && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setPreviewOverlay(null)}
        >
          <div
            className="bg-theme-card rounded-xl border border-theme shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-theme sticky top-0 bg-theme-card z-10">
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-theme-primary" />
                <h3 className="text-lg font-semibold text-theme-text">
                  {t("configEditor.overlayPreview")}
                </h3>
              </div>
              <button
                onClick={() => setPreviewOverlay(null)}
                className="p-2 hover:bg-theme-hover rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-theme-text" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-theme-muted mb-1">
                  {t("configEditor.filename")}:
                </p>
                <p className="text-theme-text font-mono bg-theme-bg px-3 py-2 rounded-lg border border-theme">
                  {previewOverlay}
                </p>
              </div>

              {/* Image Preview with Checkered Background */}
              <div className="relative bg-theme-bg rounded-lg border border-theme p-4 flex items-center justify-center overflow-hidden">
                {/* Checkered background for transparency */}
                <div
                  className="absolute inset-0 rounded-lg"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #3a3a3a 25%, transparent 25%),
                      linear-gradient(-45deg, #3a3a3a 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #3a3a3a 75%),
                      linear-gradient(-45deg, transparent 75%, #3a3a3a 75%)
                    `,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                ></div>
                <img
                  src={`${API_URL}/overlayfiles/preview/${encodeURIComponent(
                    previewOverlay
                  )}`}
                  alt={previewOverlay}
                  className="relative z-10 max-w-full h-auto object-contain rounded-lg shadow-lg"
                  style={{ maxHeight: "55vh" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div
                  className="hidden flex-col items-center gap-3 text-theme-muted relative z-10"
                  style={{ display: "none" }}
                >
                  <AlertCircle className="w-12 h-12" />
                  <p>{t("configEditor.failedLoadImage")}</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setPreviewOverlay(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Font Preview Modal */}
      {previewFont && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setPreviewFont(null)}
        >
          <div
            className="bg-theme-card rounded-xl border border-theme shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-theme sticky top-0 bg-theme-card z-10">
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-theme-primary" />
                <h3 className="text-lg font-semibold text-theme-text">
                  {t("configEditor.fontPreview")}
                </h3>
              </div>
              <button
                onClick={() => setPreviewFont(null)}
                className="p-2 hover:bg-theme-hover rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-theme-text" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-theme-muted mb-1">
                  {t("configEditor.filename")}:
                </p>
                <p className="text-theme-text font-mono bg-theme-bg px-3 py-2 rounded-lg border border-theme">
                  {previewFont}
                </p>
              </div>

              {/* Font Preview Samples */}
              <div className="space-y-3">
                <div className="bg-theme-bg rounded-lg border border-theme p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-theme-muted mb-1">
                        {t("configEditor.uppercase")}:
                      </p>
                      <img
                        src={`${API_URL}/fonts/preview/${encodeURIComponent(
                          previewFont
                        )}?text=ABCDEFGHIJKLMNOPQRSTUVWXYZ`}
                        alt="Uppercase letters"
                        className="w-full h-auto object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-theme-muted mb-1">
                        {t("configEditor.lowercase")}:
                      </p>
                      <img
                        src={`${API_URL}/fonts/preview/${encodeURIComponent(
                          previewFont
                        )}?text=abcdefghijklmnopqrstuvwxyz`}
                        alt="Lowercase letters"
                        className="w-full h-auto object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-theme-muted mb-1">
                        {t("configEditor.numbers")}:
                      </p>
                      <img
                        src={`${API_URL}/fonts/preview/${encodeURIComponent(
                          previewFont
                        )}?text=0123456789`}
                        alt="Numbers"
                        className="w-full h-auto object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-theme-muted mb-1">
                        {t("configEditor.sample")}:
                      </p>
                      <img
                        src={`${API_URL}/fonts/preview/${encodeURIComponent(
                          previewFont
                        )}?text=The Quick Brown Fox Jumps Over The Lazy Dog`}
                        alt="Sample text"
                        className="w-full h-auto object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setPreviewFont(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigEditor;
