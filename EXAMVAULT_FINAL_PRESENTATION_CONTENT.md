# EXAMVAULT — Final Presentation Content

**Branch:** examvault-upgrade | **Latest Commit:** 754f1c0 | **Date:** 2026-09-24

---

## Slide 1 — Title

**EXAM-VAULT**
Examination Security Vault

*Securing the question paper lifecycle through encryption, blockchain audit, and AI-driven scrutiny*

---

## Slide 2 — Problem Statement

- Question paper leakage before exams
- Unauthorized access to exam materials
- Weak role-based access control (RBAC) in existing systems
- Lack of immutable audit trails for examination operations
- Manual evaluation processes prone to bias
- Early access by students before scheduled release

---

## Slide 3 — Existing System vs Proposed System

| Aspect | Existing System | ExamVault Proposed |
|--------|----------------|---------------------|
| Paper Storage | Centralized file server | Encrypted + distributed (IPFS-ready) |
| Access Control | Password-only login | Multi-role JWT auth + RBAC |
| Audit Trail | Manual logs, mutable | Immutable blockchain record |
| Paper Encryption | None or weak | RSA + AES-GCM envelope encryption |
| Evaluation | Manual review | NLP automated scrutiny |
| Timeline Lock | None enforced | Time-window enforcement server-side |

---

## Slide 4 — Objectives

