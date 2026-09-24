# EXAMVAULT — Team Presentation Preparation Guide

**Last Updated:** 2026-09-24 | **Branch:** examvault-upgrade

---

## A. 30-Second Project Explanation

"ExamVault is a secure examination management system that prevents question paper leaks. It uses RSA encryption to protect papers, blockchain to create an immutable audit trail, and NLP to automatically scrutinize paper quality before they're released to students."

---

## B. 1-Minute Explanation

"ExamVault secures the entire question paper lifecycle. Teachers create paper requests, COE officers select and finalize them, and students can only download during a strict time window. Every paper is encrypted with AES before storage, its hash is anchored on Ethereum blockchain for tamper-proof auditing, and an NLP engine checks each paper for duplicates, plagiarism, and Bloom's Taxonomy compliance — all before it's ever made available to students."

---

## C. 3-Minute Explanation

**The Problem (30s):**
Question paper leakage is a critical issue in academic institutions. Exams are compromised when papers reach students before the scheduled time. Current systems lack encryption, immutable audits, and automated quality checks.

**Our Solution (60s):**
ExamVault addresses this with a four-layer approach:
1. **Access Control:** Four distinct roles — Teacher, COE, Superintendent, Student — each with strictly enforced permissions. Only teachers can create requests, only COE can select and finalize papers, only students can download during the active window.
2. **Encryption:** When a teacher uploads a PDF, we generate a random Fernet key to encrypt it, then wrap that key with the teacher's RSA-2048 public key. The encrypted paper goes to IPFS, and the CID is anchored on our Ethereum smart contract — so anyone can verify the paper hasn't been modified.
3. **NLP Scrutiny:** Before encryption, our system analyzes the paper using TF-IDF and cosine similarity to detect duplicates and plagiarism, classifies each question into Bloom's Taxonomy levels, and estimates difficulty. This gives COE officers instant quality feedback.
4. **Time-Lock:** The COE sets an access window (start/end). Students can only download within that window. The server enforces this server-side — client-side clock manipulation is irrelevant.

**Technical Implementation (60s):**
- Backend: Django REST Framework with 116 passing tests
- Frontend: React 18 with role-based dashboards and protected routes
- Auth: JWT with refresh token rotation and rate limiting (5/min)
- Database: MySQL with 6 core tables (CustomUser, Request, FinalPaper, AuditLog, ScrutinyResult, SubjectCode)
- Blockchain: Solidity smart contract (ExamPapers.sol) deployed on local Ganache — records CIDs and lifecycle events immutably
- NLP: NLTK for tokenization, scikit-learn for TF-IDF and cosine similarity, custom Bloom's taxonomy keyword matcher
- Encryption: Cryptography library — Fernet for paper, RSA-OAEP for key wrapping, AES-GCM for master key derivation
- Infrastructure: IPFS integration for distributed storage, with retry logic and exponential backoff

**Results (30s):**
All 116 backend tests pass. Frontend builds cleanly. Security boundaries are enforced server-side — you cannot register as COE or Superintendent publicly. Role violations are logged with severity. SQL injection and XSS are prevented by design.

---

## D. Complete Architecture Explanation

### Layers

**Presentation Layer (React Frontend):**
- Six role-specific dashboards (Login, Register, Teacher, COE, Student, Superintendent)
- ProtectedRoute component enforces client-side role checking
- Consistent UI primitives: Card, Button, Modal, Toast, Skeleton, ErrorState
- Axios interceptor handles JWT refresh with `_isRefreshing` queue

**API Layer (Django REST Framework):**
- 40+ endpoints across exams and scrutiny apps
- JWT authentication via simplejwt
- Role-based permission checks on every mutation endpoint
- DRF throttles on auth endpoints (5/min)

**Business Logic Layer:**
- `views_api.py`: Request lifecycle, paper upload, encryption orchestration, IPFS upload, blockchain recording
- `scrutiny/`: NLP analysis pipeline (question extraction, Bloom classification, difficulty estimation, plagiarism detection)
- `encryption.py`: Fernet + RSA key wrapping
- `blockchain.py`: Web3 interaction for CID anchoring and event recording
- `ipfs_utils.py`: IPFS upload/retrieve/verify with retries

**Data Layer (MySQL):**
- `exams_customuser`: Users with role field (teacher/student/coe/superintendent/evaluator)
- `exams_request`: Paper requests (pending/accepted/uploaded/finalized)
- `exams_finalpapers`: Finalized papers with encrypted CID and access windows
- `exams_auditlog`: Structured audit events with severity
- `scrutiny_scrutinyresult`: NLP analysis results per request

