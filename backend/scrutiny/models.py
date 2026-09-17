from django.db import models
from exams.models import Request

class ScrutinyResult(models.Model):
    request_obj = models.ForeignKey(Request, on_delete=models.CASCADE, null=True, blank=True)
    summary = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ScrutinyResult for Request {self.request_obj_id} at {self.created_at}"
