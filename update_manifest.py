import json
import os
import sys
import hashlib

def get_sha256(file_path):
    """Calculates the SHA256 checksum of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def update_manifest():
    manifest_path = "manifest.json"
    # Pointing to the ZIP file created in the GitHub Action
    zip_path = "modules/Posterizarr.Plugin/bin/Release/net8.0/Posterizarr.Plugin.zip"
    
    event_name = os.getenv("GITHUB_EVENT_NAME")
    ref_name = os.getenv("GITHUB_REF_NAME")
    repo = os.getenv("GITHUB_REPOSITORY")
    
    if not os.path.exists(zip_path):
        print(f"Error: ZIP file not found at {zip_path}")
        sys.exit(1)

    # Checksum MUST be of the ZIP file Jellyfin downloads
    checksum = get_sha256(zip_path)
    
    # Load existing manifest or initialize a new one
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
    else:
        manifest = [{
            "guid": "f62d8560-6123-4567-89ab-cdef12345678",
            "name": "Posterizarr",
            "description": "Middleware for asset lookup. Maps local assets to library items.",
            "owner": "Posterizarr",
            "category": "Metadata",
            "versions": []
        }]

    plugin = manifest[0]
    
    if event_name == "release":
        # Production version from Tag (e.g., v1.0.0.0)
        version_str = ref_name.lstrip('vV')
        source_url = f"https://github.com/{repo}/releases/download/{ref_name}/Posterizarr.Plugin.zip"
        changelog = f"Official Release {ref_name}"
    else:
        # Development version - MUST BE PURELY NUMERIC to avoid FormatException
        version_str = "0.0.0.1" 
        # Points to the ZIP file on the 'builds' branch
        source_url = f"https://raw.githubusercontent.com/{repo}/builds/Posterizarr.Plugin.zip"
        changelog = "Development build from latest dev branch push."

    new_version = {
        "version": version_str,
        "changelog": changelog,
        "targetAbi": "10.9.0.0", #
        "sourceUrl": source_url,
        "checksum": checksum
    }

    # Replace old version entry of the same version string to keep it clean
    plugin["versions"] = [v for v in plugin["versions"] if v["version"] != version_str]
    plugin["versions"].insert(0, new_version)

    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=4)
    
    print(f"Successfully updated manifest.json with version {version_str} and checksum {checksum}")

if __name__ == "__main__":
    update_manifest()