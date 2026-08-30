# EXAM-VAULT - Complete Project Documentation

## 📋 PROJECT OVERVIEW

**Project Name:** EXAM-VAULT  
**Tagline:** Reinventing Examination Security Through Blockchain and Encryption  
**Institution:** Bangalore Institute of Technology (BIT)  
**Department:** Department of Computer Science and Engineering

### Purpose
EXAM-VAULT is a comprehensive examination management system that secures exam papers and results using:
- **Blockchain Technology** - Immutable record storage of exam submissions
- **File Encryption** - Asymmetric encryption (RSA) for exam paper confidentiality
- **IPFS Storage** - Distributed file storage for decentralized access
- **NLP Scrutiny** - Automatic plagiarism detection and paper quality analysis
- **Multi-Role Authentication** - Role-based access control (Teacher, COE, Student, Superintendent)

---

## 🏗️ PROJECT ARCHITECTURE

### Tech Stack

**Backend:**
- Framework: Django 5.2.17
- API: Django REST Framework (DRF)
- Database: MySQL (changed from PostgreSQL)
- Authentication: JWT (JSON Web Tokens) via djangorestframework-simplejwt
- File Encryption: cryptography library (Fernet)
- Blockchain: Web3.py (Ethereum blockchain integration)
- NLP: NLTK, scikit-learn (text analysis & plagiarism detection)
- File Storage: IPFS (InterPlanetary File System)

**Frontend:**
- Framework: React 19.1.1
- CSS: Tailwind CSS 3.4.17
- HTTP Client: Axios
- Routing: React Router DOM 6.30.1
- UI Components: Headless UI

**Database:**
- MySQL 8.0+ (using mysqlclient driver)
- Tables: Custom users, requests, final papers, subject codes, scrutiny results

---

## 📁 COMPLETE FOLDER STRUCTURE

```
EXAM-VAULT-main/
│
├── backend/
│   ├── manage.py                 # Django management script
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment variables (DB credentials)
│   │
│   ├── ems/                       # Main Django project config
│   │   ├── __init__.py
│   │   ├── asgi.py               # ASGI configuration (async support)
│   │   ├── settings.py           # Django settings (DB, apps, middleware, auth)
│   │   ├── urls.py               # Main URL router
│   │   └── wsgi.py               # WSGI configuration (production server)
│   │
│   ├── exams/                     # Main application for exam management
│   │   ├── __init__.py
│   │   ├── admin.py              # Django admin interface config
│   │   ├── apps.py               # App configuration
│   │   ├── models.py             # Database models (CustomUser, Request, FinalPapers, SubjectCode)
│   │   ├── serializers.py        # DRF serializers (convert models to JSON)
│   │   ├── views_api.py          # API endpoints for auth, teacher, COE, superintendent
│   │   ├── views.py              # (Legacy) Web views
│   │   ├── urls.py               # App-specific URL routing
│   │   ├── forms.py              # (Legacy) Django forms
│   │   ├── tests.py              # Unit tests
│   │   │
│   │   ├── encryption.py         # Symmetric encryption functions (Fernet)
│   │   ├── a_encryption.py       # Asymmetric encryption (RSA public/private key)
│   │   ├── ipfs_utils.py         # IPFS file upload/download utilities
│   │   ├── blockchain.py         # Blockchain integration (record exam CIDs)
│   │   │
│   │   ├── contract_abi.json     # Smart contract ABI for blockchain calls
│   │   ├── contract_address.txt  # Deployed smart contract address
│   │   │
│   │   ├── contracts/
│   │   │   └── ExamPapers.sol    # Solidity smart contract for exam paper records
│   │   │
│   │   └── migrations/           # Database migration history
│   │       ├── __init__.py
│   │       └── 0001_initial.py (and others)
│   │
│   ├── scrutiny/                  # NLP-based plagiarism & quality analysis
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py             # ScrutinyResult model (stores analysis results)
│   │   ├── serializers.py        # DRF serializers
│   │   ├── views.py              # Scrutiny result APIs
│   │   ├── urls.py               # Scrutiny-specific routes
│   │   │
│   │   ├── scrutiny_utils.py     # Core scrutiny analysis logic
│   │   ├── nlp_utils.py          # NLP utilities (tokenization, similarity)
│   │   ├── vtu_fetcher.py        # VTU syllabus/question pattern fetcher
│   │   │
│   │   └── migrations/           # Database migration history
│   │
│   └── scripts/
│       └── deploy_contract.py    # Script to deploy smart contract to blockchain
│
├── frontend/
│   ├── package.json              # NPM dependencies & scripts
│   ├── README.md                 # Frontend README
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── postcss.config.js         # PostCSS configuration
│   │
│   ├── public/
│   │   ├── index.html            # HTML entry point
│   │   ├── manifest.json         # PWA manifest
│   │   └── robots.txt            # SEO robots file
│   │
│   └── src/                       # React source code
│       ├── index.js              # React DOM render entry
│       ├── App.jsx               # Main app component & routing
│       ├── App.css               # Global styles
│       ├── App.test.js           # App tests
│       ├── index.css             # Global CSS
│       ├── setupTests.js         # Test setup
│       ├── reportWebVitals.js    # Performance monitoring
│       │
│       ├── api/                  # API communication layer
│       │   ├── client.js         # Axios HTTP client setup (base URL, interceptors)
│       │   ├── auth.js           # Auth endpoints (login, register)
│       │   └── teacher_api.js    # Teacher-specific API calls
│       │
│       ├── components/           # Reusable React components
│       │   ├── NavBar.jsx        # Navigation bar with role & logout
│       │   ├── ProtectedRoute.jsx # Route guard for authenticated users
│       │   └── ScrutinyDashboard.jsx # Scrutiny result display component
│       │
│       └── pages/                # Page components (one per role)
│           ├── Login.jsx         # Login page with register link
│           ├── Register.jsx      # Registration form (all roles)
│           ├── Teacher.jsx       # Teacher dashboard (pending/accepted requests)
│           ├── COE.jsx           # COE dashboard (manage teachers & requests)
│           ├── Student.jsx       # Student dashboard (exam results)
│           └── Superintendent.jsx # Superintendent dashboard (final papers)
│
└── .gitignore                    # Git ignore rules

```

