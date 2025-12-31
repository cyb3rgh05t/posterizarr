import json
import os
import sys
import hashlib

def get_sha256(file_path):
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def update_manifest():
    manifest_path = "manifest.json"
    dll_path = "modules/Posterizarr.Plugin/bin/Release/net8.0/Posterizarr.Plugin.dll"
    
    event_name = os.getenv("GITHUB_EVENT_NAME")
    ref_name = os.getenv("GITHUB_REF_NAME")
    repo = os.getenv("GITHUB_REPOSITORY")
    
    if not os.path.exists(dll_path):
        print(f"Error: DLL not found at {dll_path}")
        sys.exit(1)

    checksum = get_sha256(dll_path)
    
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
    else:
        manifest = [{
            "guid": "f62d8560-6123-4567-89ab-cdef12345678",
            "name": "Posterizarr",
            "description": "Middleware for asset lookup.",
            "owner": "Posterizarr",
            "category": "Metadata",
            "versions": []
        }]

    plugin = manifest[0]
    
    if event_name == "release":
        # Production version from Tag
        version_str = ref_name.lstrip('vV')
        source_url = f"https://github.com/{repo}/releases/download/{ref_name}/Posterizarr.Plugin.dll"
        changelog = f"Official Release {ref_name}"
    else:
        # Development version
        version_str = "0.0.0.1-dev" 
        # Points to the raw DLL file on the dev branch
        source_url = f"https://raw.githubusercontent.com/{repo}/builds/Posterizarr.Plugin.dll"
        changelog = "Development build from latest dev branch push."

    new_version = {
        "version": version_str,
        "changelog": changelog,
        "targetAbi": "10.9.0.0",
        "sourceUrl": source_url,
        "checksum": checksum
    }

    # Filter out old version of the same type (Dev replaces Dev, Release replaces same Release)
    plugin["versions"] = [v for v in plugin["versions"] if v["version"] != version_str]
    plugin["versions"].insert(0, new_version)

    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

if __name__ == "__main__":
    update_manifest()