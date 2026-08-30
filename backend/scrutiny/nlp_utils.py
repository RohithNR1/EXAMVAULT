import os
import re
import logging
import hashlib
import difflib
from collections import Counter
from typing import Dict, List, Tuple, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.tag import pos_tag

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
except:
    pass

# Check if required libraries are available
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not available. Some features will be limited.")

try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize, sent_tokenize
    from nltk.stem import WordNetLemmatizer
    from nltk.tag import pos_tag
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False
    logger.warning("NLTK not available. Some features will be limited.")

logger = logging.getLogger(__name__)

# Bloom's Taxonomy keywords for classification
BLOOM_KEYWORDS = {
    'remember': ['define', 'identify', 'list', 'name', 'recall', 'recognize', 'state', 'what', 'when', 'where', 'who'],
    'understand': ['explain', 'describe', 'interpret', 'summarize', 'classify', 'compare', 'contrast', 'demonstrate'],
    'apply': ['apply', 'use', 'solve', 'demonstrate', 'illustrate', 'calculate', 'compute', 'implement'],
    'analyze': ['analyze', 'examine', 'investigate', 'compare', 'contrast', 'differentiate', 'distinguish'],
    'evaluate': ['evaluate', 'judge', 'critique', 'assess', 'appraise', 'justify', 'defend', 'argue'],
    'create': ['create', 'design', 'develop', 'construct', 'formulate', 'generate', 'produce', 'build']
}

# Difficulty indicators
DIFFICULTY_INDICATORS = {
    'easy': ['simple', 'basic', 'easy', 'straightforward', 'obvious', 'clear'],
    'medium': ['moderate', 'intermediate', 'standard', 'typical', 'common'],
    'hard': ['complex', 'difficult', 'challenging', 'advanced', 'sophisticated', 'intricate']
}

def extract_text_from_pdf(path):
    """
    Try PyMuPDF if available, otherwise fallback to simple read (may not work for binary pdfs).
    """
    try:
        import fitz
        doc = fitz.open(path)
        text = []
        for page in doc:
            text.append(page.get_text("text"))
        return "\n".join(text)
    except Exception as e:
        logger.warning("extract_text_from_pdf: fitz not available or failed: %s", e)
        try:
            with open(path, "rb") as f:
                raw = f.read()
                try:
                    return raw.decode("latin1")
                except Exception:
                    return ""
        except Exception:
            return ""

