# EXAMVAULT — Team Member Assignments

**Based on repository analysis and 4-member team structure implied by project scope**

---

## MEMBER 1 — Foundation & Problem Statement

**Slides to Present:** 1–3 (Title, Problem Statement, Existing vs Proposed)

### What They Must Understand
- The core problem: exam paper leakage and weak security in existing systems
- The four-role architecture (Teacher, COE, Superintendent, Student)
- Why traditional file-storage approaches fail for this use case
- The shift from centralized to encrypted+distributed architecture

### 5 Questions They May Be Asked
1. What inspired this project?
2. Why is question paper security important?
3. What are the main weaknesses of current examination systems?
4. How many roles does your system have and what does each do?
5. What is the difference between your system and a simple LMS?

### Exact Concepts to Memorize
- Four roles: Teacher, COE, Superintendent, Student (+ Evaluator)
- Three attack vectors addressed: leakage, unauthorized access, mutable audit
- Django + React + MySQL tech stack
- 116 backend tests passing

### Demo Responsibility
- Show the login page and explain authentication flow
- Show the register page and demonstrate student self-registration
- Navigate to the Teacher dashboard

---

## MEMBER 2 — Architecture & Security

**Slides to Present:** 4–8 (Objectives, Architecture, Tech Stack, Auth+RBAC, Paper Lifecycle)

### What They Must Understand
- The complete data flow from request creation to student download
- How JWT authentication works (access + refresh tokens)
- The encryption pipeline (Fernet → RSA wrapping → AES-GCM key derivation)
- Server-side vs client-side security enforcement
- CORS configuration and security headers

### 5 Questions They May Be Asked
1. Explain the encryption pipeline step by step.
2. How do you prevent a student from downloading papers before the exam?
3. What is the difference between your RBAC and a simple role field?
4. How does the JWT refresh mechanism work?
5. What security headers do you send and why?

### Exact Concepts to Memorize
- Fernet = AES-128-CBC with HMAC-SHA256 authentication
- RSA-OAEP with 2048-bit keys for key wrapping
- AES-GCM for master key derivation (HKDF-SHA256)
- `request.user.role != "coe"` pattern used on every COE endpoint
- Rate limit: 5 requests per minute on auth endpoints
- Access window: `access_start` / `access_end` enforced server-side

### Demo Responsibility
- Demonstrate that registering as "coe" is rejected (400 error)
- Show the Teacher creating a request and viewing it
- Show the COE dashboard receiving the request

---

## MEMBER 3 — Blockchain, IPFS & Encryption

**Slides to Present:** 9–10 (Blockchain+IPFS+Encryption, Anonymous Selection+Time Lock)

### What They Must Understand
- How the Solidity contract records CIDs and lifecycle events
- What IPFS is and how content addressing works
- The relationship between blockchain CID and IPFS content ID
- How anonymous candidate selection works (CAND-0001 style IDs)
- Time-window enforcement mechanics

### 5 Questions They May Be Asked
1. What is the Solidity contract doing exactly?
2. How does IPFS differ from regular cloud storage?
3. What happens if the blockchain goes down?
4. How is anonymity preserved in candidate selection?
5. Can a student bypass the time lock by changing their system clock?

### Exact Concepts to Memorize
- `ExamPapers.sol`: maps s_code → Paper{cid, uploader, timestamp}
- Events: `PaperRecorded`, `PaperEventRecorded` (indexed for efficient querying)
- IPFS uses content-addressing: same content = same CID always
- Blockchain is append-only: events can't be deleted or modified
- Time lock is server-enforced: client clock is irrelevant
- Candidate IDs are generated server-side (sequential, non-sequential to real identity)

### Demo Responsibility
- Explain the Solidity contract (show the code briefly)
- Describe the encryption flow with a visual diagram
- Show the blockchain event being recorded (or explain how it would work with Ganache)
- Demonstrate time-window enforcement (try downloading outside window)

