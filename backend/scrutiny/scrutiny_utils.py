import logging
import os
import re
from typing import List, Optional
from django.db import transaction
from .models import ScrutinyResult
from .nlp_utils import analyze_file
from .vtu_fetcher import load_syllabus_metadata
from exams.models import Request

logger = logging.getLogger(__name__)

def get_existing_questions_for_subject(subject_code: str) -> List[str]:
    """
    Retrieve existing questions from previous papers for the same subject.
    Used for plagiarism detection.
    """
    try:
        # Get all final papers for the same subject
        from exams.models import FinalPapers
        previous_papers = FinalPapers.objects.filter(
            s_code=subject_code
        ).exclude(paper__isnull=True).exclude(paper='')
        
        existing_questions = []
        for paper in previous_papers:
            if paper.paper and os.path.exists(paper.paper.path):
                try:
                    analysis = analyze_file(paper.paper.path)
                    questions = analysis.get('summary', {}).get('sample_questions', [])
                    existing_questions.extend(questions)
                except Exception as e:
                    logger.warning(f"Failed to extract questions from {paper.paper.path}: {e}")
                    continue
        
        return existing_questions
    except Exception as e:
        logger.error(f"Error retrieving existing questions: {e}")
        return []

def perform_automatic_scrutiny(request_obj: Request, temp_file_path: str) -> Optional[ScrutinyResult]:
    """
    Perform automatic scrutiny analysis on an uploaded paper.
    This function is called when a teacher uploads a paper.
    """
    try:
        if not temp_file_path or not os.path.exists(temp_file_path):
            logger.warning(f"No temp file found for request {request_obj.id}")
            return None
        
        logger.info(f"Starting automatic scrutiny for request {request_obj.id}")
        
        # Get existing questions for plagiarism detection
        existing_questions = get_existing_questions_for_subject(request_obj.s_code)
        
        # Perform comprehensive analysis
        analysis_result = analyze_file(temp_file_path, existing_questions)

        # Enrich with VTU syllabus metadata if available
        syllabus_metadata = load_syllabus_metadata(request_obj.s_code)
        if syllabus_metadata:
            analysis_summary = analysis_result.get("summary", {})
            analysis_summary["syllabus_metadata"] = {
                "num_modules": syllabus_metadata.get("num_modules"),
                "course_outcomes": syllabus_metadata.get("course_outcomes"),
            }

            question_reports = analysis_summary.get("questions", [])
            total_questions = len(question_reports) or analysis_summary.get("num_questions", 0)
            module_breakdown = []

            modules = syllabus_metadata.get("modules", [])
            deduped_modules: List[dict] = []
            seen_keys = {}
            for module in modules:
                module_number = str(module.get("module_number", "")).strip()
                key = module_number.lower()
                if key in seen_keys:
                    existing = seen_keys[key]
                    new_description = module.get("description", "")
                    if len(new_description) > len(existing.get("description", "")):
                        existing["description"] = new_description
                        if module.get("title"):
                            existing["title"] = module["title"]
                else:
                    module_copy = {
                        "module_number": module_number,
                        "title": module.get("title"),
                        "description": module.get("description", ""),
                    }
                    deduped_modules.append(module_copy)
                    seen_keys[key] = module_copy

            for module in deduped_modules:
                description = module.get("description", "").lower()

                matched_questions = 0
                contributing_tags = set()

                for report in question_reports:
                    tags = report.get("tags", [])
                    if not tags:
                        continue

                    if any(re.search(rf"\b{re.escape(tag.lower())}\b", description) for tag in tags):
                        matched_questions += 1
                        contributing_tags.update(tag.lower() for tag in tags)

                coverage = matched_questions / max(total_questions, 1)

                module_breakdown.append(
                    {
                        "module_number": module.get("module_number"),
                        "title": module.get("title"),
                        "coverage": round(coverage, 2),
                        "matched_questions": matched_questions,
                        "contributing_tags": sorted(contributing_tags),
                    }
                )

            if module_breakdown:
                avg_coverage = sum(m["coverage"] for m in module_breakdown) / len(module_breakdown)
                analysis_summary["syllabus_alignment"] = {
                    "average_module_coverage": round(avg_coverage, 2),
                    "module_breakdown": module_breakdown,
                }

                # Adjust overall score based on module coverage
                current_score = analysis_summary.get("overall_score", 1.0)
                # Penalize for low module coverage (each missing module reduces score)
                modules_with_zero_coverage = sum(1 for m in module_breakdown if m["coverage"] == 0)
                total_modules = len(module_breakdown)
                
                if total_modules > 0:
                    # Penalty: 0.15 per module with zero coverage, up to 0.5 max penalty
                    coverage_penalty = min(0.5, (modules_with_zero_coverage / total_modules) * 0.5)
                    # Also penalize for low average coverage
                    if avg_coverage < 0.5:
                        coverage_penalty += (0.5 - avg_coverage) * 0.3
                    
                    adjusted_score = max(0.0, current_score - coverage_penalty)
                    analysis_summary["overall_score"] = round(adjusted_score, 2)
                    
                    # Update quality status based on adjusted score
                    if adjusted_score < 0.4:
                        quality_status = "poor"
                    elif adjusted_score < 0.6:
                        quality_status = "fair"
                    elif adjusted_score < 0.8:
                        quality_status = "good"
                    else:
                        quality_status = "excellent"
                    analysis_summary["quality_status"] = quality_status

                if avg_coverage < 0.6:
                    analysis_summary.setdefault("recommendations", []).append(
                        f"Module coverage below VTU expectations ({round(avg_coverage * 100)}%). Include questions from underrepresented modules."
                    )
                
                if modules_with_zero_coverage > 0:
                    zero_modules = [m["module_number"] for m in module_breakdown if m["coverage"] == 0]
                    analysis_summary.setdefault("recommendations", []).append(
                        f"No questions found for {len(zero_modules)} module(s): {', '.join(zero_modules)}. Add questions covering these modules."
                    )
        
        # Create scrutiny result
        with transaction.atomic():
            scrutiny_result = ScrutinyResult.objects.create(
                request_obj=request_obj,
                summary=analysis_result.get('summary', {})
            )
        
        logger.info(f"Automatic scrutiny completed for request {request_obj.id}")
        return scrutiny_result
        
    except Exception as e:
        logger.exception(f"Error in automatic scrutiny for request {request_obj.id}: {e}")
        # Create a basic scrutiny result with error information
        try:
            with transaction.atomic():
                scrutiny_result = ScrutinyResult.objects.create(
                    request_obj=request_obj,
                    summary={
                        "error": str(e),
                        "num_questions": 0,
                        "overall_score": 0.0,
                        "recommendations": ["Analysis failed due to technical error"]
                    }
                )
            return scrutiny_result
        except Exception as create_error:
            logger.exception(f"Failed to create error scrutiny result: {create_error}")
            return None