---

## 🗄️ DATABASE SCHEMA

### 1. **CustomUser** (extends Django AbstractUser)
```sql
Fields:
- id (PK)
- username (unique)
- email
- password (hashed)
- first_name, last_name
- teacher_id (auto-generated for teachers)
- course (B.E., M.E.)
- semester (I-VIII)
- branch (CSE, IT, ECE, EEE, MECH, BioTech)
- subject (IoT, Cryptography, etc.)
- role (teacher, coe, student, superintendent)
- is_active, is_staff, is_superuser
- date_joined
```

### 2. **Request** (exam paper submission requests)
```sql
Fields:
- id (PK)
- tusername (teacher username)
- s_code (subject code, FK to SubjectCode)
- syllabus (FileField - teacher uploads)
- q_pattern (FileField - question pattern)
- deadline (date)
- status (Pending, Accepted, Uploaded, Finalized, Rejected)
- enc_field (TextField storing JSON - encrypted file hashes)
- private_key (FileField - RSA private key for decryption)
- total_marks (default 100)
```

### 3. **SubjectCode** (subject & default materials)
```sql
Fields:
- id (PK)
- s_code (subject code like "CS101")
- subject (subject name)
- syllabus (FileField - default syllabus)
- q_pattern (FileField - default question pattern)
```

### 4. **FinalPapers** (finalized exam papers)
```sql
Fields:
- id (PK)
- s_code (subject code)
- course (B.E., M.E.)
- semester (I-VIII)
- branch (CSE, IT, etc.)
- subject (subject name)
- paper (FileField - final encrypted paper)
```

### 5. **ScrutinyResult** (NLP analysis results)
```sql
Fields:
- id (PK)
- request_id (FK to Request)
- similarity_score (0-100)
- plagiarism_detected (boolean)
- quality_score (0-100)
- analysis_details (text - detailed findings)
- created_at (timestamp)
```

---

## 🔐 API ENDPOINTS

### Authentication (Public)
- `POST /api/login/` - Login with username/password → returns JWT tokens
- `POST /api/register/` - Register new user with role

### Common (Authenticated)
- `GET /api/subject-codes/` - List all subject codes

### Teacher Routes
- `GET /api/teacher/requests/pending/` - Get pending requests
- `GET /api/teacher/requests/accepted/` - Get accepted/uploaded requests
- `POST /api/teacher/requests/<id>/accept/` - Accept a request
- `POST /api/teacher/requests/<id>/reject/` - Reject a request
- `POST /api/teacher/requests/<id>/upload/` - Upload exam paper
- `GET /api/teacher/final-papers/` - View finalized papers