def split_into_questions(text):
    """
    Improved question extraction: detects numbered questions, questions ending with ?, 
    and questions starting with common question words.
    """
    if not text:
        return []
    # Normalize newlines and whitespace
    text = re.sub(r'\r\n', '\n', text)
    text = re.sub(r'\n+', '\n', text)
    
    questions = []
    
    # Pattern 1: Questions ending with question mark
    qmark_parts = re.split(r'([^?]+\?)', text)
    for part in qmark_parts:
        part = re.sub(r'\s+', ' ', part).strip()
        if len(part) > 10 and part.endswith('?'):
            questions.append(part)
    
    # Pattern 2: Numbered questions (e.g., "1 a", "2 b", "Module-4 1.", etc.)
    # Match patterns like: number + optional letter + question text
    numbered_pattern = re.compile(
        r'(?:^|\n)(?:Module[-\s]*\d+[^\n]*\n)?\s*(\d+)\s*([a-z])?\s*[\.\)]?\s*([^\n]{20,}?)(?=\n\s*\d+\s*[a-z]?\s*[\.\)]|\n\s*Module[-\s]*\d+|$)',
        re.IGNORECASE | re.MULTILINE
    )
    
    for match in numbered_pattern.finditer(text):
        question_num = match.group(1)
        question_letter = match.group(2) or ''
        question_text = match.group(3).strip()
        
        # Clean up the question text
        question_text = re.sub(r'\s+', ' ', question_text)
        question_text = question_text.strip()
        
        # Skip if too short or looks like a header
        if len(question_text) < 15:
            continue
        if question_text.lower().startswith(('module', 'or', 'note:', 'total')):
            continue
        
        # Construct full question identifier
        full_question = f"{question_num}{question_letter}. {question_text}".strip()
        if len(full_question) > 20:
            questions.append(full_question)
    
    # Pattern 3: Questions starting with common question words (if not already captured)
    question_starters = r'(?:^|\n)\s*(Explain|Describe|Define|List|Discuss|Compare|Analyze|Evaluate|Design|Apply|Illustrate|Distinguish|Determine|Write|How|What|Why|When|Where)'
    starter_matches = re.finditer(question_starters + r'[^\n]{20,}', text, re.IGNORECASE | re.MULTILINE)
    for match in starter_matches:
        q_text = match.group(0).strip()
        q_text = re.sub(r'\s+', ' ', q_text)
        if len(q_text) > 20 and q_text not in questions:
            questions.append(q_text)
    
    # Remove duplicates and very short entries
    seen = set()
    out = []
    for q in questions:
        q_clean = re.sub(r'\s+', ' ', q).strip()
        # Normalize for comparison (remove numbers/letters at start)
        q_normalized = re.sub(r'^\d+[a-z]?\.?\s*', '', q_clean, flags=re.IGNORECASE).lower()
        if q_normalized not in seen and len(q_clean) > 15:
            seen.add(q_normalized)
            out.append(q_clean)
    
    return out

def classify_bloom_taxonomy(question: str) -> Dict[str, float]:
    """
    Classify question based on Bloom's Taxonomy using keyword matching and NLP.
    Returns confidence scores for each level.
    """
    question_lower = question.lower()
    scores = {level: 0.0 for level in BLOOM_KEYWORDS.keys()}
    
    # Keyword-based scoring
    for level, keywords in BLOOM_KEYWORDS.items():
        for keyword in keywords:
            if keyword in question_lower:
                scores[level] += 1.0
    
    # Normalize scores
    total_score = sum(scores.values())
    if total_score > 0:
        scores = {k: v/total_score for k, v in scores.items()}
    
    return scores

def estimate_difficulty(question: str) -> Dict[str, Any]:
    """
    Estimate question difficulty based on various linguistic features.
    """
    difficulty_score = 0.5  # Default medium difficulty
    
    question_lower = question.lower()
    
    # Check for difficulty indicators
    for level, indicators in DIFFICULTY_INDICATORS.items():
        for indicator in indicators:
            if indicator in question_lower:
                if level == 'easy':
                    difficulty_score -= 0.2
                elif level == 'hard':
                    difficulty_score += 0.2
    
    # Sentence length analysis
    if NLTK_AVAILABLE:
        try:
            sentences = sent_tokenize(question)
            avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
        except:
            # Fallback to simple sentence counting
            sentences = question.split('.')
            avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
    else:
        # Fallback to simple sentence counting
        sentences = question.split('.')
        avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
    
    if avg_sentence_length > 20:
        difficulty_score += 0.1
    elif avg_sentence_length < 10:
        difficulty_score -= 0.1
    
    # Word complexity (average word length)
    if NLTK_AVAILABLE:
        try:
            words = word_tokenize(question)
            avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
        except:
            # Fallback to simple word splitting
            words = question.split()
            avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
    else:
        # Fallback to simple word splitting
        words = question.split()
        avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
    
    if avg_word_length > 6:
        difficulty_score += 0.1
    elif avg_word_length < 4:
        difficulty_score -= 0.1
    
    # Clamp between 0 and 1
    difficulty_score = max(0, min(1, difficulty_score))
    
    # Convert to categorical
    if difficulty_score < 0.33:
        difficulty_level = "easy"
    elif difficulty_score < 0.66:
        difficulty_level = "medium"
    else:
        difficulty_level = "hard"
    
    return {
        "level": difficulty_level,
        "score": difficulty_score,
        "features": {
            "avg_sentence_length": avg_sentence_length,
            "avg_word_length": avg_word_length
        }
    }

