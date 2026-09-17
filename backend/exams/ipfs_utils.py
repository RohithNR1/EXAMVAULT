import logging
import time

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def get_ipfs_api_url():
    """Get IPFS API URL dynamically."""
    return f"http://{settings.IPFS_HOST}:{settings.IPFS_PORT}/api/v0"


def _ipfs_request(method, endpoint, *, timeout=None, max_retries=2, **kwargs):
    """Execute an IPFS HTTP API call with configurable timeout and retries.

    On repeated failure, the last exception is re-raised so callers can
    surface a 503 rather than crashing unexpectedly.
    """
    if timeout is None:
        timeout = int(getattr(settings, "IPFS_TIMEOUT_SECONDS", 30))

    backoff = 1
    last_exc = None
    url = f"{get_ipfs_api_url()}/{endpoint}"

    for attempt in range(max_retries + 1):
        try:
            res = requests.request(method, url, timeout=timeout, **kwargs)
            res.raise_for_status()
            if method.upper() == "GET":
                return res.content
            if "json" in res.headers.get("Content-Type", ""):
                return res.json()
            return res.text
        except requests.exceptions.Timeout as exc:
            logger.warning(
                "IPFS %s %s timed out (attempt %d/%d, timeout=%ss)",
                endpoint, url, attempt + 1, max_retries + 1, timeout,
            )
            last_exc = exc
        except requests.exceptions.ConnectionError as exc:
            logger.warning(
                "IPFS %s connection error (attempt %d/%d): %s",
                endpoint, attempt + 1, max_retries + 1, exc,
            )
            last_exc = exc
        except requests.exceptions.HTTPError as exc:
            # Transient 5xx — retry; 4xx are not retryable.
            if exc.response.status_code >= 500 and attempt < max_retries:
                logger.warning(
                    "IPFS %s returned %d (attempt %d/%d)",
                    endpoint, exc.response.status_code, attempt + 1, max_retries + 1,
                )
                last_exc = exc
            else:
                raise
        else:
            # No exception — success path
            if "json" in res.headers.get("Content-Type", ""):
                return res.json()
            return res.content if method.upper() == "GET" else res.text

        # Exponential back-off between retries (only when we still have retries left).
        if attempt < max_retries:
            time.sleep(backoff)
            backoff *= 2

    raise last_exc  # type: ignore[misc]


def add_file(path, mfs_path=None):
    """
    Upload a file to IPFS via HTTP API.
    Pins the object locally by default.
    Returns the JSON response containing 'Name' and 'Hash'.
    Raises on failure.
    """
    api_url = get_ipfs_api_url()

    # Step 1: Add file to IPFS (pin=true ensures the local node holds the object)
    with open(path, "rb") as f:
        files = {"file": f}
        res = requests.post(f"{api_url}/add?pin=true", files=files)
    res.raise_for_status()
    data = res.json()
    cid = data["Hash"]

    # Step 2: Copy file to MFS for WebUI display (best-effort; non-fatal)
    if mfs_path:
        folder = __import__("os").path.dirname(mfs_path)
        try:
            requests.post(f"{api_url}/files/mkdir?arg={folder}&parents=true")
            requests.post(f"{api_url}/files/rm?arg={mfs_path}&force=true")
            requests.post(f"{api_url}/files/cp?arg=/ipfs/{cid}&arg={mfs_path}")
        except requests.exceptions.RequestException as exc:
            logger.warning("IPFS MFS copy failed for %s: %s", mfs_path, exc)

    return data


def get_file(cid):
    """
    Retrieve raw file bytes from IPFS via HTTP API.
    Uses the shared timeout/retry helper.
    """
    return _ipfs_request("POST", f"cat?arg={cid}")


def pin(cid):
    """Pin a CID on the local IPFS node (guarantees local retention).

    Best-effort: logs warnings but does not raise, since pinned state
    is usually guaranteed by the add call's ?pin=true flag.
    """
    try:
        _ipfs_request("POST", f"pin/add?arg={cid}")
        logger.info("IPFS pinned cid=%s", cid)
    except Exception as exc:
        logger.warning("IPFS pin failed for cid=%s: %s", cid, exc)


def is_pinned(cid):
    """Check whether a CID is currently pinned on the local IPFS node.

    Returns True/False; False on any error (safer than crashing a check).
    """
    try:
        result = _ipfs_request("POST", f"pin/ls?type=tree&arg={cid}")
        # ipfs pin ls returns either a dict {"Keys": {cid: ...}} or a list.
        if isinstance(result, dict):
            return cid in result.get("Keys", {})
        return bool(result)
    except Exception as exc:
        logger.warning("IPFS is_pinned check failed for cid=%s: %s", cid, exc)
        return False


def verify_cid(cid, expected_size=None):
    """Round-trip verify a CID: fetch it back and optionally check size.

    Returns True on success, False on failure (does not raise).
    Useful after upload to confirm the object is retrievable before
    storing the CID in the database.
    """
    try:
        data = _ipfs_request("POST", f"cat?arg={cid}")
        if expected_size is not None and len(data) != expected_size:
            logger.warning(
                "CID round-trip size mismatch: cid=%s expected=%s actual=%s",
                cid, expected_size, len(data),
            )
            return False
        return True
    except Exception as exc:
        logger.warning("IPFS CID verification failed for cid=%s: %s", cid, exc)
        return False


def check_ipfs_available():
    """Return True if the configured IPFS node is reachable, else False."""
    try:
        _ipfs_request("GET", "version")
        return True
    except Exception as exc:
        logger.warning("IPFS node unreachable (%s): %s", get_ipfs_api_url(), exc)
        return False