### COE Routes
- `GET /api/coe/requests/` - List all requests
- `POST /api/coe/teachers/` - Search teachers by criteria
- `POST /api/coe/requests/add/` - Create new exam request for teacher
- `GET /api/coe/candidates/?s_code=...` - List candidates for subject
- `POST /api/coe/requests/<id>/finalize/` - Finalize & encrypt paper

### Superintendent Routes
- `GET /api/sup/final-papers/` - List finalized papers
- `POST /api/sup/final-papers/<id>/decrypt-info/` - Get decryption credentials

### Scrutiny Routes
- `GET /api/scrutiny/results/<req_id>/` - Get scrutiny analysis results

---

## 🔄 WORKFLOW & PROCESS FLOW

### 1. **Teacher Exam Paper Submission**
```
1. COE creates request → assigns subject to teacher with deadline
2. Teacher receives pending request
3. Teacher uploads exam paper (PDF/Word)
4. System encrypts paper (asymmetric RSA)
5. NLP scrutiny analyzes paper for plagiarism/quality
6. Paper stored on IPFS
7. IPFS CID recorded on blockchain (immutable)
8. Request status → "Uploaded"
```

### 2. **COE Review & Finalization**
```
1. COE reviews submitted papers
2. COE selects candidates for final papers
3. COE finalizes chosen candidate's paper
4. Final paper encrypted with symmetric key (Fernet)
5. Decryption key stored separately (security)
6. Request status → "Finalized"
```

### 3. **Superintendent Result Release**
```
1. Superintendent views finalized papers
2. Requests decryption info from COE
3. Receives temporary decryption credentials
4. Downloads & decrypts paper
5. Releases results to students
```

### 4. **Student Result Viewing**
```
1. Student logs in to dashboard
2. Views exam results in "My Exam Results" section
3. Can see marks, subject, and status
```

---

## 🔒 SECURITY FEATURES

### 1. **Authentication & Authorization**
- JWT tokens for stateless authentication
- Role-based access control (RBAC)
- Token expiry: 8 hours (access), 7 days (refresh)
- CORS enabled for frontend communication

### 2. **File Encryption**
- **Asymmetric (RSA)**: Encrypts exam papers during submission
- **Symmetric (Fernet)**: Final papers encrypted before storage
- Private keys stored securely in database
- Keys never transmitted directly

### 3. **Blockchain Integration**
- Smart contract records exam paper CIDs
- IPFS CIDs stored on blockchain for immutability
- Timestamp proof of submission
- Prevents tampering of exam records

### 4. **NLP Plagiarism Detection**
- Automatic analysis of submitted papers
- Similarity scoring against question patterns
- Quality assessment based on content
- Flags suspicious submissions

### 5. **IPFS Storage**
- Distributed file system (P2P)
- No central point of failure
- Content-addressed (CID based)
- Blockchain-verified integrity

---

## 📊 KEY FEATURES BY ROLE

### **Teacher**
- ✅ View exam paper submission requests
- ✅ Accept or reject requests
- ✅ Upload exam papers with encryption
- ✅ View final papers after COE approval
- ✅ Automatic plagiarism check on upload

### **COE (Chief Exam Officer)**
- ✅ Search & filter teachers
- ✅ Create exam paper requests (assign subject + deadline)
- ✅ Review all submitted papers
- ✅ View NLP scrutiny analysis
- ✅ Select candidates for final papers
- ✅ Finalize papers (encrypt & store)
- ✅ Manage subject materials (syllabus, question patterns)

### **Student**
- ✅ View exam results dashboard
- ✅ Check marks, subjects, and status
- ✅ Download result documents (if released)
- ✅ View exam schedule/deadlines

### **Superintendent**
- ✅ View all finalized papers
- ✅ Request decryption credentials from COE
- ✅ Decrypt & review papers
- ✅ Approve/release results to students
- ✅ Audit trail access

---

## 🚀 INSTALLATION & SETUP

### Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure .env file
# DB_NAME=examvault
# DB_USER=root
# DB_PASSWORD=your_password
# DB_HOST=127.0.0.1
# DB_PORT=3306

