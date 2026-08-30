import requests
from django.conf import settings
import os

def get_ipfs_api_url():
    """Get IPFS API URL dynamically"""
    return f"http://{settings.IPFS_HOST}:{settings.IPFS_PORT}/api/v0"

def add_file(path, mfs_path=None):
    """
    Upload a file to IPFS via HTTP API.
    If mfs_path is provided, copy file into MFS so it appears in WebUI.
    Returns the JSON response containing 'Name' and 'Hash'.
    """
    # Step 1: Add file to IPFS (pin to local node)
    api_url = get_ipfs_api_url()
    with open(path, 'rb') as f:
        files = {'file': f}
        res = requests.post(f"{api_url}/add?pin=true", files=files)
    res.raise_for_status()
    data = res.json()
    cid = data['Hash']

    # Step 2: Copy file to MFS for WebUI display
    if mfs_path:
        folder = os.path.dirname(mfs_path)
        # create folder if not exists
        requests.post(f"{api_url}/files/mkdir?arg={folder}&parents=true")
        # remove existing file if any
        requests.post(f"{api_url}/files/rm?arg={mfs_path}&force=true")
        # copy IPFS object to MFS
        requests.post(f"{api_url}/files/cp?arg=/ipfs/{cid}&arg={mfs_path}")

    return data

def get_file(cid):
    """
    Retrieve raw file bytes from IPFS via HTTP API.
    """
    api_url = get_ipfs_api_url()
    res = requests.post(f"{api_url}/cat?arg={cid}")
    res.raise_for_status()
    return res.content
