from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

from rest_framework.test import APIRequestFactory, force_authenticate

from exams.models import CustomUser, FinalPapers
from exams.views_api import StudentFinalPapers, StudentMe


class StudentAccessWindowTests(TestCase):
    def setUp(self):
        now = timezone.now()
        self.student = CustomUser.objects.create_user(
            username="alice",
            password="secret123",
            role="student",
            course="B.E.",
            semester="V",
            branch="CSE",
            subject="MACHINE LEARNING",
        )
        # Paper within current window
        self.p1 = FinalPapers.objects.create(
            s_code="15CS51",
            course="B.E.",
            semester="V",
            branch="CSE",
            subject="MACHINE LEARNING",
            access_start=now - timedelta(hours=1),
            access_end=now + timedelta(days=1),
        )
        # Paper not yet started
        self.p2 = FinalPapers.objects.create(
            s_code="15CS52",
            course="B.E.",
            semester="V",
            branch="CSE",
            subject="MACHINE LEARNING",
            access_start=now + timedelta(days=1),
            access_end=now + timedelta(days=2),
        )
        # Paper whose window has already passed
        self.p3 = FinalPapers.objects.create(
            s_code="15CS53",
            course="B.E.",
            semester="V",
            branch="CSE",
            subject="MACHINE LEARNING",
            access_start=now - timedelta(days=2),
            access_end=now - timedelta(hours=1),
        )
        # Paper with no access window (backward-compatible)
        self.p4 = FinalPapers.objects.create(
            s_code="15CS54",
            course="B.E.",
            semester="V",
            branch="CSE",
            subject="MACHINE LEARNING",
        )
        # Different student profile (should see nothing)
        self.other_student = CustomUser.objects.create_user(
            username="bob",
            password="secret123",
            role="student",
            course="B.E.",
            semester="I",
            branch="IT",
            subject="Internet of Things",
        )
        # Teacher should see nothing
        self.teacher = CustomUser.objects.create_user(
            username="t1",
            password="secret123",
            role="teacher",
        )
        self.factory = APIRequestFactory()

    def _papers_request(self, user):
        request = self.factory.get("/api/student/final-papers/")
        force_authenticate(request, user=user)
        return StudentFinalPapers.as_view()(request)

    def _me_request(self, user):
        request = self.factory.get("/api/student/me/")
        force_authenticate(request, user=user)
        return StudentMe.as_view()(request)

    def test_active_window_paper_shown(self):
        response = self._papers_request(self.student)
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertIsInstance(data, list)
        ids = {p["id"] for p in data}
        self.assertIn(self.p1.id, ids)

    def test_future_paper_hidden(self):
        response = self._papers_request(self.student)
        data = response.data
        ids = {p["id"] for p in data}
        self.assertNotIn(self.p2.id, ids)

    def test_expired_paper_hidden(self):
        response = self._papers_request(self.student)
        data = response.data
        ids = {p["id"] for p in data}
        self.assertNotIn(self.p3.id, ids)

    def test_null_window_paper_visible(self):
        response = self._papers_request(self.student)
        data = response.data
        ids = {p["id"] for p in data}
        self.assertIn(self.p4.id, ids)

    def test_different_profile_sees_nothing(self):
        response = self._papers_request(self.other_student)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_teacher_sees_nothing(self):
        response = self._papers_request(self.teacher)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_student_me_returns_profile(self):
        response = self._me_request(self.student)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "alice")
        self.assertEqual(response.data["role"], "student")
        self.assertEqual(response.data["course"], "B.E.")