def get_scrutiny_summary_for_dashboard() -> dict:
    """
    Get summary statistics for the COE dashboard.
    """
    try:
        total_papers = ScrutinyResult.objects.count()
        
        if total_papers == 0:
            return {
                "total_papers": 0,
                "average_score": 0.0,
                "papers_needing_review": 0,
                "plagiarism_issues": 0,
                "quality_distribution": {"excellent": 0, "good": 0, "fair": 0, "poor": 0}
            }
        
        # Calculate statistics
        results = ScrutinyResult.objects.all()
        
        scores = []
        papers_needing_review = 0
        plagiarism_issues = 0
        quality_distribution = {"excellent": 0, "good": 0, "fair": 0, "poor": 0}
        
        for result in results:
            summary = result.summary
            score = summary.get('overall_score', 0.0)
            scores.append(score)
            
            # Count papers needing review (low score or plagiarism issues)
            if score < 0.6:
                papers_needing_review += 1
            
            # Count plagiarism issues
            plagiarism_score = summary.get('plagiarism_analysis', {}).get('plagiarism_score', 0.0)
            if plagiarism_score > 0.3:
                plagiarism_issues += 1
            
            # Quality distribution
            if score >= 0.8:
                quality_distribution["excellent"] += 1
            elif score >= 0.6:
                quality_distribution["good"] += 1
            elif score >= 0.4:
                quality_distribution["fair"] += 1
            else:
                quality_distribution["poor"] += 1
        
        average_score = sum(scores) / len(scores) if scores else 0.0
        
        return {
            "total_papers": total_papers,
            "average_score": round(average_score * 100, 1),
            "papers_needing_review": papers_needing_review,
            "plagiarism_issues": plagiarism_issues,
            "quality_distribution": quality_distribution
        }
        
    except Exception as e:
        logger.exception(f"Error getting scrutiny summary: {e}")
        return {
            "total_papers": 0,
            "average_score": 0.0,
            "papers_needing_review": 0,
            "plagiarism_issues": 0,
            "quality_distribution": {"excellent": 0, "good": 0, "fair": 0, "poor": 0}
        }
