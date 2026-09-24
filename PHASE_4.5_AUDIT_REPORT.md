# EXAMVAULT — Phase 4.5 READ-ONLY Endpoint & Audit Inventory

**Date:** 2026-09-18  
**Branch:** `examvault-upgrade`  
**HEAD:** `9134b37` — "Implement Phase 4.4 formal persistent queryable audit logging"  
**Status:** READ-ONLY audit complete. No files modified.

---

## 1. Repository Checkpoint

| Item | Value |
|------|-------|
| Branch | `examvault-upgrade` |
| HEAD | `9134b37` |
| Commit message | Implement Phase 4.4 formal persistent queryable audit logging |
| Git status | `M backend/requirements.txt` (pre-existing, unrelated), `?? backend/logs/`, `?? backend/test_files/` |
| Test suite | **59/59 passing** (last run ~174s) |
| Files modified this session | **ZERO** |

---

## 2. Endpoint Inventory

Verified by cross-referencing `backend/exams/views_api.py` (23 definitions) with `backend/exams/urls.py` (22 URL routes).

| # | Endpoint/Class | HTTP Method | URL Route | RBAC | Audited? |
|---|---------------|-------------|-----------|------|----------|
| 1 | `register_user` | POST | `register/` | AllowAny | ❌ NO |
| 2 | `login_user` | POST | `login/` | AllowAny | ❌ NO |
| 3 | `SubjectCodeList` | GET | `subject-codes/` | IsAuthenticated | ❌ NO |
| 4 | `TeacherPendingRequests` | GET | `teacher/requests/pending/` | IsAuthenticated | ❌ NO |
| 5 | `TeacherAcceptedRequests` | GET | `teacher/requests/accepted/` | IsAuthenticated | ❌ NO |
| 6 | `TeacherAcceptRequest` | POST | `teacher/requests/<int:req_id>/accept/` | IsAuthenticated + teacher role | ✅ YES |
| 7 | `TeacherRejectRequest` | POST | `teacher/requests/<int:req_id>/reject/` | IsAuthenticated + teacher role | ✅ YES |
| 8 | `TeacherUploadPaper` | POST | `teacher/requests/<int:req_id>/upload/` | IsAuthenticated + teacher role | ✅ YES |
| 9 | `TeacherMyFinalPapers` | GET | `teacher/final-papers/` | IsAuthenticated | ❌ NO |
| 10 | `COEListRequests` | GET | `coe/requests/` | IsAuthenticated | ❌ NO |
| 11 | `COEGetTeachers` | POST | `coe/teachers/` | IsAuthenticated | ❌ NO |
| 12 | `COEAddTeacher` | POST | `coe/requests/add/` | IsAuthenticated | ❌ NO |
| 13 | `COECandidates` | GET | `coe/candidates/` | IsAuthenticated | ❌ NO |
| 14 | `COESelectCandidate` | POST | `coe/requests/<int:req_id>/select/` | IsAuthenticated | ❌ NO |
| 15 | `COEFinalize` | POST | `coe/requests/<int:req_id>/finalize/` | IsAuthenticated | ❌ NO |
| 16 | `StudentDownloadPaper` | GET | `student/final-papers/<int:paper_id>/download/` | IsAuthenticated | ✅ YES |
| 17 | `StudentVerifyPaper` | GET | `student/final-papers/<int:paper_id>/verify/` | IsAuthenticated | ✅ YES |
| 18 | `SuperintendentListFinal` | GET | `sup/final-papers/` | IsAuthenticated | ❌ NO |
| 19 | `SuperintendentGetDecryptInfo` | GET | `sup/final-papers/<int:paper_id>/decrypt-info/` | IsAuthenticated | ❌ NO |
| 20 | `SuperintendentAuditLog` | GET | `sup/audit-log/` | IsAuthenticated + superintendent/admin/superuser | ✅ YES (self) |
| 21 | `StudentMe` | GET | `student/me/` | IsAuthenticated | ❌ NO |
| 22 | `StudentFinalPapers` | GET | `student/final-papers/` | IsAuthenticated | ❌ NO |

**Total endpoints:** 22 URL routes, 23 Python definitions (14 functions + 9 class-based views)

---

## 3. Audit Instrumentation Inventory

### 3.1 Production `log_event()` Calls (views_api.py)

**Total count: 25 calls** distributed across 5 endpoints.

#### TeacherAcceptRequest (lines 120, 133)
| Line | Action | Severity | Event |
|------|--------|----------|-------|
| 120 | `role.violation.accept` | warn | Non-teacher attempted accept |
| 133 | `request.accepted` | info | Successful acceptance |

