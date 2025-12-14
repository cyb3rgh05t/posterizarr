# 🚀 API Endpoints

The following API endpoints are available.

**Authentication:**
- **Option 1 (Recommended):** Add `?api_key=YOUR_KEY` to the URL.
- **Option 2:** Use the `X-API-Key: YOUR_KEY` header.
- **Option 3:** Use Basic Authentication (username/password).
  - `http://admin:posterizarr@YOUR_IP:8000/api/webhook/tautulli`

---

## ⚙️ System

### `/api`
Returns the basic status of the API server.

??? example "View Response"
    ```json
    {
      "message": "Posterizarr Web UI API",
      "status": "running"
    }
    ```

### `/api/system-info`
Returns hardware and OS information about the host system.

??? example "View Response"
    ```json
    {
      "platform": "Linux",
      "os_version": "Alpine Linux v3.22",
      "cpu_model": "11th Gen Intel(R) Core(TM) i5-1145G7 @ 2.60GHz",
      "cpu_cores": 8,
      "total_memory": "63931 MB",
      "used_memory": "9589 MB",
      "free_memory": "54342 MB",
      "memory_percent": 15.0,
      "is_docker": true
    }
    ```

### `/api/version`
Checks installed version against remote GitHub version.

??? example "View Response"
    ```json
    {
      "local": "2.1.15",
      "remote": "2.1.15",
      "is_update_available": false
    }
    ```

### `/api/releases`
Fetches the latest release notes from GitHub.

??? example "View Response"
    ```json
    {
      "success": true,
      "releases": [
        {
          "version": "2.1.15",
          "name": "v2.1.15",
          "published_at": "2025-11-21T11:00:57Z",
          "days_ago": 4,
          "is_prerelease": false,
          "is_draft": false,
          "html_url": "[https://github.com/fscorrupt/posterizarr/releases/tag/2.1.15](https://github.com/fscorrupt/posterizarr/releases/tag/2.1.15)",
          "body": "## What's Changed\r\n* Fix missing assets in gallery..."
        }
      ]
    }
    ```

---

## 📊 Status & Monitoring

### `/api/status`
Returns the current execution status of the script.

??? example "View Response"
    ```json
    {
      "running": false,
      "manual_running": false,
      "scheduler_running": false,
      "scheduler_is_executing": false,
      "last_logs": [
        "[2025-11-25 16:34:18] [INFO]    |L.33500| Finished, Total images created: 0",
        "[2025-11-25 16:34:18] [INFO]    |L.6718 |      Text-size cache: hits='0', misses='0' (0%); magick_calls='0' in '0 ms'; est_saved='0h 0m 0s'",
        "[2025-11-25 16:34:18] [INFO]    |L.33561| Script execution time: 0h 4m 14s",
        "[2025-11-25 16:34:20] [INFO]    |L.6705 | Uptime Kuma webhook sent: Status=up, Msg=OK, Ping=254627"
      ],
      "script_exists": true,
      "config_exists": true,
      "pid": null,
      "current_mode": null,
      "active_log": "Scriptlog.log",
      "already_running_detected": false,
      "running_file_exists": false,
      "start_time": null
    }
    ```

### `/api/scheduler/status`
Details regarding the internal scheduler, next run times, and active jobs.

??? example "View Response"
    ```json
    {
      "success": true,
      "enabled": true,
      "running": true,
      "is_executing": false,
      "schedules": [
        {
          "time": "01:30",
          "description": "30min before Kometa"
        },
        {
          "time": "04:30",
          "description": "30min before Kometa"
        }
      ],
      "timezone": "Europe/Berlin",
      "last_run": "2025-11-25T16:30:00.002702",
      "next_run": "2025-11-25T19:30:00+01:00",
      "active_jobs": [
        {
          "id": "posterizarr_normal_6",
          "name": "Posterizarr Normal Mode @ 19:30",
          "next_run": "2025-11-25T19:30:00+01:00"
        }
      ]
    }
    ```

### `/api/runtime-history`
Returns a full history of previous script executions.

??? example "View Response"
    ```json
    {
      "success": true,
      "history": [
        {
          "id": 327,
          "timestamp": "2025-11-25T16:30:03",
          "mode": "scheduled",
          "runtime_seconds": 254,
          "runtime_formatted": "0h 4m 14s",
          "total_images": 0,
          "posters": 0,
          "seasons": 0,
          "backgrounds": 0,
          "titlecards": 0,
          "collections": 0,
          "errors": 0,
          "status": "completed"
        }
      ],
      "count": 50,
      "total": 327,
      "limit": 50,
      "offset": 0,
      "mode_filter": null
    }
    ```