**Note for Member 3:** Be prepared to honestly explain that blockchain/IPFS services require separate startup commands. Say: "The code is complete and tested — in our test environment, starting `ganache-cli` and `ipfs daemon` activates these features immediately."

---

## MEMBER 4 — NLP, Results & Future Scope

**Slides to Present:** 11–16 (NLP Scrutiny, Workflow, Security Features, Results, Limitations+Future, Conclusion)

### What They Must Understand
- How TF-IDF and cosine similarity detect paper similarity
- Bloom's Taxonomy classification methodology
- The five analysis dimensions: question extraction, Bloom level, difficulty, duplicates, plagiarism
- Test results and security verification outcomes
- Honest assessment of limitations and future improvements

### 5 Questions They May Be Asked
1. How does TF-IDF help detect plagiarism?
2. What is Bloom's Taxonomy and how do you classify questions?
3. What percentage of papers would your system flag as having issues?
4. Why didn't you use a deep learning model for NLP?
5. What would be your top 3 priorities if you continued this project?

### Exact Concepts to Memorize
- TF-IDF = Term Frequency × Inverse Document Frequency
- Cosine similarity ranges from 0 (completely different) to 1 (identical)
- Threshold for "similar" = 0.7; threshold for "duplicate" = 0.8
- Bloom's levels: remember, understand, apply, analyze, evaluate, create
- 116 tests pass; 0 P0 blockers; 2 P1 (informational leaks, not security)
- P2 items: missing pagination, placeholder SECRET_KEY, mfs_path leak

### Demo Responsibility
- Show the NLP scrutiny output (run a sample paper upload and show results)
- Display the audit log dashboard
- Show the scrutiny summary dashboard
- Walk through limitations honestly and discuss future scope

---

## Suggested Team Size & Flow

| Order | Member | Duration | Content |
|-------|--------|----------|---------|
| 1 | Member 1 | 2 min | Problem + intro |
| 2 | Member 2 | 3 min | Architecture + security |
| 3 | Member 3 | 3 min | Blockchain + encryption |
| 4 | Member 4 | 4 min | NLP + results + future |
| 5 | All | 3 min | Live demo (rotating roles) |
| 6 | All | 5 min | Q&A |

**Total: ~20 minutes**

---

## Live Demo Sequence (All Members Participate)

1. **Member 1** logs in as `student_user` → shows empty dashboard → registers a new student account
2. **Member 2** logs in as `teacher_admin` → creates a request → shows it in pending list
3. **Member 3** logs in as `coe_user` → views request → selects candidate → finalizes with time window
4. **Member 4** logs in as `super_user` → shows audit log → displays scrutiny summary
5. **Member 1** (back as student) → downloads paper within window → shows it works
6. **Member 2** → tries to access COE endpoint directly → shows 403

---

## Quick Reference Card (Laminate for Each Member)

### Member 1 Cheat Sheet
- Problem: Paper leaks, weak RBAC, no audit trail
- Solution: 4-role system with encryption + blockchain + NLP
- Stack: React + Django + MySQL
- Key stat: 116 tests passing

### Member 2 Cheat Sheet
- Auth: JWT with refresh tokens, rate-limited
- RBAC: Server-side role checks on every endpoint
- Encryption: Fernet → RSA wrapper → AES-GCM master key
- Security headers: X-Frame-Options, X-Content-Type-Options, etc.

### Member 3 Cheat Sheet
- Blockchain: Solidity contract, Ganache local testnet
- IPFS: go-ipfs node, content-addressed storage
- Anonymity: CAND-0001 style IDs, not real names
- Time lock: Server-enforced, client-clock independent

### Member 4 Cheat Sheet
- NLP: TF-IDF + cosine similarity + Bloom's taxonomy
- Algorithms: NLTK tokenization, sklearn vectorization
- Outputs: plagiarism score, difficulty level, quality score
- Limitations: blockchain/IPFS need service startup, no pagination