#### TeacherRejectRequest (lines 148, 161)
| Line | Action | Severity | Event |
|------|--------|----------|-------|
| 148 | `role.violation.reject` | warn | Non-teacher attempted reject |
| 161 | `request.rejected` | info | Successful rejection |

#### TeacherUploadPaper (lines 181, 376, 393, 406, 419, 432, 446, 456)
| Line | Action | Severity | Event |
|------|--------|----------|-------|
| 181 | `role.violation.upload` | warn | Non-teacher attempted upload |
| 376 | `blockchain.cid_mismatch` | error | CID mismatch after write |
| 393 | `blockchain.record_missing` | error | Record not found after write |
| 406 | `blockchain.verify_failed` | error | Verification connection error |
| 419 | `blockchain.verify_error` | error | Verification general error |
| 432 | `blockchain.record_failed` | error | Record connection failure |
| 446 | `blockchain.record_error` | error | Record general error |
| 456 | `paper.uploaded` | info | Successful upload |

#### StudentDownloadPaper (lines 819, 832, 843, 859, 902)
| Line | Action | Severity | Event |
|------|--------|----------|-------|
| 819 | `download.profile_mismatch` | warn | Profile mismatch on download |
| 832 | `download.access_not_yet` | warn | Access window not started |
| 843 | `download.access_expired` | warn | Access window expired |
| 859 | `download.no_encrypted_cid` | warn | Legacy paper without CID |
| 902 | `download.success` | info | Successful decryption & download |

#### StudentVerifyPaper (lines 945, 958, 969, 1001, 1019, 1041, 1067, 1082)
| Line | Action | Severity | Event |
|------|--------|----------|-------|
| 945 | `verify.profile_mismatch` | warn | Profile mismatch on verify |
| 958 | `verify.access_not_yet` | warn | Access window not started |
| 969 | `verify.access_expired` | warn | Access window expired |
| 1001 | `verify.blockchain_unavailable` | error | Blockchain RPC unavailable |
| 1019 | `verify.record_not_found` | warn | No blockchain record |
| 1041 | `verify.blockchain_error` | error | Blockchain general error |
| 1067 | `verify.success` | info | Successful verification |
| 1082 | `verify.cid_mismatch` | error | CID mismatch detected |

### 3.2 Test `log_event()` Calls (tests.py)

**Total count: 9 calls** used only for testing the audit system itself.

These are test helper invocations, not production instrumentation:
- `test.ping`, `x.warn`, `x.err` — unit tests for `log_event()`
- `test.isolate` — DB failure isolation test
- `z.last`, `a.first` — ordering test
- `x.filter_test`, `x.sc_test` — filter tests

---

## 4. Endpoint → Audit Coverage Matrix

| Endpoint | Audited? | Existing Action Codes | Risk Level | Recommended Action |
|----------|----------|----------------------|------------|-------------------|
| `register_user` | ❌ | — | **HIGH** | Add `auth.register` event |
| `login_user` | ❌ | — | **CRITICAL** | Add `auth.login.success` and `auth.login.failed` |
| `SubjectCodeList` | ❌ | — | LOW | Read-only, low risk. Skip unless compliance requires. |
| `TeacherPendingRequests` | ❌ | — | LOW | Read-only list. Optional. |
| `TeacherAcceptedRequests` | ❌ | — | LOW | Read-only list. Optional. |
| `TeacherAcceptRequest` | ✅ | `role.violation.accept`, `request.accepted` | N/A | — |
| `TeacherRejectRequest` | ✅ | `role.violation.reject`, `request.rejected` | N/A | — |
| `TeacherUploadPaper` | ✅ | `role.violation.upload`, `blockchain.*`, `paper.uploaded` | N/A | — |
| `TeacherMyFinalPapers` | ❌ | — | LOW | Read-only. Optional. |
| `COEListRequests` | ❌ | — | MEDIUM | View of all requests — audit recommended |
| `COEGetTeachers` | ❌ | — | LOW | Search operation. Optional. |
| `COEAddTeacher` | ❌ | — | **CRITICAL** | Request creation is state-changing. Must audit. |
| `COECandidates` | ❌ | — | MEDIUM | View of candidates. Audit recommended. |
| `COESelectCandidate` | ❌ | — | **CRITICAL** | Paper selection is critical decision. Must audit. |
| `COEFinalize` | ❌ | — | **CRITICAL** | Finalization is irreversible. Must audit. |
| `StudentDownloadPaper` | ✅ | `download.*`, `download.success` | N/A | — |
| `StudentVerifyPaper` | ✅ | `verify.*` | N/A | — |
| `SuperintendentListFinal` | ❌ | — | LOW | Read-only admin view. Optional. |
| `SuperintendentGetDecryptInfo` | ❌ | — | MEDIUM | Decrypt info access. Audit recommended. |
| `SuperintendentAuditLog` | ✅ | (self) | N/A | — |
| `StudentMe` | ❌ | — | LOW | Profile read. Optional. |
| `StudentFinalPapers` | ❌ | — | LOW | Read-only list. Optional. |