### `/api/runtime-history?limit=10`
Returns a limited history of previous script executions.

??? example "View Response"
    ```json
    {
      "success": true,
      "history": [
        {
          "id": 327,
          "timestamp": "2025-11-25T16:30:03",
          "mode": "scheduled",
          "runtime_seconds": 254,
          "runtime_formatted": "0h 4m 14s",
          "total_images": 0,
          "status": "completed"
        }
      ],
      "count": 10,
      "total": 327,
      "limit": 10
    }
    ```

---

## 🔧 Configuration

### `/api/config`
Returns the full configuration.

!!! warning "Security Note"
    Sensitive keys (API Tokens, Passwords, Webhooks) have been redacted in the example below.

??? example "View Response"
    ```json
    {
      "success": true,
      "config": {
        "tvdbapi": "<REDACTED>",
        "tmdbtoken": "<REDACTED>",
        "FanartTvAPIKey": "<REDACTED>",
        "PlexToken": "<REDACTED>",
        "JellyfinAPIKey": "<REDACTED>",
        "EmbyAPIKey": "<REDACTED>",
        "FavProvider": "tmdb",
        "PreferredLanguageOrder": [
          "xx",
          "en",
          "de"
        ],
        "PlexUrl": "http://plex:32400",
        "UsePlex": "true",
        "JellyfinUrl": "http://jellyfin:8096",
        "UseJellyfin": "false",
        "EmbyUrl": "http://192.168.1.93:8096/emby",
        "UseEmby": "false",
        "SendNotification": "true",
        "AppriseUrl": "<REDACTED>",
        "UptimeKumaUrl": "<REDACTED>",
        "AssetPath": "/assets",
        "logLevel": "2",
        "basicAuthEnabled": "false",
        "basicAuthUsername": "admin",
        "basicAuthPassword": "<REDACTED>"
      },
      "ui_groups": {
        "WebUI Settings": [
          "basicAuthEnabled",
          "basicAuthUsername",
          "basicAuthPassword"
        ]
      },
      "display_names": {
        "tvdbapi": "TVDB API Key",
        "tmdbtoken": "TMDB API Token"
      },
      "tooltips": {},
      "using_flat_structure": true
    }
    ```

---

## 📁 Assets & File Management

### `/api/assets/overview`
Returns a categorized overview of assets (missing, non-primary language, etc.).

??? example "View Response"
    ```json
    {
      "categories": {
        "missing_assets": {
          "count": 0,
          "assets": []
        },
        "non_primary_lang": {
          "count": 13,
          "assets": [
            {
              "id": 54766,
              "Title": "Jurassic World: Die Chaostheorie | Season 2",
              "Type": "Season",
              "Rootfolder": "Jurassic World - Chaos Theory (2024) [tvdb-440997]",
              "LibraryName": "Kids Shows",
              "Language": "en",
              "has_poster": true
            }
          ]
        },
        "resolved": {
          "count": 34,
          "assets": [
            {
              "id": 53663,
              "Title": "S01E01 | WILLKOMMEN IN PARADISE",
              "Type": "Episode",
              "LibraryName": "TV Shows",
              "Language": "Textless",
              "has_poster": true
            }
          ]
        }
      },
      "config": {
        "primary_language": "xx",
        "primary_provider": "tmdb"
      }
    }
    ```

### `/api/assets/stats`
Returns storage usage and file counts per library folder.

??? example "View Response"
    ```json
    {
      "success": true,
      "stats": {
        "posters": 2313,
        "backgrounds": 0,
        "seasons": 2179,
        "titlecards": 34425,
        "total_size": 83481927747,
        "folders": [
          {
            "name": "Anime Shows",
            "path": "Anime Shows",
            "poster_count": 355,
            "files": 16519,
            "size": 31830640233
          },
          {
            "name": "TV Shows",
            "path": "TV Shows",
            "poster_count": 382,
            "files": 13795,
            "size": 32606586825
          }
        ]
      }
    }
    ```

### `/api/assets-folders`
Returns a specific list of asset folders and their counts.

??? example "View Response"
    ```json
    {
      "folders": [
        {
          "name": "4K Movies",
          "path": "4K Movies",
          "files": 66,
          "size": 152763048
        },
        {
          "name": "TV Shows",
          "path": "TV Shows",
          "files": 13795,
          "size": 32606586825
        }
      ]
    }
    ```

### `/api/manual-assets-gallery`
Returns a structure for the manual asset selector UI.