def detect_plagiarism_and_duplicates(questions: List[str], existing_questions: List[str] = None) -> Dict[str, Any]:
    """
    Detect potential plagiarism and duplicate questions using text similarity.
    """
    plagiarism_results = {
        "duplicates": [],
        "similar_questions": [],
        "plagiarism_score": 0.0
    }
    
    if len(questions) < 2:
        return plagiarism_results
    
    # Check for duplicates within the same paper
    for i, q1 in enumerate(questions):
        for j, q2 in enumerate(questions[i+1:], i+1):
            similarity = difflib.SequenceMatcher(None, q1.lower(), q2.lower()).ratio()
            if similarity > 0.8:
                plagiarism_results["duplicates"].append({
                    "question1_index": i,
                    "question2_index": j,
                    "similarity": similarity,
                    "question1": q1[:100] + "..." if len(q1) > 100 else q1,
                    "question2": q2[:100] + "..." if len(q2) > 100 else q2
                })
    
    # Check against existing questions if provided
    if existing_questions and SKLEARN_AVAILABLE:
        try:
            vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
            
            for i, question in enumerate(questions):
                similarities = []
                for existing_q in existing_questions:
                    try:
                        tfidf_matrix = vectorizer.fit_transform([question, existing_q])
                        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
                        similarities.append(similarity)
                    except:
                        continue
                
                if similarities:
                    max_similarity = max(similarities)
                    if max_similarity > 0.7:
                        plagiarism_results["similar_questions"].append({
                            "question_index": i,
                            "similarity": max_similarity,
                            "question": question[:100] + "..." if len(question) > 100 else question
                        })
        except Exception as e:
            logger.warning(f"Advanced plagiarism detection failed: {e}")
    
    # Calculate overall plagiarism score
    total_questions = len(questions)
    duplicate_count = len(plagiarism_results["duplicates"])
    similar_count = len(plagiarism_results["similar_questions"])
    
    plagiarism_results["plagiarism_score"] = (duplicate_count + similar_count) / max(total_questions, 1)
    
    return plagiarism_results

def extract_question_tags(question: str) -> List[str]:
    """
    Extract meaningful tags from a question using NLP.
    """
    if NLTK_AVAILABLE:
        try:
            # Tokenize and tag parts of speech
            tokens = word_tokenize(question.lower())
            pos_tags = pos_tag(tokens)
            
            # Extract nouns and adjectives as potential tags
            tags = []
            for word, pos in pos_tags:
                if pos in ['NN', 'NNS', 'NNP', 'NNPS', 'JJ', 'JJR', 'JJS'] and len(word) > 3:
                    tags.append(word)
            
            # Remove stopwords
            stop_words = set(stopwords.words('english'))
            tags = [tag for tag in tags if tag not in stop_words]
            
            # Return top 5 most relevant tags
            return list(set(tags))[:5]
        except Exception as e:
            logger.warning(f"NLTK tag extraction failed: {e}")
    
    # Fallback to simple word extraction
    words = re.findall(r'\b[A-Za-z]{4,}\b', question.lower())
    stop_words = set(["the", "and", "for", "with", "that", "this", "from", "have", "are", "using", "use", "what", "how", "why", "when", "where"])
    return [w for w in words if w not in stop_words][:5]