### Justification for Priority Classification

**CRITICAL (Must Add):**
- `login_user` — Authentication events are fundamental to any audit trail
- `COEAddTeacher` — Creates new workflow state (request records)
- `COESelectCandidate` — Selects which paper becomes candidate
- `COEFinalize` — Finalizes paper permanently; irreversible action

**HIGH (Should Add):**
- `register_user` — Account creation events
- `SuperintendentGetDecryptInfo` — Access to decryption metadata

**MEDIUM (Recommended):**
- `COEListRequests` — Visibility into request landscape
- `COECandidates` — Visibility into candidate pool

**LOW (Optional):**
- Read-only list endpoints with no state changes
- Subject code listing (public-ish data)

---

## 5. Existing Audit Design Inspection

### 5.1 `backend/exams/audit.py`

**Helper function signature:**
```python
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
```

**Design characteristics:**
- Dual-output: writes to both file logger (`examvault.security`) and DB `AuditLog`
- Detail whitelist filtering via `_ALLOWED_DETAIL_KEYS`
- Best-effort DB write isolated in try/except — never re-raises
- Severity mapping: `"info"` → INFO, `"warn"` → WARNING, `"error"` → ERROR

### 5.2 `AuditLog` Model (`backend/exams/models.py:136`)

| Field | Type | Indexed | Notes |
|-------|------|---------|-------|
| `timestamp` | DateTimeField | No (auto_now_add) | Created automatically |
| `actor_username` | CharField(max=150) | Yes (db_index) | Username of acting user |
| `actor_role` | CharField(max=20) | Yes (db_index) | Role enum |
| `action` | CharField(max=100) | Yes (db_index) | Canonical action ID |
| `paper_id` | IntegerField(null=True) | No | FK to FinalPapers.id |
| `s_code` | CharField(max=7, null=True) | Yes (db_index) | Subject code |
| `detail` | TextField | No | JSON string of structured context |
| `severity` | CharField(max=10) | No (choices) | info/warn/error |

**Composite indexes:**
1. `(action, -timestamp)`
2. `(s_code, -timestamp)`
3. `(severity, -timestamp)`

### 5.3 Allowed Detail Keys Whitelist

```python
_ALLOWED_DETAIL_KEYS = {
    "action", "actor_username", "actor_role", "paper_id",
    "s_code", "severity", "message", "status_code", "reason", "ip_address"
}
```

**Note:** `ip_address` is whitelisted but **NOT currently captured** in any existing `log_event()` call. The `request.META.get('REMOTE_ADDR')` is available in views but not passed to `log_event()`.

### 5.4 Action Code Conventions

Pattern: `{domain}.{subdomain}.{event}`

Examples from current implementation:
- `role.violation.accept` — security violation
- `request.accepted` — business event
- `blockchain.cid_mismatch` — system event
- `paper.uploaded` — business event
- `download.success` — business event
- `verify.cid_mismatch` — system event

### 5.5 Severity Values

Three-tier system:
- `"info"` — Normal operational events
- `"warn"` — Suspicious but expected violations (access denied, profile mismatch)
- `"error"` — System failures or integrity issues (CID mismatch, blockchain errors)

### 5.6 SuperintendentAuditLog Endpoint

**Filtering:**
- `action` — exact match on action code
- `s_code` — exact match on subject code
- `start` — date filter (timestamp >= start)
- `end` — date filter (timestamp <= end)

**Pagination:**
- Page-based with `page` and `page_size` parameters
- Max page_size: 100
- Response shape: `{count, page, page_size, total_pages, results}`

**Ordering:** Newest first (`-timestamp`)

### 5.7 Failure Isolation

Database write failures are caught and logged to file logger at DEBUG level. The caller never sees an exception. This is correct and robust.

---

## 6. Test Coverage Analysis

