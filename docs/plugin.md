# Posterizarr Plugin for Jellyfin & Emby

**Middleware for asset lookup. Maps local assets to library items as posters, backgrounds, or titlecards.**

## Overview

The Posterizarr Plugin acts as a local asset proxy for Jellyfin and Emby. It is designed to work alongside the [Posterizarr](https://github.com/fscorrupt/posterizarr) automation script, allowing your media server to utilize locally generated or managed assets (posters, backgrounds, title cards) as metadata.

## Features

*   **Local Asset Mapping:** Maps local files to library items without replacing original metadata permanently in some configurations.
*   **Metadata Provider:** Registers as a metadata provider for images.
*   **Support for Multiple Asset Types:** Handles Posters, Backgrounds (Fanart), and Title Cards.

## Installation

!!! important 
    Only use this if you are not syncing from Plex, as it will overwrite your synced items with locally created assets from Posterizarr.

### Via Repository (Recommended)

1.  Open your Jellyfin or Emby **Dashboard**.
2.  Navigate to **Plugins** -> **Repositories**.
3.  Click **Add** and enter the following information:
    *   **Repository Name:** Posterizarr
    *   **Repository URL:** `https://raw.githubusercontent.com/fscorrupt/posterizarr/main/manifest.json`
4.  Navigate to the **Catalog** tab.
5.  Find **Posterizarr** under the **Metadata** category.
6.  Click **Install** and choose the latest version.
7.  **Restart** your server.

## Configuration

1. After restarting, go to **Plugins** → **Installed Plugins** and click **Posterizarr**.
1. Click on **"Settings"**
1. Configure your Asset Root Path (the directory where your curated images are stored).
1. Safe it
1. Go to your **Dashboard** -> **Libraries**.
1. Manage a library (e.g., Movies).
1. Enable **Posterizarr** under the **Image Fetchers** settings.
1. Ensure it is prioritized according to your preferences.
1. Refresh metadata (Search for missing metadata → **Replace existing images**) for your library to pick up local assets.
