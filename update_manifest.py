import json
import os
import sys
import hashlib
from datetime import datetime

def get_md5(file_path):
    """Calculates MD5 checksum in uppercase."""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest().upper()

def update_manifest():
    manifest_path = "manifest.json"
    plugin_name = "Posterizarr.Plugin"
    
    # These variables are passed from the GitHub Action workflow
    event_name = os.getenv("GITHUB_EVENT_NAME")
    repo = os.getenv("GITHUB_REPOSITORY")
    version_str = os.getenv("VERSION")
    
    zip_name = f"{plugin_name}_v{version_str}.zip"
    zip_path = os.path.join("release_package", zip_name)
    
    if not os.path.exists(zip_path):
        print(f"Error: ZIP not found at {zip_path}")
        sys.exit(1)

    checksum = get_md5(zip_path)
    
    # Load existing manifest or create a new structure if it doesn't exist
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
    else:
        manifest = [{
            "name": "Posterizarr",
            "guid": "f62d8560-6123-4567-89ab-cdef12345678",
            "description": "Middleware for asset lookup. Maps local assets to library items as posters, backgrounds, or titlecards.",
            "overview": "A custom plugin for Posterizarr that acts as a local asset proxy for Jellyfin and Emby.",
            "owner": "Posterizarr",
            "category": "Metadata",
            "versions": []
        }]

    plugin = manifest[0]

    if event_name == "release":
        # Production builds: Point to the official GitHub Release ZIP
        source_url = f"https://github.com/{repo}/releases/download/{version_str}/{zip_name}"
        changelog = f"Official Release {version_str}"
        
        # CLEANUP: Remove ALL dev versions (starting with 99.0) from the manifest
        # This keeps the production manifest clean of development clutter.
        plugin["versions"] = [v for v in plugin["versions"] if not v["version"].startswith("99.0.")]
    else:
        # Dev builds: Point to the 'builds' branch raw content
        source_url = f"https://raw.githubusercontent.com/{repo}/builds/{zip_name}"
        changelog = f"Dev build: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        # If this is a Dev build, remove ONLY the previous 99.0 builds 
        # so the dev list doesn't grow indefinitely.
        if version_str.startswith("99.0."):
            plugin["versions"] = [v for v in plugin["versions"] if not v["version"].startswith("99.0.")]

    new_version = {
        "version": version_str,
        "changelog": changelog,
        "targetAbi": "10.9.0.0",
        "sourceUrl": source_url,
        "checksum": checksum
    }
    
    # Insert the newest version at the beginning of the list
    plugin["versions"].insert(0, new_version)

    # Save the updated manifest back to disk
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    
    print(f"Successfully updated manifest with version {version_str}")

if __name__ == "__main__":
    update_manifest()