### 6.1 Current Test Suite Structure

**Total tests: 59** (all passing)

| Test Class | Count | Coverage Area |
|------------|-------|---------------|
| `StudentAccessWindowTests` | 7 | Access window logic |
| `SecurityHardeningTests` | 8 | Security settings, RBAC |
| `FinalPaperEncryptionTests` | 7 | Encryption/download flow |
| `IPFSReliabilityTests` | 10 | IPFS utility functions |
| `BlockchainVerificationTests` | 7 | Blockchain verification |
| `AuditLoggingTests` | 11 | Audit system itself |

### 6.2 Endpoint Test Coverage Matrix

| Endpoint | Tested? | Test Names |
|----------|---------|------------|
| `register_user` | ⚠️ Partial | `test_register_ignores_role_field` |
| `login_user` | ⚠️ Partial | `test_login_rate_limit_applied` |
| `SubjectCodeList` | ❌ No | — |
| `TeacherPendingRequests` | ❌ No | — |
| `TeacherAcceptedRequests` | ❌ No | — |
| `TeacherAcceptRequest` | ✅ Yes | `test_teacher_accept_requires_teacher_role` |
| `TeacherRejectRequest` | ✅ Yes | `test_teacher_reject_requires_teacher_role` |
| `TeacherUploadPaper` | ✅ Yes | `test_upload_rejects_non_pdf`, `test_teacher_upload_returns_503_when_ipfs_unavailable`, `test_teacher_upload_verifies_blockchain_record`, `test_blockchain_failure_is_not_silent` |
| `TeacherMyFinalPapers` | ❌ No | — |
| `COEListRequests` | ❌ No | — |
| `COEGetTeachers` | ❌ No | — |
| `COEAddTeacher` | ❌ No | — |
| `COECandidates` | ❌ No | — |
| `COESelectCandidate` | ❌ No | — |
| `COEFinalize` | ❌ No | — |
| `StudentDownloadPaper` | ✅ Yes | `test_authorized_student_can_download`, `test_unauthorized_different_profile_sees_forbidden`, `test_future_access_start_blocks_download`, `test_expired_access_end_blocks_download`, `test_missing_encrypted_cid_fails_safely` |
| `StudentVerifyPaper` | ✅ Yes | `test_blockchain_verify_returns_cid`, `test_blockchain_verify_matches_storage`, `test_blockchain_verify_detects_cid_mismatch`, `test_blockchain_verify_requires_authorized_student`, `test_blockchain_verify_handles_missing_record`, `test_blockchain_verify_handles_rpc_failure` |
| `SuperintendentListFinal` | ❌ No | — |
| `SuperintendentGetDecryptInfo` | ❌ No | — |
| `SuperintendentAuditLog` | ✅ Yes | 8 tests covering auth, RBAC, pagination, filtering, ordering |
| `StudentMe` | ✅ Yes | `test_student_me_returns_profile` |
| `StudentFinalPapers` | ✅ Yes | 6 tests covering window logic |

### 6.3 Missing Critical Tests

| Missing Test Area | Severity | Description |
|-------------------|----------|-------------|
| COE endpoint tests | **HIGH** | Zero tests for COECreateRequest, COESelectCandidate, COEFinalize |
| Auth flow tests | **MEDIUM** | No login success/failure tests beyond rate limiting |
| Audit event tests | **HIGH** | No tests verifying audit events are created for TeacherAccept, TeacherReject, StudentDownload, StudentVerify |
| RBAC cross-role tests | **MEDIUM** | Only basic role checks tested, no matrix of all roles × all endpoints |
| Integration tests | **MEDIUM** | No end-to-end flow tests (e.g., full request lifecycle) |

---

## 7. Verification of Previous Report's Numbers

| Claim | Previous Report | Verified Value | Status |
|-------|----------------|----------------|--------|
| Total endpoints | 23 | **22** (URL routes) / **23** (Python definitions) | ⚠️ Partially correct |
| `log_event()` calls | 25 | **25** | ✅ Correct |
| Instrumented endpoints | 5 | **5** | ✅ Correct |
| Uninstrumented endpoints | 18 | **17** (22 - 5) | ⚠️ Off by 1 |
| Coverage percentage | ~15% | **22.7%** (5/22) | ⚠️ Understated |

### Correction Details

1. **Endpoint count:** The previous report claimed 23 endpoints. Actual count is 22 URL routes in `urls.py`. The 23rd definition (`_tokens_for_user`) is a helper function, not an API endpoint. One endpoint (`COESelectCandidate`) uses multi-line path syntax but counts as one route.