def analyze_file(path, existing_questions: List[str] = None):
    """
    Comprehensive analysis with NLP/ML features for automatic scrutiny.
    Returns detailed analysis including Bloom taxonomy, difficulty, plagiarism detection.
    """
    logger.debug("scrutiny.analyze_file called for path=%s", path)
    
    analysis_result = {
        "summary": {
            "num_questions": 0,
            "sample_questions": [],
            "tags": [],
            "notes": [],
            "bloom_distribution": {},
            "difficulty_distribution": {},
            "plagiarism_analysis": {},
            "overall_score": 0.0,
            "recommendations": [],
            "questions": []
        }
    }
    
    try:
        ext = os.path.splitext(path)[1].lower()
        text = ""
        if ext in (".pdf",):
            text = extract_text_from_pdf(path)
        else:
            try:
                with open(path, "r", encoding="utf-8") as f:
                    text = f.read()
            except Exception:
                text = extract_text_from_pdf(path)

        questions = split_into_questions(text)
        analysis_result["summary"]["num_questions"] = len(questions)
        analysis_result["summary"]["sample_questions"] = questions[:5]
        
        if not questions:
            analysis_result["summary"]["notes"].append("No questions detected in the document")
            return analysis_result
        
        # Analyze each question
        bloom_scores = []
        difficulty_scores = []
        all_tags = []
        
        question_reports = []

        for question in questions:
            # Bloom taxonomy classification
            bloom_result = classify_bloom_taxonomy(question)
            bloom_scores.append(bloom_result)
            
            # Difficulty estimation
            difficulty_result = estimate_difficulty(question)
            difficulty_scores.append(difficulty_result)
            
            # Tag extraction
            tags = extract_question_tags(question)
            all_tags.extend(tags)

            question_reports.append(
                {
                    "text": question,
                    "bloom": bloom_result,
                    "difficulty": difficulty_result,
                    "tags": tags,
                }
            )
        
        # Calculate distributions
        bloom_distribution = {}
        for level in BLOOM_KEYWORDS.keys():
            bloom_distribution[level] = sum(score[level] for score in bloom_scores) / len(bloom_scores)
        
        difficulty_distribution = {}
        for level in ['easy', 'medium', 'hard']:
            difficulty_distribution[level] = sum(1 for d in difficulty_scores if d['level'] == level) / len(difficulty_scores)
        
        # Plagiarism detection
        plagiarism_analysis = detect_plagiarism_and_duplicates(questions, existing_questions)
        
        # Calculate overall quality score
        quality_score = 1.0
        quality_score -= plagiarism_analysis["plagiarism_score"] * 0.5  # Penalize plagiarism
        quality_score -= len(plagiarism_analysis["duplicates"]) * 0.1  # Penalize duplicates
        
        # Bonus for good Bloom distribution
        if bloom_distribution.get('analyze', 0) > 0.2 or bloom_distribution.get('evaluate', 0) > 0.2:
            quality_score += 0.1
        
        quality_score = max(0, min(1, quality_score))
        
        # Generate recommendations
        recommendations = []
        if plagiarism_analysis["plagiarism_score"] > 0.3:
            recommendations.append("High plagiarism detected. Review questions for originality.")
        if len(plagiarism_analysis["duplicates"]) > 0:
            recommendations.append("Duplicate questions found. Consider removing or modifying.")
        if bloom_distribution.get('remember', 0) > 0.5:
            recommendations.append("Too many basic recall questions. Include more analytical questions.")
        if difficulty_distribution.get('easy', 0) > 0.7:
            recommendations.append("Questions are too easy. Consider increasing difficulty.")
        if quality_score < 0.6:
            recommendations.append("Overall quality needs improvement.")
        
        # Compile final results
        analysis_result["summary"].update({
            "bloom_distribution": bloom_distribution,
            "difficulty_distribution": difficulty_distribution,
            "plagiarism_analysis": plagiarism_analysis,
            "overall_score": quality_score,
            "recommendations": recommendations,
            "tags": list(set(all_tags))[:10],  # Top 10 unique tags
            "questions": question_reports
        })
        
        return analysis_result
        
    except Exception as e:
        logger.exception("scrutiny.analyze_file failed: %s", e)
        analysis_result["summary"]["error"] = str(e)
        return analysis_result
