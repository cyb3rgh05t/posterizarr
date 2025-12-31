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
    
    event_name = os.getenv("GITHUB_EVENT_NAME")
    ref_name = os.getenv("GITHUB_REF_NAME")
    repo = os.getenv("GITHUB_REPOSITORY")
    version_str = os.getenv("VERSION")
    
    zip_name = f"{plugin_name}_v{version_str}.zip"
    zip_path = os.path.join("release_package", zip_name)
    
    if not os.path.exists(zip_path):
        print(f"Error: ZIP not found at {zip_path}")
        sys.exit(1)

    checksum = get_md5(zip_path)
    
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
    else:
        manifest = [{
            "name": "Posterizarr",
            "guid": "f62d8560-6123-4567-89ab-cdef12345678",
            "description": "Middleware for asset lookup. Maps local assets to library items as posters, backgrounds, or titlecards.",
            "owner": "Posterizarr",
            "category": "Metadata",
            "versions": []
        }]

    plugin = manifest[0]

    if event_name == "release":
        # Production: Points to GitHub Releases
        source_url = f"https://github.com/{repo}/releases/download/v{version_str}/{zip_name}"
        changelog = f"Official Release {version_str}"
    else:
        # Dev: Points to builds branch (naming matches release style)
        source_url = f"https://raw.githubusercontent.com/{repo}/builds/{zip_name}"
        changelog = f"Dev build: {datetime.now().strftime('%Y-%m-%d %H:%M')}"

    new_version = {
        "version": version_str,
        "changelog": changelog,
        "targetAbi": "10.9.0.0",
        "sourceUrl": source_url,
        "checksum": checksum
    }

    # Maintain dev builds as 0.0.* and stable as fixed versions
    if version_str.startswith("0.0."):
        plugin["versions"] = [v for v in plugin["versions"] if not v["version"].startswith("0.0.")]
    
    plugin["versions"].insert(0, new_version)

    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

if __name__ == "__main__":
    update_manifest()