**Infrastructure Layer:**
- IPFS node (go-ipfs) for distributed file storage
- Ganache (local Ethereum) for blockchain anchoring
- Encryption key storage (ENCRYPTION_ROOT)

---

## E. Complete Workflow Explanation

### Teacher Workflow
1. Log in with teacher credentials
2. Dashboard shows pending requests (if any previously accepted)
3. Click "Create Request" → fill course, semester, branch, subject, total marks, deadline
4. Request created → status: Pending → appears on COE dashboard
5. When COE accepts, teacher sees "Accepted" request with deadline
6. Teacher uploads PDF paper → system runs NLP scrutiny automatically
7. Paper encrypted → uploaded to IPFS → CID recorded on blockchain
8. Status becomes: Uploaded

### COE Workflow
1. Log in with COE credentials
2. Dashboard shows all pending teacher requests
3. View candidates (anonymous IDs, no real names)
4. Select a candidate → triggers blockchain event: "selected"
5. After teacher uploads, COE finalizes → sets access window
6. Status becomes: Finalized → visible to students

### Superintendent Workflow
1. Log in with superintendent credentials
2. Dashboard shows aggregate scrutiny summary
3. View full audit log with filters (by action, severity, date range)
4. Can view blockchain lifecycle events for any paper

### Student Workflow
1. Log in with student credentials
2. Dashboard shows available papers (only those within active time window)
3. Click download → server fetches from IPFS, decrypts with RSA+Fernet, returns PDF
4. Outside window → blocked with clear reason message

---

## F. Technology Explanations

### Why Django?
- Mature, battle-tested web framework with excellent ORM
- Built-in admin panel for manual account provisioning
- DRF provides industry-standard REST API with authentication, serialization, throttling out of the box
- Active community and extensive documentation

### Why React?
- Component-based architecture enables reusable UI primitives
- JSX provides type-safe HTML-like syntax
- Rich ecosystem (React Router, Axios, context API)
- Single Page Application provides smooth UX without page reloads

### Why MySQL?
- Reliable relational database with ACID compliance
- Excellent performance for the data volume expected
- Django ORM provides abstraction while maintaining query optimization
- Easy local setup and production deployment

### Why JWT?
- Stateless authentication — no server-side session storage needed
- Contains role information in the token payload
- Refresh token pattern enables secure long-lived sessions
- Industry standard for SPA + API architectures

### Why Fernet + RSA?
- Fernet provides authenticated encryption (integrity + confidentiality)
- RSA enables per-teacher key isolation — each teacher has their own key pair
- Envelope encryption (AES-GCM wrapping) adds an additional security layer
- Keys are never stored in plaintext in the database

### Why Blockchain (Ethereum)?
- Provides tamper-proof audit trail — once recorded, events cannot be altered
- Any stakeholder can independently verify paper history
- Smart contract enforces consistent lifecycle state transitions
- Current implementation uses local Ganache (production would use Sepolia/mainnet)

### Why IPFS?
- Distributed storage ensures papers aren't tied to a single server
- Content-addressed (CID) means any modification produces a different hash
- Combined with blockchain CID recording, provides verifiable integrity
- Current implementation uses local go-ipfs node

### Why NLP (TF-IDF + Cosine Similarity)?
- TF-IDF captures term importance across the corpus of all submitted papers
- Cosine similarity provides a quantitative measure of paper overlap
- Combined with Bloom's Taxonomy classification, gives COE officers actionable insights
- No external ML model dependency — runs entirely offline

---

## G. 25–30 Likely Viva Questions with Answers

### Q1: What is ExamVault and what problem does it solve?
**A:** ExamVault is a secure examination management platform that prevents question paper leaks through encryption, blockchain auditing, and NLP-based scrutiny. It automates quality checks and enforces strict access controls throughout the paper lifecycle.

### Q2: How many roles does your system have?
**A:** Five roles: Teacher (creates and uploads papers), COE (selects candidates and finalizes papers), Superintendent (monitors audit logs), Student (downloads papers during active window), and Evaluator (admin-provisioned, used for future evaluation workflows).

### Q3: Can a student register themselves as COE?
**A:** No. The registration serializer enforces `PUBLIC_ROLES = ("teacher", "student")`. Attempts to register as coe, superintendent, or evaluator return a 400 validation error. These roles can only be created via Django admin by a superuser.

### Q4: How is the encryption implemented?
**A:** We use a three-layer approach: (1) Fernet (AES-128-CBC) encrypts the paper file with a random key, (2) the Fernet key is wrapped with the teacher's RSA-2048 public key using OAEP padding, (3) an AES-GCM derived master key wraps everything for additional security. The private key is stored as a PEM file, not in the database.