1. Prevent pre-exam paper leaks through end-to-end encryption
2. Enforce strict four-role RBAC (Teacher, COE, Superintendent, Student)
3. Provide an immutable audit trail via blockchain anchoring
4. Automate paper quality scrutiny using NLP (Bloom's Taxonomy, plagiarism detection)
5. Enforce time-lock access windows for exam paper distribution
6. Ensure zero-knowledge paper retrieval (only authorized users decrypt during window)

---

## Slide 5 — Proposed Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend                  │
│  (Login / Register / Teacher / COE /         │
│   Student / Superintendent Dashboards)        │
└──────────────────┬──────────────────────────┘
                   │ JWT (Access + Refresh)
┌──────────────────▼──────────────────────────┐
│           Django REST Framework API          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  exams   │ │ scrutiny │ │  audit   │    │
│  │  (views) │ │  (NLP)   │ │  (logs)  │    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘    │
│       │            │            │            │
│  ┌────▼────────────▼────────────▼────┐      │
│  │       Encryption + IPFS +         │      │
│  │       Blockchain Layer            │      │
│  └────────────────────────────────────┘      │
└─────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          MySQL Database                      │
│  (Users, Requests, FinalPapers, AuditLogs,  │
│   ScrutinyResults)                          │
└─────────────────────────────────────────────┘
```

---

## Slide 6 — Technology Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | React 18 (CRA) + Tailwind CSS | ✅ Implemented |
| Backend | Django 4.x + DRF | ✅ Implemented |
| Database | MySQL | ✅ Implemented |
| Auth | Django REST Framework SimpleJWT | ✅ Implemented |
| Encryption | Fernet (AES-128-CBC) + RSA-2048 OAEP | ✅ Implemented |
| Key Wrapping | AES-GCM envelope encryption | ✅ Implemented |
| NLP | NLTK + scikit-learn (TF-IDF, Cosine Similarity) | ✅ Implemented |
| Blockchain | Ethereum Solidity (ExamPapers.sol) | ⚠️ Contract written; Ganache not running |
| Distributed Storage | IPFS (go-ipfs) | ⚠️ Code ready; node not running |
| Plagiarism Detection | difflib SequenceMatcher + TF-IDF/Cosine | ✅ Implemented |
| Bloom's Taxonomy | Keyword classification (NLTK) | ✅ Implemented |

---

## Slide 7 — Authentication + RBAC

**Authentication:**
- JWT (access + refresh tokens) via djangorestframework-simplejwt
- Rate limiting: 5 requests/min on auth endpoints
- Token refresh with atomic `_isRefreshing` queue (prevents race conditions)

**Four Protected Roles:**
| Role | Self-Register | Can Create Requests | Can Select Papers | Can View Audit Logs |
|------|--------------|--------------------|-------------------|--------------------|
| Teacher | ✅ | ✅ (own requests) | ❌ | ❌ |
| Student | ✅ | ❌ | ❌ | ❌ |
| COE | ❌ (admin-only) | ✅ | ✅ | ❌ |
| Superintendent | ❌ (admin-only) | ❌ | ❌ | ✅ |
| Evaluator | ❌ (admin-only) | ❌ | ❌ | ❌ |

**Security enforced server-side** — frontend role display is UI-only; backend rejects unauthorized actions with 403.

---

## Slide 8 — Secure Question Paper Lifecycle

```
1. Teacher creates request (status: Pending)
         │
2. COE accepts → sets deadline (status: Accepted)
         │
3. Teacher uploads PDF
   ├─► NLP scrutiny runs automatically
   ├─► Fernet encrypts paper → encrypted bytes written
   ├─► RSA-2048 wraps Fernet key → saved as private_key.pem
   ├─► Encrypted file uploaded to IPFS → CID obtained
   ├─► CID anchored on Ethereum blockchain
   └─► Status: Uploaded
         │
4. COE finalizes → sets access_start / access_end (status: Finalized)
         │
5. Student downloads during window
   ├─► Server checks time window
   ├─► Fetches encrypted CID from IPFS
   ├─► RSA-decrypts Fernet key from private_key.pem
   └─► Fernet decrypts → returns PDF
         │
6. Outside window → 403 (window_not_yet / window_expired)
```

---

## Slide 9 — Blockchain + IPFS + Encryption

**Encryption Pipeline:**
- Paper encrypted with random Fernet key (AES-128-CBC)
- Fernet key wrapped with RSA-2048 OAEP (teacher-specific public key)
- Wrapped key stored in database; private key as PEM file on disk
- AES-GCM key wrapping layer for master key derivation

**Blockchain (Solidity Smart Contract):**
- `ExamPapers.sol` — records paper CID per subject code
- Lifecycle events: `submitted`, `selected`, `finalized`
- Immutable append-only event log on-chain
- Current status: Contract compiled; Ganache RPC needs to be started for live anchoring

**IPFS:**
- Upload: `POST /api/v0/add?pin=true`
- Retrieve: `GET /api/v0/cat?arg=<cid>`
- Retry logic with exponential backoff (3 attempts)
- Current status: Code ready; go-ipfs node needed on port 5003

---

## Slide 10 — Anonymous Selection + Time Lock

**Anonymous Candidate Selection:**
- COE sees pseudonymous candidate identifiers (e.g., `CAND-0001`)
- Real teacher identity never exposed in candidate list
- Selection is blind — COE picks based on subject expertise, not identity
- Event recorded on blockchain: `recordEvent(s_code, "selected", ref)`

**Time-Lock Enforcement:**
- Server-side `access_start` / `access_end` datetime window
- Student download attempts outside window receive structured 403:
  - `window_not_yet` — paper not yet released
  - `window_expired` — exam period has ended
- Tested at boundaries: exact start/end moments, 1-second before/after

---

## Slide 11 — NLP Scrutiny

**Automated Paper Quality Analysis:**

| Analysis Type | Algorithm | Output |
|--------------|-----------|--------|
| Question Extraction | Regex patterns + sentence tokenization (NLTK) | List of questions |
| Bloom's Taxonomy Classification | Keyword matching (define→remember, analyze→analyze, etc.) | Score distribution across 6 levels |
| Difficulty Estimation | Avg sentence length + avg word length + indicator words | easy/medium/hard with confidence score |
| Duplicate Detection | difflib.SequenceMatcher (threshold: 0.8) | Pairwise duplicate list |
| Cross-Paper Similarity | TF-IDF vectorization + cosine similarity (sklearn) | Similarity scores against existing questions |
| Plagiarism Score | (duplicates + similar) / total_questions | 0.0–1.0 float |
| Overall Quality Score | 1.0 − plagiarism_penalty − duplicate_penalty + bloom_bonus | 0.0–1.0 float |

**Integration:** Runs automatically when teacher uploads a paper. Results stored in `ScrutinyResult` model and displayed in COE dashboard.

---

## Slide 12 — Complete System Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Teacher   │────▶│     COE     │────▶│ Superintendent│
│             │     │             │     │             │
│ • Create req│     │ • View cand │     │ • View audit│
│ • Upload PDF│     │ • Select    │     │ • Filter logs│
│ • Set marks │     │ • Finalize  │     │ • View summary│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────┐
│              ExamVault Core Engine                    │
│  NLP Scrutiny → Encryption → IPFS Upload →           │
│  Blockchain Record → Time Lock → Student Access       │
└──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Student   │
│             │
│ • View papers│
│ • Download    │
│   (in window) │
└─────────────┘
```

---

## Slide 13 — Security Features

| Feature | Implementation | Evidence |
|---------|---------------|----------|
| SQL Injection Prevention | Django ORM parameterization | Manual payload testing passed |
| XSS Prevention | React JSX auto-escape + email validation | Manual payload testing passed |
| CSRF Protection | Django CSRF middleware | Standard DRF session |
| Rate Limiting | AuthRateThrottle (5/min) | Confirmed throttling after 6th attempt |
| RBAC Enforcement | Server-side `request.user.role` checks on every endpoint | 116 tests cover all role boundaries |
| Privileged Role Isolation | `PUBLIC_ROLES = ("teacher", "student")` hardcoded in serializer | coe/superintendent/evaluator self-reg → 400 |
| Token Security | JWT signed with SECRET_KEY; refresh token rotation | Token refresh endpoint functional |
| File Upload Validation | MIME type check (PDF only); extension verification | Non-PDF rejected with 400 |
| Encrypted Storage | Fernet + RSA envelope; keys never in DB plaintext | Private key saved as PEM; wrapped key in DB |
| Audit Logging | Structured events with severity, actor, role | 70+ entries; filters by action/severity work |
| Security Headers | X-Frame-Options: DENY, X-Content-Type-Options: nosniff | Verified via curl |

---

## Slide 14 — Current Implementation / Results

**Backend Tests:** 116/116 passing (269s)
- Registration boundary tests (teacher/student/protected-role rejection)
- COE authorization boundary tests (all 6 endpoints role-checked)
- Exam lifecycle tests (request → accept → upload → finalize → download)
- Time-window enforcement tests (before/during/after)
- Blockchain integration tests (mocked RPC behavior)
- Encryption/decryption round-trip tests
- NLP scrutiny pipeline tests
- Audit logging completeness tests

**Frontend Build:** Clean compile, zero warnings
- 6 role-based dashboards with consistent UI primitives
- ProtectedRoute enforces client-side role gating
- Toast feedback on all user-facing actions
- Loading skeletons and error states throughout

**Demo Accounts:**
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | teacher + superuser |
| coe_user | coe123 | coe |
| super_user | super123 | superintendent |
| student_user | student123 | student |

---

## Slide 15 — Limitations + Future Scope

**Current Limitations:**
- Blockchain anchoring requires starting Ganache locally (not included in setup instructions)
- IPFS requires a running go-ipfs node (port 5003)
- No Firebase authentication integration (JWT-based auth used instead)
- No MetaMask wallet integration
- No Hyperledger Fabric deployment
- SECRET_KEY is a development placeholder
- No pagination on list endpoints (P2)
- mfs_path value exposed in upload response (P1)

**Future Scope:**
- Deploy to production blockchain (Sepolia testnet or private network)
- Integrate Firebase Auth for social login
- Add MetaMask sign-in as second-factor authentication
- Implement fine-tuned BERT classifier for advanced question classification
- Add pagination to all list endpoints
- Enable paper sharing between departments
- Mobile-responsive native app (React Native)
- Real-time notification system (WebSockets)

---

## Slide 16 — Conclusion

ExamVault implements a complete, tested examination security system covering:
- ✅ Multi-role RBAC with server-side enforcement
- ✅ End-to-end encryption (RSA + Fernet + AES-GCM)
- ✅ Blockchain-backed immutable audit trail (contract ready)
- ✅ NLP-driven automatic paper scrutiny
- ✅ Time-lock access enforcement
- ✅ IPFS-distributed storage layer (code ready)
- ✅ Comprehensive audit logging
- ✅ 116 automated backend tests, clean frontend build

**Project Status:** Ready for demonstration and academic evaluation.

**Q&A**
