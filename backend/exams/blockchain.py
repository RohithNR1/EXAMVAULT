import json, os
from web3 import Web3
from django.conf import settings

ABI_PATH = os.path.join(os.path.dirname(__file__), "contract_abi.json")
ADDR_PATH = os.path.join(os.path.dirname(__file__), "contract_address.txt")


class BlockchainError(Exception):
    """Raised when a blockchain operation fails."""
    pass


class BlockchainConnectionError(BlockchainError):
    """Raised when RPC connection is unavailable."""
    pass


class BlockchainRecordNotFoundError(BlockchainError):
    """Raised when no record exists for the given s_code."""
    pass


# Allowed lifecycle actions — kept explicit so invalid values are rejected
# client-side before any transaction is submitted.
_ALLOWED_LIFECYCLE_ACTIONS = frozenset({"submitted", "selected", "finalized"})


def _web3():
    return Web3(Web3.HTTPProvider(settings.RPC_URL))


def _account(w3: Web3):
    return w3.eth.account.from_key(settings.PRIVATE_KEY)


def load_contract():
    if not os.path.exists(ABI_PATH) or not os.path.exists(ADDR_PATH):
        return None, None, None
    with open(ABI_PATH, "r") as f:
        abi = json.load(f)
    with open(ADDR_PATH, "r") as f:
        address = f.read().strip()
    w3 = _web3()
    contract = w3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)
    account = _account(w3)
    return w3, account, contract


def record_cid(s_code: str, cid: str):
    """
    Record a CID on-chain for the given s_code.

    Returns the transaction hash on success.
    Raises BlockchainError (or subclasses) on failure so callers can
    distinguish a real blockchain failure from successful recording.
    """
    try:
        w3, acct, contract = load_contract()
        if contract is None:
            raise BlockchainError("Contract not loaded — ABI or address file missing")
        nonce = w3.eth.get_transaction_count(acct.address)
        tx = contract.functions.recordPaper(s_code, cid).build_transaction({
            "from": acct.address,
            "nonce": nonce,
            "gas": 1_500_000,
            "gasPrice": w3.to_wei("1", "gwei"),
        })
        signed = w3.eth.account.sign_transaction(tx, private_key=settings.PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt.transactionHash.hex()
    except BlockchainError:
        raise
    except Exception as exc:
        raise BlockchainConnectionError(
            f"Blockchain record failed for s_code={s_code}: {exc}"
        ) from exc


def verify_cid(s_code: str):
    """
    Read the on-chain record for the given s_code.

    Returns a dict:
        {
            "s_code": ...,
            "cid": ...,
            "tx_hash": None,           # not stored on-chain; see note below
            "timestamp": ...,          # block timestamp as int / datetime
        }

    Raises:
        BlockchainConnectionError – RPC/connection failure (caller should
            surface a 503 to the client).
        BlockchainRecordNotFoundError – no record exists for this s_code.
        BlockchainError – other contract/read failure.
    """
    try:
        w3, acct, contract = load_contract()
        if contract is None:
            raise BlockchainError("Contract not loaded — ABI or address file missing")

        cid, uploader, ts = contract.functions.getPaper(s_code).call()

        if not cid or cid == "0x" + "0" * 64:
            # Empty-string sentinel returned by Solidity when no mapping entry exists
            raise BlockchainRecordNotFoundError(
                f"No blockchain record found for s_code={s_code}"
            )

        return {
            "s_code": s_code,
            "cid": cid,
            "tx_hash": None,  # getPaper does not expose tx hash; block.timestamp is available
            "timestamp": int(ts) if ts else None,
        }
    except (BlockchainConnectionError, BlockchainRecordNotFoundError):
        raise
    except Exception as exc:
        raise BlockchainError(
            f"Blockchain verify failed for s_code={s_code}: {exc}"
        ) from exc


def get_lifecycle_events(s_code: str) -> list[dict]:
    """
    Read the full lifecycle event history for the given s_code from-chain.

    Returns a list of dicts ordered chronologically (oldest first):
        [
            {"action": ..., "ref": ..., "actor": ..., "timestamp": ...},
            ...
        ]

    Raises BlockchainConnectionError on RPC failure, BlockchainError on other
    contract read errors, or BlockchainRecordNotFoundError if the contract
    reports zero events for this s_code.
    """
    try:
        w3, acct, contract = load_contract()
        if contract is None:
            raise BlockchainError("Contract not loaded — ABI or address file missing")

        count = contract.functions.getEventCount(s_code).call()
        if count == 0:
            raise BlockchainRecordNotFoundError(
                f"No blockchain lifecycle events found for s_code={s_code}"
            )

        events: list[dict] = []
        for idx in range(int(count)):
            s_code_, action, ref, actor, ts = contract.functions.events(idx).call()
            # Skip events belonging to a different s_code (shouldn't happen but
            # guard against malformed chain state).
            if s_code_ != s_code:
                continue
            events.append({
                "action": action,
                "ref": ref,
                "actor": actor,
                "timestamp": int(ts) if ts else None,
            })
        return events
    except (BlockchainConnectionError, BlockchainRecordNotFoundError):
        raise
    except Exception as exc:
        raise BlockchainError(
            f"Blockchain get_lifecycle_events failed for s_code={s_code}: {exc}"
        ) from exc


def record_event(s_code: str, action: str, ref: str) -> str:
    """
    Record a lifecycle event on-chain for the given s_code.

    Returns the transaction hash on success.
    Raises ValueError if action is not an allowed lifecycle step (checked
    before any transaction is built, so no gas is spent on invalid input).
    Raises BlockchainError (or subclasses) on failure.
    """
    if action not in _ALLOWED_LIFECYCLE_ACTIONS:
        raise ValueError(
            f"Invalid lifecycle action '{action}'. Allowed: {sorted(_ALLOWED_LIFECYCLE_ACTIONS)}"
        )
    try:
        w3, acct, contract = load_contract()
        if contract is None:
            raise BlockchainError("Contract not loaded — ABI or address file missing")
        nonce = w3.eth.get_transaction_count(acct.address)
        tx = contract.functions.recordEvent(s_code, action, ref).build_transaction({
            "from": acct.address,
            "nonce": nonce,
            "gas": 1_500_000,
            "gasPrice": w3.to_wei("1", "gwei"),
        })
        signed = w3.eth.account.sign_transaction(tx, private_key=settings.PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt.transactionHash.hex()
    except ValueError:
        raise
    except BlockchainError:
        raise
    except Exception as exc:
        raise BlockchainConnectionError(
            f"Blockchain record_event failed for s_code={s_code} action={action}: {exc}"
        ) from exc