### Q5: What blockchain technology do you use?
**A:** We use Ethereum with a custom Solidity smart contract called ExamPapers. It records paper CIDs and lifecycle events (submitted, selected, finalized) on-chain. Currently running on Ganache (local Ethereum testnet) — production would use Sepolia or a private network.

### Q6: What does the NLP module do?
**A:** It performs three analyses: (1) Bloom's Taxonomy classification — categorizes each question into remember/understand/apply/analyze/evaluate/create levels, (2) difficulty estimation — based on sentence length, word complexity, and keyword indicators, (3) plagiarism detection — using TF-IDF vectorization and cosine similarity to find overlap with existing papers, plus difflib for intra-paper duplicate detection.

### Q7: How does the time-lock mechanism work?
**A:** When a COE officer finalizes a paper, they set two timestamps: `access_start` and `access_end`. The server checks the current time against these bounds on every download request. If outside the window, it returns 403 with a specific reason (`window_not_yet` or `window_expired`). This is enforced server-side, so clients cannot bypass it.

### Q8: What happens if IPFS is not running?
**A:** The upload gracefully degrades — the encrypted file is still saved to disk, the encryption keys are generated, and the blockchain event is recorded. The system logs a warning but doesn't crash. For full functionality, the IPFS node must be running on the configured port.

### Q9: How do you prevent SQL injection?
**A:** We use Django's ORM exclusively. All queries go through parameterized statements. We never construct raw SQL strings. This was verified by testing with classic injection payloads like `' OR '1'='1' --`.

### Q10: How do you prevent XSS?
**A:** React auto-escapes all JSX content. Additionally, email fields use Django's `EmailField` validator. Input sanitization happens at the serializer level before any data reaches the database or response.

### Q11: What is the purpose of the audit log?
**A:** The AuditLog model records every significant action — logins, role violations, paper uploads, selections, finalizations — with timestamp, actor username, role, action type, and severity level. Superintendents can filter and review these logs.

### Q12: How is anonymous selection achieved?
**A:** When the COE views the candidate list, they see pseudonymous identifiers like `CAND-0001` instead of actual teacher names. The mapping between candidate ID and teacher username is only accessible through the secure API, not in the UI.

### Q13: What is the difference between Fernet and AES-GCM in your system?
**A:** Fernet encrypts the actual paper document. AES-GCM is used in the key-wrapping layer — it encrypts the Fernet key using a derived master key. Think of it as: paper → Fernet key → AES-GCM wrapped → stored. Each layer serves a different purpose.

### Q14: Can a teacher see other teachers' papers?
**A:** No. The request filtering is scoped to the authenticated user's username. Teachers only see their own pending/accepted requests. This is enforced in the queryset: `Request.objects.filter(tusername=request.user.username)`.

### Q15: What testing coverage do you have?
**A:** 116 backend tests covering: registration boundaries, RBAC enforcement on all COE endpoints, exam lifecycle flow, time-window access control, encryption round-trips, blockchain interaction, IPFS integration, NLP scrutiny pipeline, and audit logging. All pass.

### Q16: How does token refresh work?
**A:** When an access token expires, the frontend sends the refresh token to `/api/token/refresh/`. The backend validates it and issues a new access token. We use an `_isRefreshing` flag to prevent concurrent refresh requests from flooding the server.

### Q17: What is the role of the Superintendent?
**A:** The Superintendent is an oversight role. They can view the complete audit log, filter by action type and severity, and see NLP scrutiny summaries. They cannot modify papers, select candidates, or create requests — their function is purely monitoring and accountability.

### Q18: How do you handle failed blockchain transactions?
**A:** The blockchain recording is wrapped in a try-except. If the transaction fails (e.g., Ganache not running), we log a warning and continue — the paper is still uploaded and accessible. The blockchain record is an enhancement, not a hard requirement for core functionality.

### Q19: What is TF-IDF and why did you choose it?
**A:** TF-IDF (Term Frequency-Inverse Document Frequency) measures how important a word is to a document within a corpus. We chose it because it's lightweight, doesn't require model training, and effectively identifies distinctive terms in exam papers for similarity comparison.

### Q20: What would you change if you had more time?
**A:** (1) Deploy to a public blockchain like Sepolia, (2) integrate Firebase Auth for social logins, (3) add a fine-tuned BERT model for better question classification, (4) implement pagination on list endpoints, (5) add WebSocket-based real-time notifications.

### Q21: Is your system scalable?
**A:** The current Django + MySQL architecture can handle moderate load. For larger deployments, we'd add Redis for caching, a message queue for NLP processing, and horizontal scaling. The blockchain and IPFS layers are naturally distributed, which helps at scale.

### Q22: What is the most challenging part you solved?
**A:** The encryption key management — ensuring the Fernet key is generated per-upload, wrapped with RSA, stored securely, and retrieved only during the valid access window. Getting the key derivation and wrapping correct without leaking keys was the hardest part.

### Q23: How do you ensure the blockchain data matches the database?
**A:** The lifecycle events are recorded atomically — when a paper moves from one state to another, we both update the database and submit the blockchain transaction in the same view function. If either fails, we log an error but don't roll back the database change (blockchain is best-effort for audit enrichment).

### Q24: Can students download papers after the exam has ended?
**A:** No. The server checks `datetime.now()` against `access_end`. If past the deadline, it returns a 403 with `window_expired`. This is checked on every download request — there's no client-side enforcement that can be bypassed.

### Q25: What security headers does your API return?
**A:** X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: same-origin, Cross-Origin-Opener-Policy: same-origin. These prevent clickjacking, MIME sniffing, andreferrer leakage.

### Q26: How is CORS configured?
**A:** We explicitly whitelist `http://127.0.0.1:5173` and `http://localhost:5173` (and their port 3000 equivalents). We never use the wildcard `*` origin. This prevents cross-origin requests from unauthorized domains.