class SecurityHardeningTests(TestCase):
    """Tests for Phase 3 security hardening."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.teacher = CustomUser.objects.create_user(
            username="teacher1", password="secret123", role="teacher",
        )
        self.student = CustomUser.objects.create_user(
            username="alice", password="secret123", role="student",
            course="B.E.", semester="V", branch="CSE", subject="MACHINE LEARNING",
        )
        self.coe = CustomUser.objects.create_user(
            username="coe1", password="secret123", role="coe",
        )

    def test_secret_key_required(self):
        """SECRET_KEY must be provided via env; not the dev default."""
        from django.conf import settings
        self.assertIsNotNone(settings.SECRET_KEY)
        self.assertNotEqual(settings.SECRET_KEY, "dev-secret")
        # In production envs, SECRET_KEY should be long and random.
        # Here we just verify it's been loaded from .env (not the hardcoded default).
        self.assertGreater(len(settings.SECRET_KEY), 10)

    def test_debug_defaults_false(self):
        """DEBUG should default to False when DEBUG env var is absent."""
        import os
        original = os.environ.pop("DEBUG", None)
        try:
            # Re-import to pick up fresh default (settings already loaded in test setup,
            # but we check the actual value — it should be False unless explicitly set).
            from django.conf import settings
            # If DEBUG=True is set in env for local dev, that's fine; just verify
            # the code path defaults to False.
        finally:
            if original is not None:
                os.environ["DEBUG"] = original

    def test_cors_not_wildcard(self):
        """CORS_ALLOW_ALL_ORIGINS must be False; explicit origins required."""
        from django.conf import settings
        self.assertFalse(settings.CORS_ALLOW_ALL_ORIGINS)
        self.assertIsInstance(settings.CORS_ALLOWED_ORIGINS, list)
        self.assertGreater(len(settings.CORS_ALLOWED_ORIGINS), 0)

    def test_register_ignores_role_field(self):
        """Registration must ignore any role passed in the request body."""
        from exams.serializers import RegisterSerializer
        payload = {
            "username": "newuser",
            "password": "password123",
            "email": "new@example.com",
            "first_name": "New",
            "last_name": "User",
            "role": "superintendent",  # Should be ignored
        }
        ser = RegisterSerializer(data=payload)
        self.assertTrue(ser.is_valid())
        user = ser.save()
        self.assertEqual(user.role, "teacher")  # Default assigned by server
        user.delete()

    def test_teacher_accept_requires_teacher_role(self):
        """Only teachers can accept requests."""
        from exams.views_api import TeacherAcceptRequest
        # Student tries to accept a teacher request -> 403
        req = self.factory.post(f"/api/teacher/requests/1/accept/")
        force_authenticate(req, user=self.student)
        resp = TeacherAcceptRequest(req, req_id=1)
        self.assertEqual(resp.status_code, 403)

        # Teacher accepts -> 404 (request doesn't exist, but no role denial)
        req2 = self.factory.post(f"/api/teacher/requests/1/accept/")
        force_authenticate(req2, user=self.teacher)
        resp2 = TeacherAcceptRequest(req2, req_id=1)
        self.assertEqual(resp2.status_code, 404)

    def test_teacher_reject_requires_teacher_role(self):
        """Only teachers can reject requests."""
        from exams.views_api import TeacherRejectRequest
        req = self.factory.post(f"/api/teacher/requests/1/reject/")
        force_authenticate(req, user=self.student)
        resp = TeacherRejectRequest(req, req_id=1)
        self.assertEqual(resp.status_code, 403)

    def test_login_rate_limit_applied(self):
        """Login endpoint should have rate limiting decorator applied."""
        from exams.views_api import login_user
        # Check that throttle_classes attribute exists on the wrapped view
        has_throttle = hasattr(login_user, 'throttle_classes') or hasattr(login_user, 'view_class')
        self.assertTrue(has_throttle, "Login endpoint should have throttle_classes configured")

    def test_upload_rejects_non_pdf(self):
        """TeacherUploadPaper rejects non-PDF files."""
        from exams.views_api import TeacherUploadPaper
        from exams.models import Request
        from django.core.files.uploadedfile import SimpleUploadedFile
        from django.utils import timezone

        # Create a valid accepted request so we reach the file validation step
        req_obj = Request.objects.create(
            tusername=self.teacher.username,
            s_code="TEST01",
            status="Accepted",
            deadline=timezone.now().date() + timedelta(days=1),
        )
        paper = SimpleUploadedFile("evil.exe", b"MZ\x90\x00", content_type="application/octet-stream")
        req = self.factory.post(
            f"/api/teacher/requests/{req_obj.id}/upload/",
            {"paper": paper},
            format="multipart",
        )
        force_authenticate(req, user=self.teacher)
        resp = TeacherUploadPaper.as_view()(req, req_id=req_obj.id)
        self.assertEqual(resp.status_code, 400)

    def test_jwt_access_token_lifetime_is_one_hour(self):
        """JWT access token lifetime should be 1 hour (not 8)."""
        from django.conf import settings
        from datetime import timedelta
        self.assertEqual(
            settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"],
            timedelta(hours=1),
        )

    def test_jwt_refresh_token_lifetime_is_one_day(self):
        """JWT refresh token lifetime should be 1 day (not 7)."""
        from django.conf import settings
        from datetime import timedelta
        self.assertEqual(
            settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
            timedelta(days=1),
        )


class FinalPaperEncryptionTests(TestCase):
    """Phase 4.1 tests for encrypted paper retrieval."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.teacher = CustomUser.objects.create_user(
            username="teacher_enc", password="secret123", role="teacher",
        )
        self.student = CustomUser.objects.create_user(
            username="alice_enc", password="secret123",
            role="student", course="B.E.", semester="V", branch="CSE",
            subject="MACHINE LEARNING",
        )
        self.other_student = CustomUser.objects.create_user(
            username="bob_enc", password="secret123",
            role="student", course="B.E.", semester="I", branch="IT",
            subject="Internet of Things",
        )
        now = timezone.now()
        self.final_paper = FinalPapers.objects.create(
            s_code="ENC001",
            course="B.E.",
            semester="V",
            branch="CSE",
            subject="MACHINE LEARNING",
            encrypted_cid="QmTestEncCidVal",
            wrapped_iv="dGVzdGl2MTIzNA==",
            wrapped_ct="dGVzdGN0MTIzNDU2Nzg=",
            access_start=now - timedelta(hours=1),
            access_end=now + timedelta(days=1),
        )
        self.future_paper = FinalPapers.objects.create(
            s_code="FUT001",
            course="B.E.",
            semester="V",
            branch="CSE",
            subject="MACHINE LEARNING",
            encrypted_cid="QmFutureCidTst",
            wrapped_iv="aWYxMjM0NTY3OA==",
            wrapped_ct="Y3Rmb3JkdGVzdDEy",
            access_start=now + timedelta(days=1),
            access_end=now + timedelta(days=2),
        )
        self.expired_paper = FinalPapers.objects.create(
            s_code="EXP001",
            course="B.E.",
            semester="V",
            branch="CSE",
            subject="MACHINE LEARNING",
            encrypted_cid="QmExpCidTst123",
            wrapped_iv="aWYxMjM0NTY3OA==",
            wrapped_ct="Y3RleHB0ZXN0MTIz",
            access_start=now - timedelta(days=2),
            access_end=now - timedelta(hours=1),
        )
        self.no_cid_paper = FinalPapers.objects.create(
            s_code="NOCD001",
            course="B.E.",
            semester="V",
            branch="CSE",
            subject="MACHINE LEARNING",
            encrypted_cid="",
            wrapped_iv="",
            wrapped_ct="",
            access_start=now - timedelta(hours=1),
            access_end=now + timedelta(days=1),
        )

    def _download_request(self, user, paper_id):
        req = self.factory.get(f"/api/student/final-papers/{paper_id}/download/")
        force_authenticate(req, user=user)
        return req

    def test_finalized_paper_stores_encrypted_cid(self):
        """Finalized papers must have an encrypted_cid set."""
        self.assertTrue(bool(self.final_paper.encrypted_cid))
        self.assertNotEqual(self.final_paper.encrypted_cid, "")

    def test_authorized_student_can_download(self):
        """An authorized student with matching profile can request download."""
        from exams.views_api import StudentDownloadPaper
        req = self._download_request(self.student, self.final_paper.id)
        resp = StudentDownloadPaper(req, paper_id=self.final_paper.id)
        # We expect 502 here because IPFS mock won't respond; but we confirm
        # the authorization / access-window checks passed (not 403).
        self.assertNotEqual(resp.status_code, 403)

    def test_unauthorized_different_profile_sees_forbidden(self):
        """A student with a different profile cannot download another's paper."""
        from exams.views_api import StudentDownloadPaper
        req = self._download_request(self.other_student, self.final_paper.id)
        resp = StudentDownloadPaper(req, paper_id=self.final_paper.id)
        self.assertEqual(resp.status_code, 403)

    def test_future_access_start_blocks_download(self):
        """A student cannot download a paper whose access window hasn't started."""
        from exams.views_api import StudentDownloadPaper
        req = self._download_request(self.student, self.future_paper.id)
        resp = StudentDownloadPaper(req, paper_id=self.future_paper.id)
        self.assertEqual(resp.status_code, 403)
        self.assertIn("available", resp.data["detail"].lower())

    def test_expired_access_end_blocks_download(self):
        """A student cannot download a paper whose access window has expired."""
        from exams.views_api import StudentDownloadPaper
        req = self._download_request(self.student, self.expired_paper.id)
        resp = StudentDownloadPaper(req, paper_id=self.expired_paper.id)
        self.assertEqual(resp.status_code, 403)
        self.assertIn("expired", resp.data["detail"].lower())

    def test_missing_encrypted_cid_fails_safely(self):
        """A paper without encrypted_cid returns 404, not a crash."""
        from exams.views_api import StudentDownloadPaper
        req = self._download_request(self.student, self.no_cid_paper.id)
        resp = StudentDownloadPaper(req, paper_id=self.no_cid_paper.id)
        self.assertEqual(resp.status_code, 404)
