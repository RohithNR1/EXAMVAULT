from django.db import models
from django.contrib.auth.models import AbstractUser
import datetime
import json

def teacherID():
    t_id = 'TEA-1'
    try:
        prev = CustomUser.objects.values('teacher_id').last()
        prev = prev['teacher_id']
        number = int(prev.split('-')[1]) + 1
        t_id = 'TEA-' + str(number)
    except:
        t_id = 'TEA-1'
    return t_id

ROLE = (
    ('teacher', 'teacher'),
    ('coe', 'coe'),
    ('superintendent', 'superintendent'),
    ('student', 'student')
)

SEM = (
    ('None', 'None'),
    ('I', 'I'),
    ('II', 'II'),
    ('III', 'III'),
    ('IV', 'IV'),
    ('V', 'V'),
    ('VI', 'VI'),
    ('VII', 'VII'),
    ('VIII', 'VIII')
)

BRANCH = (
    ('None', 'None'),
    ('CSE', 'CSE'),
    ('IT', 'IT'),
    ('ECE', 'ECE'),
    ('EEE', 'EEE'),
    ('MECH', 'MECH'),
    ('BioTech', 'BioTech')
)

SUB = (
    ('None', 'None'),
    ('Internet of Things', 'Internet of Things'),
    ('Parallel Computing', 'Parallel Computing'),
    ('Cryptography', 'Cryptography'),
    ('Big Data Analytics', 'Big Data Analytics'),
    ('MACHINE LEARNING', 'MACHINE LEARNING')
)

STATUS = (
    ('Pending', 'Pending'),
    ('Accepted', 'Accepted'),
    ('Uploaded', 'Uploaded'),
    ('Finalized', 'Finalized'),
    ('Rejected', 'Rejected'),
)

SELECTION_STATUS = (
    ('PENDING', 'Pending Review'),
    ('UNDER_REVIEW', 'Under Review'),
    ('SELECTED', 'Selected'),
    ('NOT_SELECTED', 'Not Selected'),
)


class CustomUser(AbstractUser):
    teacher_id = models.CharField(max_length=20, default=teacherID, blank=True)
    course = models.CharField(max_length=4, choices=(('None', 'None'), ('B.E.', "B.E."), ('M.E.', 'M.E.')), default='None')
    semester = models.CharField(max_length=4, choices=SEM, default='None')
    branch = models.CharField(max_length=40, choices=BRANCH, default='None')
    subject = models.CharField(max_length=30, choices=SUB, default='None')
    role = models.CharField(max_length=20, choices=ROLE, default='teacher')

    def __str__(self):
        return self.username


class Request(models.Model):
    tusername = models.CharField(max_length=40, default='None')
    s_code = models.CharField(max_length=7, default="None")
    syllabus = models.FileField(upload_to='syllabus/', null=True, blank=True)
    q_pattern = models.FileField(upload_to='q_patterns/', null=True, blank=True)
    deadline = models.DateField(default=datetime.date.today)
    status = models.CharField(max_length=10, default='Pending', choices=STATUS)
    selection_status = models.CharField(
        max_length=20,
        choices=SELECTION_STATUS,
        default='PENDING'
    )
    uploaded_at = models.DateTimeField(null=True, blank=True)
    selected_at = models.DateTimeField(null=True, blank=True)
    finalized_at = models.DateTimeField(null=True, blank=True)
    enc_field = models.TextField(default='[]', blank=True)  # Store as JSON string
    private_key = models.FileField(upload_to='private_keys/', null=True, blank=True)
    total_marks = models.IntegerField(default=100)

    def __str__(self):
        return f"{self.tusername} - {self.s_code}"


class FinalPapers(models.Model):
    s_code = models.CharField(max_length=7, default="None")
    course = models.CharField(max_length=4, default='None')
    semester = models.CharField(max_length=4, default='None')
    branch = models.CharField(max_length=40, default='None')
    subject = models.CharField(max_length=30, default='None')
    paper = models.FileField(upload_to='final_papers/', null=True, blank=True)
    exam_datetime = models.DateTimeField(null=True, blank=True)
    access_start = models.DateTimeField(null=True, blank=True)
    access_end = models.DateTimeField(null=True, blank=True)
    # Phase 4.1: IPFS CID of the encrypted paper (replaces direct media URL access).
    # Kept alongside `paper` for backward compatibility until legacy rows are migrated.
    encrypted_cid = models.CharField(max_length=256, blank=True, default='')
    # Phase 4.1: AES-GCM wrapped Fernet key (base64-encoded iv + ciphertext).
    # Stored so students can decrypt via server-side endpoint without exposing keys.
    wrapped_iv = models.TextField(blank=True, default='')
    wrapped_ct = models.TextField(blank=True, default='')

    def __str__(self):
        return self.s_code


# Severity choices shared between model and helper.
AUDIT_SEVERITY = (
    ("info", "Info"),
    ("warn", "Warn"),
    ("error", "Error"),
)


class AuditLog(models.Model):
    """Persistent, queryable audit trail for security-relevant events."""

    timestamp = models.DateTimeField(auto_now_add=True)
    actor_username = models.CharField(max_length=150, db_index=True)
    actor_role = models.CharField(max_length=20, db_index=True)
    action = models.CharField(max_length=100, db_index=True)
    paper_id = models.IntegerField(null=True, blank=True)
    s_code = models.CharField(max_length=7, null=True, blank=True, db_index=True)
    detail = models.TextField(blank=True, default="")
    severity = models.CharField(max_length=10, choices=AUDIT_SEVERITY, default="info")

    class Meta:
        ordering = ("-timestamp",)
        indexes = [
            models.Index(fields=["action", "-timestamp"]),
            models.Index(fields=["s_code", "-timestamp"]),
            models.Index(fields=["severity", "-timestamp"]),
        ]

    def __str__(self):
        return f"{self.timestamp.isoformat()} {self.actor_username} [{self.severity}] {self.action}"


class SubjectCode(models.Model):
    s_code = models.CharField(max_length=7)
    subject = models.CharField(max_length=40)
    syllabus = models.FileField(upload_to='subject_syllabus/', null=True, blank=True)
    q_pattern = models.FileField(upload_to='subject_qpatterns/', null=True, blank=True)

    def __str__(self):
        return self.subject
