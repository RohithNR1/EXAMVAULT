"""
Centralized audit-logging helper for EXAMVAULT.

Writes every auditable event to:
  1. The existing ``examvault.security`` RotatingFileHandler (preserves operational
     debugging behaviour).
  2. The persistent ``AuditLog`` database record (new Phase 4.4 queryable trail).

Database persistence is best-effort and isolated — a failure to write an
AuditLog row must never propagate to the caller or alter the business response.

Never persist secrets (passwords, tokens, private keys, encryption material,
raw or decrypted paper contents, RPC credentials).
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

from django.db import IntegrityError, OperationalError

from .models import AUDIT_SEVERITY, AuditLog

logger = logging.getLogger(__name__)

# Map our canonical severity names onto Python logging levels.
_SEVERITY_LEVEL = {
    "info": logging.INFO,
    "warn": logging.WARNING,
    "error": logging.ERROR,
}

# Fields that are safe to include in the JSON `detail` payload.
# Everything else is considered sensitive and must not be passed through.
_ALLOWED_DETAIL_KEYS = {
    "action",
    "actor_username",
    "actor_role",
    "paper_id",
    "s_code",
    "severity",
    "message",
    "status_code",
    "reason",
    "ip_address",
}


def log_event(
    *,
    action: str,
    actor: str,
    role: str,
    detail: Optional[Dict[str, Any]] = None,
    severity: str = "info",
    paper_id: Optional[int] = None,
    s_code: Optional[str] = None,
) -> None:
    """
    Record an auditable event to both the file logger and the DB audit trail.

    Parameters
    ----------
    action : str
        Canonical action identifier, e.g. ``"blockchain.verify.success"``.
    actor : str
        Username of the acting user.
    role : str
        Role of the acting user (e.g. ``"student"``, ``"teacher"``).
    detail : dict, optional
        Additional structured context. Sensitive keys are silently dropped.
    severity : str
        One of ``"info"``, ``"warn"``, ``"error"``.
    paper_id : int, optional
        FinalPapers primary key when applicable.
    s_code : str, optional
        Subject code when applicable.
    """
    if severity not in _SEVERITY_LEVEL:
        severity = "info"

    # Build a clean JSON-serializable detail payload.
    safe_detail: Dict[str, Any] = {
        "action": action,
        "actor_username": actor,
        "actor_role": role,
        "severity": severity,
        "paper_id": paper_id,
        "s_code": s_code,
    }
    if detail:
        for key, value in detail.items():
            if key in _ALLOWED_DETAIL_KEYS:
                safe_detail[key] = value

    # Round-trip through JSON to catch non-serializable values early; fall back
    # to a plain string on failure so the audit helper never raises.
    detail_text: str
    try:
        detail_text = json.dumps(safe_detail, default=str)
    except Exception:
        detail_text = str(safe_detail)

    # Forward to the existing file-based security logger at the matching level.
    sec_logger = logging.getLogger("examvault.security")
    log_level = _SEVERITY_LEVEL[severity]
    message = f"[{action}] actor={actor} role={role} severity={severity}"
    if s_code:
        message += f" s_code={s_code}"
    if paper_id is not None:
        message += f" paper_id={paper_id}"
    if log_level == logging.ERROR:
        sec_logger.error(message)
    elif log_level == logging.WARNING:
        sec_logger.warning(message)
    else:
        sec_logger.info(message)

    # Persist to the database. Isolated from the caller — never re-raise.
    try:
        AuditLog.objects.create(
            timestamp=None,  # auto_now_add handles it; pass None for explicitness
            actor_username=actor,
            actor_role=role,
            action=action,
            paper_id=paper_id,
            s_code=s_code,
            detail=detail_text,
            severity=severity,
        )
    except (IntegrityError, OperationalError, Exception) as exc:
        # Log the persistence failure to the same file logger at debug level so
        # operators can detect a backed-up audit table without surfacing it to
        # the application caller.
        sec_logger.debug(
            "AuditLog persistence failed for action=%s: %s", action, exc
        )