# Create MySQL database
# CREATE DATABASE examvault;

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
# Opens at http://localhost:3000
```

---

## 📦 KEY FILES EXPLAINED

### **models.py** - Database structure
- Defines all database tables
- Relationships between users, requests, papers
- Field validations & default values

### **views_api.py** - API logic
- Handles all API endpoints
- Authentication logic
- File upload processing
- Encryption/decryption logic
- Scrutiny analysis trigger

### **serializers.py** - Data conversion
- Converts Django models to JSON
- Validation of incoming data
- Response formatting

### **urls.py** - Routing
- Maps URLs to API endpoints
- Backend: `ems/urls.py` routes to app URLs
- Frontend: `App.jsx` handles React routing

### **encryption.py** - Symmetric encryption
- Fernet cipher for symmetric encryption
- Encrypt/decrypt exam papers
- Key management

### **a_encryption.py** - Asymmetric encryption
- RSA public/private key encryption
- Secure key generation
- Decryption credentials

### **blockchain.py** - Blockchain integration
- Records exam CIDs on smart contract
- Verifies blockchain records
- Timestamp proof

### **ipfs_utils.py** - File storage
- Upload files to IPFS
- Download files from IPFS
- CID management

### **scrutiny_utils.py** - Plagiarism detection
- NLP analysis of documents
- Similarity scoring
- Quality assessment
- Generates scrutiny reports

### **client.js** - HTTP communication
- Axios instance with base URL
- JWT token auto-injection
- Error handling
- Request/response interceptors

### **ProtectedRoute.jsx** - Route security
- Checks if user is authenticated
- Redirects to login if not
- Role-based route access (future enhancement)

### **Login.jsx, Register.jsx** - Auth pages
- User authentication form
- Registration with role selection
- JWT token storage in localStorage

### **Teacher.jsx, COE.jsx, Student.jsx, Superintendent.jsx** - Role dashboards
- Role-specific UI
- API calls to fetch data
- Forms for data submission

---

## 🔧 ENVIRONMENT CONFIGURATION (.env)

```
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

DB_NAME=examvault
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
```

---

## 📝 DEPENDENCIES

### Backend (Python)
- Django 5.2.17
- djangorestframework 3.18
- djangorestframework-simplejwt 5.5
- mysqlclient 2.2 (MySQL driver)
- cryptography 41.0 (encryption)
- web3 7.16 (blockchain)
- NLTK 3.10 (NLP)
- scikit-learn 1.7 (ML)
- beautifulsoup4 4.15 (HTML parsing)
- requests 2.34 (HTTP)
- PyMuPDF 1.28 (PDF processing)
- Pillow 12.3 (image processing)

### Frontend (JavaScript)
- react 19.1
- react-dom 19.1
- react-router-dom 6.30
- axios 1.11
- tailwindcss 3.4
- @headlessui/react 2.2

---

## 🧪 TESTING CREDENTIALS

| Role | Username | Password |
|------|----------|----------|
| Teacher | admin | admin@gmail.com |
| COE | coe_user | coe123 |
| Student | student_user | student123 |
| Superintendent | super_user | super123 |

---

## 🔄 DATA FLOW DIAGRAM

```
Frontend (React)
    ↓
Client.js (Axios HTTP)
    ↓
Backend API (Django REST)
    ↓
Views API (Business Logic)
    ↓
Models (Database)
    ↓
MySQL (Data Storage)
    
Parallel Flows:
- File Upload → Encryption → IPFS → Blockchain
- Paper Analysis → NLP Scrutiny → Results Stored
- User Action → JWT Validation → Role Check → Execute
```

---

## 🎯 FUTURE ENHANCEMENTS

1. **Advanced NLP**: Deeper plagiarism detection with ML models
2. **Multi-language Support**: Support for regional languages
3. **Mobile App**: React Native mobile application
4. **Email Notifications**: Automated status updates via email
5. **Audit Logging**: Complete action audit trail
6. **Advanced Analytics**: Dashboard with statistics & trends
7. **Payment Integration**: For commercial deployments
8. **API Documentation**: Swagger/OpenAPI documentation
9. **Rate Limiting**: API rate limiting for security
10. **Backup & Recovery**: Automated database backups

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**Backend won't start:**
```
→ Check MySQL is running
→ Verify .env credentials
→ Run: python manage.py migrate
```

**Frontend won't load:**
```
→ Check backend is running on 127.0.0.1:8000
→ Run: npm install
→ Check for CORS errors in browser console
```

**Login fails:**
```
→ Verify username/password in database
→ Check JWT tokens in localStorage
→ Review API response in browser DevTools
```

---

## 📚 ADDITIONAL RESOURCES

- **Django Docs**: https://docs.djangoproject.com/
- **React Docs**: https://react.dev/
- **Web3.py**: https://web3py.readthedocs.io/
- **IPFS**: https://ipfs.io/
- **Smart Contracts**: https://solidity.readthedocs.io/

---

**Last Updated:** August 29, 2026  
**Version:** 1.0  
**Status:** Fully Functional ✅

