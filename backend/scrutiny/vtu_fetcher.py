import json
import logging
import os
import re
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from .nlp_utils import extract_text_from_pdf

logger = logging.getLogger(__name__)

VTU_BASE_URL = "https://vtu.ac.in"
DEFAULT_TIMEOUT = (10, 30)  # (connect, read)

MODULE_PATTERN = re.compile(
    r"(Module[\s-]*(\d+)[^\n]*)(.*?)(?=Module[\s-]*\d+|Practical Components|Course outcome|\Z)",
    re.IGNORECASE | re.DOTALL,
)


def _ensure_media_dir(*segments: str) -> str:
    """
    Ensure a directory exists inside MEDIA_ROOT and return relative path.
    """
    relative_dir = os.path.join(*segments)
    full_dir = os.path.join(settings.MEDIA_ROOT, relative_dir)
    os.makedirs(full_dir, exist_ok=True)
    return relative_dir


def _download_binary(url: str) -> bytes:
    logger.info("Downloading VTU resource from %s", url)
    response = requests.get(url, timeout=DEFAULT_TIMEOUT)
    response.raise_for_status()
    return response.content


def _sanitize_filename(name: str) -> str:
    name = re.sub(r"[\\/:*?\"<>|]+", "-", name)
    name = re.sub(r"\s+", "_", name.strip())
    return name


def _save_binary(content: bytes, relative_path: str) -> str:
    if default_storage.exists(relative_path):
        default_storage.delete(relative_path)
    default_storage.save(relative_path, ContentFile(content))
    return relative_path


def _extract_modules(text: str) -> List[Dict[str, str]]:
    modules_map: Dict[str, Dict[str, str]] = {}
    for match in MODULE_PATTERN.finditer(text):
        header = match.group(1).strip()
        module_number = match.group(2).strip()
        description = match.group(3).strip()
        clean_description = re.sub(r"\s+", " ", description)

        key = module_number.lower()

        if key in modules_map:
            existing = modules_map[key]
            merged_description = f"{existing['description']} {clean_description}".strip()
            modules_map[key]["description"] = re.sub(r"\s+", " ", merged_description)
        else:
            modules_map[key] = {
                "module_number": module_number,
                "title": header,
                "description": clean_description,
            }
    return list(modules_map.values())


def _extract_course_outcomes(text: str) -> List[str]:
    outcomes_section = re.search(
        r"Course outcome.*?:?(.*?)(Assessment Details|Suggested Learning Resources|$)",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not outcomes_section:
        return []

    block = outcomes_section.group(1)
    lines = [re.sub(r"\s+", " ", line).strip("-• ") for line in block.splitlines()]
    return [line for line in lines if len(line) > 3]


def fetch_vtu_syllabus(subject_code: str, syllabus_url: str) -> Dict[str, object]:
    """
    Download a VTU syllabus PDF, store it under media/vtu/syllabus, and extract metadata.
    """
    content = _download_binary(syllabus_url)

    storage_dir = _ensure_media_dir("vtu", "syllabus", subject_code)
    parsed_url = urlparse(syllabus_url)
    filename = _sanitize_filename(os.path.basename(parsed_url.path) or f"{subject_code}.pdf")
    relative_path = os.path.join(storage_dir, filename)
    saved_path = _save_binary(content, relative_path)

    try:
        storage_path = default_storage.path(saved_path)
        text = extract_text_from_pdf(storage_path)
    except (AttributeError, NotImplementedError):
        with default_storage.open(saved_path, "rb") as stored_file:
            tmp_path = os.path.join(settings.MEDIA_ROOT, "_tmp_syllabus.pdf")
            with open(tmp_path, "wb") as tmp:
                tmp.write(stored_file.read())
            text = extract_text_from_pdf(tmp_path)
            try:
                os.remove(tmp_path)
            except OSError:
                pass

    modules = _extract_modules(text)
    outcomes = _extract_course_outcomes(text)

    metadata = {
        "subject_code": subject_code,
        "source_url": syllabus_url,
        "stored_path": saved_path,
        "num_modules": len(modules),
        "modules": modules,
        "course_outcomes": outcomes,
    }

    metadata_relative_path = os.path.join(storage_dir, f"{subject_code}_syllabus.json")
    _save_binary(json.dumps(metadata, indent=2).encode("utf-8"), metadata_relative_path)
    metadata["metadata_path"] = metadata_relative_path

    logger.info("Fetched syllabus for %s with %d modules", subject_code, len(modules))
    return metadata


def _parse_question_links(index_html: str, base_url: str, subject_code: Optional[str] = None) -> List[Tuple[str, str]]:
    soup = BeautifulSoup(index_html, "html.parser")
    links: List[Tuple[str, str]] = []

    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        if not href.lower().endswith(".pdf"):
            continue

        title_text = anchor.get_text(strip=True)
        absolute_url = urljoin(base_url, href)

        if subject_code and subject_code.lower() not in href.lower():
            if subject_code.lower() not in title_text.lower():
                continue

        links.append((title_text or os.path.basename(href), absolute_url))

    return links


def fetch_vtu_question_papers(
    subject_code: str, index_url: str, limit: int = 5
) -> List[Dict[str, str]]:
    """
    Fetch VTU model question papers for a subject from the listing page.
    """
    response = requests.get(index_url, timeout=DEFAULT_TIMEOUT)
    response.raise_for_status()

    links = _parse_question_links(response.text, index_url, subject_code)
    if not links:
        logger.warning("No question paper links found for %s at %s", subject_code, index_url)
        return []

    storage_dir = _ensure_media_dir("vtu", "question_papers", subject_code)

    results: List[Dict[str, str]] = []
    for title, link in links[:limit]:
        try:
            content = _download_binary(link)
        except Exception as exc:
            logger.warning("Failed to download %s (%s): %s", title, link, exc)
            continue

        filename = _sanitize_filename(title or os.path.basename(link)) + ".pdf"
        relative_path = os.path.join(storage_dir, filename)
        saved_path = _save_binary(content, relative_path)

        results.append(
            {
                "title": title,
                "source_url": link,
                "stored_path": saved_path,
            }
        )

    logger.info("Fetched %d VTU question papers for %s", len(results), subject_code)
    return results


def sync_vtu_resources(subject_code: str, syllabus_url: str, question_index_url: Optional[str] = None) -> Dict[str, object]:
    """
    Fetch syllabus and question paper resources for the given subject.
    """
    result: Dict[str, object] = {
        "subject_code": subject_code,
        "syllabus": None,
        "question_papers": [],
    }

    try:
        result["syllabus"] = fetch_vtu_syllabus(subject_code, syllabus_url)
    except Exception as exc:
        logger.exception("Failed to fetch syllabus for %s: %s", subject_code, exc)
        result["syllabus_error"] = str(exc)

    if question_index_url:
        try:
            result["question_papers"] = fetch_vtu_question_papers(subject_code, question_index_url)
        except Exception as exc:
            logger.exception("Failed to fetch question papers for %s: %s", subject_code, exc)
            result["question_paper_error"] = str(exc)

    return result


def load_syllabus_metadata(subject_code: str) -> Optional[Dict[str, object]]:
    """
    Load stored syllabus metadata for the given subject if available.
    """
    metadata_path = os.path.join("vtu", "syllabus", subject_code, f"{subject_code}_syllabus.json")
    if not default_storage.exists(metadata_path):
        return None

    with default_storage.open(metadata_path, "r") as metadata_file:
        try:
            return json.load(metadata_file)
        except json.JSONDecodeError:
            logger.warning("Corrupted syllabus metadata for %s", subject_code)
            return None

