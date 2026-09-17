import base64
import logging

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.files import File
import os

logger = logging.getLogger(__name__)


def derive_master_key(env_var_name: str = "ENCRYPTION_MASTER_KEY") -> bytes:
    """Derive a 32-byte master key from an env-var secret via HKDF-SHA256.

    The env var must contain at least 32 bytes of material (ideally 64+).
    Returns deterministic output for the same input; never log or expose it.
    """
    secret = settings.ENCRYPTION_MASTER_KEY
    if not secret:
        raise ImproperlyConfigured(
            f"{env_var_name} environment variable is required for encrypted paper retrieval. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    ikm = secret.encode("utf-8")
    dk = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        info=b"examvault.finalpaper.decrypt.v1",
        salt=None,
    ).derive(ikm)
    return dk


def wrap_fernet_key(fernet_key: bytes) -> tuple[bytes, bytes]:
    """Wrap a Fernet key with the derived master key using AES-GCM.

    Returns (iv, ciphertext). The caller stores both on the model; the cipher
    text is base64-encoded before storage, and the iv is stored raw as hex.
    Never logs key material.
    """
    from django.core.exceptions import ImproperlyConfigured
    master = derive_master_key()
    aesgcm = AESGCM(master)
    iv = os.urandom(12)
    # Fernet key is a 32-byte urlsafe-base64 string; decode to raw bytes first.
    raw_key = base64.urlsafe_b64decode(fernet_key)
    ct = aesgcm.encrypt(iv, raw_key, None)
    return iv, ct


def unwrap_fernet_key(iv: bytes, ciphertext: bytes) -> bytes:
    """Reverse of wrap_fernet_key. Returns raw 32-byte Fernet key."""
    master = derive_master_key()
    aesgcm = AESGCM(master)
    raw_key = aesgcm.decrypt(iv, ciphertext, None)
    return base64.urlsafe_b64encode(raw_key).decode("utf-8")


def encrypt_file(paper):

	key = Fernet.generate_key()
	input_file = paper
	output_file = os.path.join(settings.ENCRYPTION_ROOT,str(paper)+'.encrypted')

	data = input_file.read()

	fernet = Fernet(key)
	encrypted = fernet.encrypt(data)

	with open(output_file, 'wb') as f:
	    f.write(encrypted) 

	return key


def decrypt_file(paper, key, s_code):

	fernet = Fernet(key)
	paper = paper.text.encode('utf-8')

	decrypted = fernet.decrypt(paper)

	decrypted_path = os.path.join(settings.MEDIA_ROOT, 'final_papers', f'{s_code}.pdf')
	os.makedirs(os.path.dirname(decrypted_path), exist_ok=True)
	with open(decrypted_path, 'wb') as f:
		f.write(decrypted)

	file_ = open(decrypted_path, 'rb')
	f_file = File(file_)

	return f_file