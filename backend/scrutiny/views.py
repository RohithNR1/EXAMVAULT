import logging
import os

from django.core.files import File
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from exams.models import SubjectCode
from .models import ScrutinyResult
from .nlp_utils import analyze_file
from .scrutiny_utils import get_scrutiny_summary_for_dashboard
from .serializers import ScrutinyResultSerializer
from .vtu_fetcher import sync_vtu_resources

logger = logging.getLogger(__name__)

class AnalyzeFileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        f = request.FILES.get("file")
        if not f:
            return Response({"detail":"file is required"}, status=400)
        import tempfile, os
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(f.name)[1]) as tmp:
            for chunk in f.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name
        try:
            res = analyze_file(tmp_path)
            return Response(res)
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass

class ScrutinyResultsAPIView(APIView):
    """
    API endpoint to retrieve scrutiny results for all uploaded papers.
    Used by COE dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get all scrutiny results with related request information
            results = ScrutinyResult.objects.select_related('request_obj').all().order_by('-created_at')
            
            # Serialize the results
            serializer = ScrutinyResultSerializer(results, many=True)
            
            return Response({
                "results": serializer.data,
                "count": results.count()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Error retrieving scrutiny results: {e}")
            return Response(
                {"detail": "Failed to retrieve scrutiny results"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ScrutinySummaryAPIView(APIView):
    """
    API endpoint to get summary statistics for COE dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            summary = get_scrutiny_summary_for_dashboard()
            return Response(summary, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Error getting scrutiny summary: {e}")
            return Response(
                {"detail": "Failed to get scrutiny summary"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ScrutinyDetailAPIView(APIView):
    """
    API endpoint to get detailed scrutiny result for a specific paper.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, request_id):
        try:
            scrutiny_result = get_object_or_404(ScrutinyResult, request_obj_id=request_id)
            serializer = ScrutinyResultSerializer(scrutiny_result)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Error retrieving scrutiny detail for request {request_id}: {e}")
            return Response(
                {"detail": "Failed to retrieve scrutiny details"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VTUSyncAPIView(APIView):
    """
    Trigger automated download of VTU syllabus and model question papers.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        subject_code = request.data.get("subject_code")
        syllabus_url = request.data.get("syllabus_url")
        question_index_url = request.data.get("question_index_url")

        if not subject_code or not syllabus_url:
            return Response(
                {"detail": "subject_code and syllabus_url are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = sync_vtu_resources(subject_code.strip(), syllabus_url.strip(), question_index_url)

        # Attempt to attach downloaded syllabus to SubjectCode record
        syllabus_info = result.get("syllabus")
        if syllabus_info and not result.get("syllabus_error"):
            subject_obj, _created = SubjectCode.objects.get_or_create(
                s_code=subject_code,
                defaults={"subject": subject_code},
            )

            stored_path = syllabus_info.get("stored_path")
            if stored_path and not subject_obj.syllabus:
                try:
                    with default_storage.open(stored_path, "rb") as syllabus_file:
                        filename = os.path.basename(stored_path)
                        subject_obj.syllabus.save(filename, File(syllabus_file), save=False)
                    subject_obj.save(update_fields=["syllabus"])
                except Exception as exc:
                    logger.warning("Failed to attach syllabus file to SubjectCode %s: %s", subject_code, exc)

        return Response(result, status=status.HTTP_200_OK)
