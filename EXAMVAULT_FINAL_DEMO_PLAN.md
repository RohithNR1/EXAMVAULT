# EXAMVAULT — Final Demo Plan

**Duration:** 12–15 minutes
**Accounts Needed:** student_user/student123, admin/admin123 (teacher+superuser), coe_user/coe123, super_user/super123

---

## Pre-Demo Checklist (5 minutes before start)

- [ ] Django backend running on port 8000 (`python manage.py runserver`)
- [ ] React frontend running on port 5173 (`npm start`)
- [ ] MySQL database accessible
- [ ] Browser open to `http://localhost:5173`
- [ ] DevTools open (Network tab) for showing API responses
- [ ] Terminal ready to show test results if asked

---

## Demo Sequence

### Step 1: Login & Authentication (1 min)
**Actor:** Any team member
**Account:** `student_user` / `student123`

- Navigate to `http://localhost:5173/login`
- Enter credentials
- Show JWT tokens in localStorage (DevTools → Application → Local Storage)
- Explain: "The access token is short-lived; the refresh token lets us get new ones automatically"

**Fallback:** If frontend is slow, show a screenshot of the login page with tokens visible.

---

### Step 2: Student Dashboard — Cannot See Restricted Data (1 min)
**Actor:** Same as Step 1
**Screen:** Student dashboard at `/student`

- Show that the student sees only their available papers
- Open DevTools Network tab
- Navigate to `/api/coe/requests/` manually
- Show the 403 response: `"Only COE users can list requests"`
- Explain: "Server-side RBAC enforcement — the frontend block is just UX; the real security is here"

**Expected Result:** 403 with clear error message.

---

### Step 3: Teacher Creates a Request (1.5 min)
**Actor:** Switch to `admin` / `admin123`
**Screen:** Teacher dashboard at `/teacher`

- Click "Create Request" button
- Fill form: Course, Semester, Branch, Subject, Total Marks, Deadline
- Submit
- Show the request appearing in the "Pending Requests" table
- Explain: "The request is now visible to COE officers for review"

**Expected Result:** Request created with status "Pending". API call: `POST /api/teacher/requests/` returns 201.

---

### Step 4: COE Views and Accepts Request (1.5 min)
**Actor:** Switch to `coe_user` / `coe123`
**Screen:** COE dashboard at `/coe`

- Show the pending request from Step 3
- Click "View Candidates"
- Explain: "Candidates are shown with anonymous IDs (CAND-XXXX), not real names"
- Select a candidate
- Explain: "This triggers a blockchain event: 'selected'"

**Expected Result:** Candidate list with pseudonymous IDs. Blockchain event logged.

---

### Step 5: Teacher Uploads Paper with NLP Scrutiny (2 min)
**Actor:** Back to `admin` / `admin123`
**Screen:** Teacher dashboard

- Find the accepted request
- Click "Upload Paper"
- Select a PDF file (use `backend/test_files/` if available, or any sample PDF)
- **IMPORTANT:** Watch the console/logs — NLP scrutiny runs automatically
- Show the response including scrutiny results:
  - Bloom's distribution
  - Plagiarism score
  - Quality score
  - Recommendations

**Expected Result:** Paper encrypted, uploaded to IPFS (or local fallback), CID recorded, scrutiny results returned.

**Fallback if IPFS not running:** "The paper is still encrypted and stored locally. The CID would be recorded on IPFS when the node is available."

---

### Step 6: COE Finalizes Paper with Time Window (1 min)
**Actor:** Switch to `coe_user` / `coe123`
**Screen:** COE dashboard

- Find the uploaded paper
- Click "Finalize"
- Set access start and end times
- Explain: "Students can only download during this window"
- Show blockchain event: "finalized" recorded

**Expected Result:** Paper status changes to "Finalized". Access window set.

---

### Step 7: Superintendent Views Audit Log (1 min)
**Actor:** Switch to `super_user` / `super123`
**Screen:** Superintendent dashboard at `/superintendent`