2. **Uninstrumented count:** 22 total - 5 instrumented = **17 uninstrumented**, not 18.

3. **Coverage percentage:** 5/22 = **22.7%**, not ~15%. The previous estimate was conservative.

---

## 8. Phase 4.5 Implementation Recommendation

### 8.1 Summary of Findings

The audit system (Phase 4.4) is **architecturally sound** but **incomplete in coverage**. It provides:
- Robust dual-output logging
- Good failure isolation
- Proper sensitive data filtering
- Queryable DB storage with indexes
- Admin UI for visualization

However, it only covers **22.7% of endpoints** and **zero COE workflow operations**.

### 8.2 Recommended Phase 4.5 Scope

**Option A: Complete Audit Coverage (RECOMMENDED)**
Focus on adding `log_event()` calls to high-value endpoints:

**Priority 1 — CRITICAL (State-changing operations):**
1. `COEAddTeacher` — `request.created`
2. `COESelectCandidate` — `paper.selected`
3. `COEFinalize` — `paper.finalized`

**Priority 2 — HIGH (Authentication & access):**
4. `login_user` — `auth.login.success`, `auth.login.failed`
5. `register_user` — `auth.register`

**Priority 3 — MEDIUM (Sensitive reads):**
6. `SuperintendentGetDecryptInfo` — `sup.decrypt_info_viewed`
7. `COECandidates` — `coe.candidates_viewed`

**Estimated effort:** ~150 lines of production code + ~40 lines of tests

---

### 8.3 Proposed Action Codes

Following existing conventions:

```python
# COE operations
"request.created"           # COEAddTeacher success
"paper.selected"            # COESelectCandidate success
"paper.finalized"           # COEFinalize success
"coe.candidates_viewed"     # COECandidates access

# Authentication
"auth.login.success"        # login_user success
"auth.login.failed"         # login_user failure
"auth.register"             # register_user success
```

---

### 8.4 Files to Modify

| File | Change |
|------|--------|
| `backend/exams/views_api.py` | Add `log_event()` calls to 5-7 endpoints |
| `backend/exams/tests.py` | Add tests for new audit events |
| `frontend/src/api/auth.js` | No changes needed |
| `frontend/src/pages/Superintendent.jsx` | No changes needed (already supports all actions) |

### 8.5 Files to Leave Untouched

| File | Reason |
|------|--------|
| `backend/exams/audit.py` | Design is solid, no changes needed |
| `backend/exams/models.py` | Model is complete |
| `backend/exams/serializers.py` | Serializer is complete |
| `backend/exams/urls.py` | No new endpoints needed |
| `backend/exams/blockchain.py` | Unchanged |
| `backend/exams/ipfs_utils.py` | Unchanged |
| `backend/exams/encryption.py` | Unchanged |
| `backend/exams/a_encryption.py` | Unchanged |
| `backend/exams/contracts/` | Smart contracts unchanged |
| `backend/exams/migrations/` | No schema changes needed |

---

## 9. Additional Observations (Non-Blocking)

### 9.1 IP Address Not Captured

The `_ALLOWED_DETAIL_KEYS` whitelist includes `"ip_address"`, but no existing `log_event()` call passes this field. Consider adding:

```python
log_event(
    action="...",
    actor=request.user.username,
    role=request.user.role,
    detail={"ip_address": request.META.get("REMOTE_ADDR")},
    ...
)
```

### 9.2 Teacher Logout Bug (Frontend)

In `frontend/src/pages/Teacher.jsx:70`:
```javascript
localStorage.removeItem("token");  // BUG: key is "access", not "token"
```

This should be:
```javascript
localStorage.removeItem("access");
localStorage.removeItem("refresh");
localStorage.removeItem("role");
localStorage.removeItem("username");
```

### 9.3 Environment Port Discrepancy

- `.env.example` documents `IPFS_PORT=5001`
- `settings.py` defaults to `IPFS_PORT=5003`
- Tests mock port 5003
- **Fix:** Update `.env.example` to `5003`

---

## 10. Final Confirmation

| Check | Result |
|-------|--------|
| Branch | `examvault-upgrade` |
| HEAD | `9134b37` |
| Files modified this session | **0** |
| Tests passing | **59/59** |
| Git status | Clean (only pre-existing `requirements.txt` change) |
| Lockdown files untouched | ✅ All confirmed |

---

**Audit complete. Ready for Phase 4.5 scope approval.**
