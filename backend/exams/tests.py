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
