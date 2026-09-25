import os
import logging
import logging.handlers
from pathlib import Path
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")  # loads .env variables

# Django settings
_SECRET = os.getenv("SECRET_KEY")
if not _SECRET:
    raise ImproperlyConfigured(
        "SECRET_KEY environment variable is required. "
        "Copy backend/.env.example to backend/.env and set SECRET_KEY."
    )
SECRET_KEY = _SECRET
# DEBUG defaults to False in production; explicitly opt into debug via DEBUG=True env var.
DEBUG = os.getenv("DEBUG", "False") == "True"
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "exams",
    "scrutiny",  # new app for automatic scrutiny
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "ems.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    },
]

WSGI_APPLICATION = "ems.wsgi.application"

# MySQL
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "3306"),
    }
}

# Custom user
AUTH_USER_MODEL = "exams.CustomUser"

# Make sure we use Django's model backend (default), explicit for clarity
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

# DRF + JWT
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # Default throttle for unauthenticated (anonymous) requests
        "anon": "20/min",
        # Auth endpoints use a custom tight throttle (see AuthRateThrottle)
        "auth": "5/min",
        # Logged-in users get a generous per-action limit.
        "user": "100/min",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
}

# CORS - default to localhost frontend for local development.
# In production, set CORS_ALLOWED_ORIGINS to the explicit list of trusted origins.
_cors_origins_raw = os.getenv("CORS_ALLOWED_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:3000,http://localhost:3000")
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in _cors_origins_raw.split(",") if o.strip()
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ["*"]
CORS_EXPOSE_HEADERS = ["*"]

# Production security settings (safe when behind a reverse proxy / TLS terminator).
# When DEBUG=True these are relaxed so local HTTP development continues to work.
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Static / Media
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Ensure dirs exist
os.makedirs(MEDIA_ROOT, exist_ok=True)

# Upload size limits (adjust as needed)
DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.getenv("DATA_UPLOAD_MAX_MEMORY_SIZE", 50 * 1024 * 1024))  # 50 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = int(os.getenv("FILE_UPLOAD_MAX_MEMORY_SIZE", 50 * 1024 * 1024))  # 50 MB

# Encryption folder
ENCRYPTION_ROOT = MEDIA_ROOT / "encryption_keys"
ENCRYPTION_ROOT.mkdir(parents=True, exist_ok=True)
ENCRYPTION_MASTER_KEY = os.getenv("ENCRYPTION_MASTER_KEY")

# IPFS / Blockchain environment
IPFS_HOST = os.getenv("IPFS_HOST", "127.0.0.1")
IPFS_PORT = int(os.getenv("IPFS_PORT", "5001"))
# Phase 4.2: HTTP timeout (seconds) and max retry attempts for IPFS API calls.
IPFS_TIMEOUT_SECONDS = int(os.getenv("IPFS_TIMEOUT_SECONDS", "30"))
IPFS_MAX_RETRIES = int(os.getenv("IPFS_MAX_RETRIES", "2"))
RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:7545")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# Security event logger — writes auth failures and role violations to
# a dedicated log file without leaking passwords, private keys, or tokens.
_security_logger = logging.getLogger("examvault.security")
_security_handler = logging.handlers.RotatingFileHandler(
    BASE_DIR / "logs" / "security.log",
    maxBytes=5 * 1024 * 1024,  # 5 MB
    backupCount=3,
)
_security_handler.setFormatter(logging.Formatter(
    "%(asctime)s %(levelname)s %(message)s"
))
_security_logger.addHandler(_security_handler)
_security_logger.setLevel(logging.WARNING)
# Ensure the logs directory exists at import time.
(BASE_DIR / "logs").mkdir(exist_ok=True)

# Logging - prints to console (development friendly)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler",},
        "security_file": {"class": "logging.handlers.RotatingFileHandler",
                          "filename": str(BASE_DIR / "logs" / "security.log"),
                          "maxBytes": 5 * 1024 * 1024,
                          "backupCount": 3,
                          "formatter": "simple",},
    },
    "formatters": {
        "simple": {"format": "%(asctime)s %(levelname)s %(name)s %(message)s"},
    },
    "root": {
        "handlers": ["console"],
        "level": "DEBUG" if DEBUG else "INFO",
    },
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "exams": {"handlers": ["console"], "level": "DEBUG", "propagate": True},
        "scrutiny": {"handlers": ["console"], "level": "DEBUG", "propagate": True},
        "examvault.security": {
            "handlers": ["console", "security_file"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}

# End of settings.py