??? example "View Response"
    ```json
    {
      "libraries": [
        {
          "name": "4K TV Shows",
          "folders": [
            {
              "name": "Dexter - Original Sin (2024) [tvdb-430780]",
              "path": "4K TV Shows/Dexter - Original Sin (2024) [tvdb-430780]",
              "assets": [
                {
                  "name": "poster.jpg",
                  "path": "4K TV Shows/Dexter - Original Sin (2024) [tvdb-430780]/poster.jpg",
                  "type": "poster",
                  "url": "/manual_poster_assets/4K%20TV%20Shows/Dexter%20-%20Original%20Sin%20%282024%29%20%5Btvdb-430780%5D/poster.jpg"
                }
              ],
              "asset_count": 1
            }
          ],
          "folder_count": 3
        }
      ],
      "total_assets": 226
    }
    ```

### `/api/overlayfiles`
Lists available overlay image files and fonts.

??? example "View Response"
    ```json
    {
      "success": true,
      "files": [
        {
          "name": "Colus-Regular.ttf",
          "type": "font",
          "extension": ".ttf",
          "size": 87484
        },
        {
          "name": "overlay-innerglow.png",
          "type": "image",
          "extension": ".png",
          "size": 42936
        }
      ]
    }
    ```

### `/api/folder-view/browse`
Browses the root folder structure of assets.

??? example "View Response"
    ```json
    {
      "success": true,
      "path": "",
      "items": [
        {
          "type": "folder",
          "name": "4K Movies",
          "path": "4K Movies",
          "item_count": 66
        },
        {
          "type": "folder",
          "name": "TV Shows",
          "path": "TV Shows",
          "item_count": 383
        }
      ]
    }
    ```

---

## 🎬 Plex Export

### `/api/plex-export/statistics`
Statistics regarding the Plex library export CSVs.

??? example "View Response"
    ```json
    {
      "success": true,
      "statistics": {
        "total_runs": 8,
        "total_library_records": 2315,
        "total_episode_records": 2145,
        "latest_run": "2025-11-25T16:31:22.63845"
      }
    }
    ```

### `/api/plex-export/runs`
List of timestamps for previous Plex export runs.

??? example "View Response"
    ```json
    {
      "success": true,
      "runs": [
        "2025-11-25T16:31:22.63845",
        "2025-11-22T01:31:13.933402"
      ],
      "count": 8
    }
    ```

---

## 🎞️ Other Media Export

### `/api/other-media-export/statistics`
Statistics regarding non-Plex media exports.

??? example "View Response"
    ```json
    {
      "success": true,
      "statistics": {
        "total_runs": 0,
        "total_library_records": 0,
        "total_episode_records": 0,
        "latest_run": null
      }
    }
    ```

### `/api/other-media-export/runs`
List of timestamps for previous non-Plex export runs.

??? example "View Response"
    ```json
    {
      "success": true,
      "runs": [],
      "count": 0
    }
    ```

---

## 🖥️ Dashboard & Logs

### `/api/dashboard/all`
A combined endpoint used to populate the main dashboard (Status + Version + System Info).

??? example "View Response"
    ```json
    {
      "success": true,
      "status": {
        "running": false,
        "manual_running": false,
        "scheduler_running": false,
        "active_log": "Scriptlog.log"
      },
      "version": {
        "local": "2.1.15",
        "remote": "2.1.15",
        "is_update_available": false
      },
      "scheduler_status": {
        "enabled": true,
        "next_run": "2025-11-25T19:30:00+01:00"
      },
      "system_info": {
        "platform": "Linux",
        "cpu_cores": 8,
        "memory_percent": 15.0,
        "is_docker": true
      }
    }
    ```

### `/api/logs`
Lists available log files on the server.

??? example "View Response"
    ```json
    {
      "logs": [
        {
          "name": "BackendServer.log",
          "size": 2354179,
          "directory": "UILogs"
        },
        {
          "name": "Scriptlog.log",
          "size": 27563,
          "directory": "Logs"
        }
      ]
    }
    ```

## 🔔 Webhooks

### `/api/webhook/arr`
Endpoint for Sonarr and Radarr `On Import` and `On Upgrade` webhooks. Converts the Arr JSON payload into a trigger file.

??? example "View Response"
    ```json
    {
      "success": true,
      "message": "Trigger queued for Radarr",
      "file": "/config/watcher/recently_added_20251125120000_a1b2c3.posterizarr"
    }
    ```

### `/api/webhook/tautulli`
Endpoint for Tautulli notifications. Maps incoming JSON keys directly to script arguments.

??? example "View Response"
    ```json
    {
      "success": true,
      "message": "Tautulli trigger queued",
      "file": "/config/watcher/tautulli_trigger_20251125120000_x9y8z7.posterizarr"
    }
    ```