- Show the audit log with all actions: login, request created, selected, finalized
- Filter by action type (e.g., show only "upload" events)
- Filter by severity (info vs warn)
- Explain: "Every action is logged with actor, role, and timestamp"

**Expected Result:** Paginated audit log with filter controls working.

---

### Step 8: Student Downloads Paper Within Window (1 min)
**Actor:** Switch to `student_user` / `student123`
**Screen:** Student dashboard

- Show available papers (the one finalized in Step 6)
- Click "Download"
- Show the PDF opening
- Explain: "The server fetches from IPFS, decrypts with RSA+Fernet, and returns the PDF"

**Expected Result:** PDF downloaded successfully within the access window.

---

### Step 9: Demonstrate Time-Lock Enforcement (1 min)
**Actor:** Same as Step 8
**Screen:** Student dashboard

- Manually edit the `access_end` time to a past date (using Django admin or API)
- Try downloading again
- Show the 403 response: `"window_expired"`
- Explain: "Server-side enforcement — client cannot bypass this"

**Expected Result:** 403 with clear error reason.

---

### Step 10: Prove Registration Security (1 min)
**Actor:** Any team member
**Screen:** New browser/incognito window → `/register`

- Attempt to register with role="coe"
- Show the 400 validation error: `"Self-registration is only available for roles: teacher, student."`
- Successfully register as student
- Show the new account created with role="student"

**Expected Result:** COE registration rejected; student registration succeeds.

---

### Step 11: Show Test Results (1 min)
**Actor:** Any team member
**Screen:** Terminal

```bash
cd backend
python manage.py test exams.tests --keepdb
```

- Show: `Ran 116 tests in 269s — OK`
- Point out key test categories covered

**Expected Result:** All 116 tests pass.

---

### Step 12: Closing — Project Stats (30 sec)
**Actor:** Lead presenter

Display summary:
```
Backend Tests:    116/116 PASS
Frontend Build:   Clean (zero warnings)
Security Issues:  0 P0, 2 P1 (non-security), 5 P2
Roles Enforced:   5 roles, all boundary-checked server-side
Encryption:       Fernet + RSA-2048 + AES-GCM
NLP Pipeline:     TF-IDF + Cosine Similarity + Bloom's Taxonomy
Blockchain:       Solidity contract (Ganache ready)
IPFS:             Integration code complete (node ready)
```

---

## Fallback Plan

If the backend/frontend is not running during the actual presentation:

1. **Show screenshots** of each dashboard (prepare these beforehand)
2. **Show test output** in a terminal (run `python manage.py test exams.tests --keepdb` before the demo starts)
3. **Explain** what each step would show live
4. **Highlight** the code: open VS Code and navigate to key files (`serializers.py`, `views_api.py`, `blockchain.py`, `nlp_utils.py`)

**Most Important Fallback:** Be ready to say "The system is fully functional — let me show you the code that implements this." Then open the relevant source file and walk through the key lines.

---

## Quick Command Reference

```bash
# Start backend
cd C:/Users/MAMATHA Y S/Desktop/EXAMVAULT/backend
python manage.py runserver

# Start frontend (separate terminal)
cd C:/Users/MAMATHA Y S/Desktop/EXAMVAULT/frontend
npm start

# Run tests
cd C:/Users/MAMATHA Y S/Desktop/EXAMVAULT/backend
python manage.py test exams.tests --keepdb

# Check audit log count
python manage.py shell -c "from exams.models import AuditLog; print(AuditLog.objects.count(), 'entries')"
```

---

## Account Credentials Quick Reference

| Username | Password | Role | Use In Demo |
|----------|----------|------|-------------|
| admin | admin123 | teacher+superuser | Teacher workflow, requests |
| coe_user | coe123 | coe | Accept requests, select, finalize |
| super_user | super123 | superintendent | View audit logs |
| student_user | student123 | student | Download papers, test RBAC |