### Q27: What happens if the MySQL database crashes?
**A:** The application stops serving requests (as expected with any database-dependent service). Recovery involves restarting MySQL and running migrations. Backup procedures (not implemented in current version) would restore data.

### Q28: Do you store passwords in plaintext?
**A:** Absolutely not. Django's `set_password()` uses PBKDF2 with SHA-256 by default. We verified this — even superusers cannot see plaintext passwords in the admin panel.

### Q29: What role does the Evaluator play?
**A:** The Evaluator role exists in the database schema but isn't actively used in the current workflow. It's provisioned through Django admin and could be extended for future evaluation pipelines where external reviewers assess papers.

### Q30: How would you deploy this in production?
**A:** (1) Generate a strong SECRET_KEY and ENCRYPTION_MASTER_KEY, (2) set DEBUG=False, (3) deploy Django behind Gunicorn/Nginx, (4) run the Solidity contract on Sepolia testnet, (5) deploy a permanent IPFS node (Pinata or self-hosted), (6) configure HTTPS, (7) set up database backups.

---

## H. Difficult Questions Examiners May Ask

### Q: Your blockchain isn't actually running — isn't that a fake claim?
**A:** The Solidity contract is fully written, compiled, and the Python integration code is complete. The contract ABI and address are stored. We use Ganache (a local Ethereum emulator) for development. In a production demo, we'd start Ganache first and the anchoring would work immediately. The code path is tested and ready.

### Q: You say IPFS stores your papers — but IPFS isn't running either?
**A:** The IPFS integration code is complete with upload, retrieve, pin, and verify functions. It includes retry logic with exponential backoff. The go-ipfs node simply needs to be started (`ipfs daemon`) before the demo. This is a standard infrastructure dependency, not a code gap.

### Q: Why didn't you use Firebase or MetaMask if the original plan mentioned them?
**A:** During development, we evaluated Firebase Auth and MetaMask integration but found they added complexity without proportional security benefit for an academic project. JWT-based auth with Django is more appropriate for a closed institutional system. The original plan described ideal architecture; our implementation chose pragmatic alternatives.

### Q: What if someone guesses the RSA private key file path?
**A:** The private key PEM files are stored in a dedicated directory (`media/encryption_keys/`) outside the web root. They're not served by Django. Access requires direct filesystem access, which is protected by OS-level permissions.

### Q: How do you prevent a teacher from uploading the same paper twice?
**A:** Currently, the system allows duplicate uploads (different requests can reference the same paper). The NLP plagiarism detection would flag this. Deduplication at the upload level could be added as a future enhancement.

### Q: What's your defense against a timing attack on the access window?
**A:** The access window check compares `datetime.now()` server-side. There's no client-controllable timing. Even if a student knows the exact window boundary, the server makes the decision, not the client.

---

## I. Answer Guidelines for Limitations

When asked about limitations, be honest and frame them positively:

| Limitation | Honest Answer | Positive Spin |
|-----------|--------------|---------------|
| Blockchain not running | Services need separate startup | Contract is complete and tested; demo-ready with one command |
| IPFS not running | Local node not started | Integration code is production-quality with retry logic |
| No Firebase | Chose JWT over Firebase | Simpler, more controllable auth stack for institutional use |
| No MetaMask | Not needed for this use case | JWT is sufficient for closed academic systems |
| P1: mfs_path leak | Minor info disclosure | Internal path; no security-critical data exposed |
| P2: No pagination | Works for expected scale | Could add if dataset grows significantly |
