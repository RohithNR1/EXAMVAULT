from cryptography.fernet import Fernet
from django.conf import settings
from django.core.files import File
import os

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