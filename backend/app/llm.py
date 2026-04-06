from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
import random
import requests
from typing import Any


DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"


class LLMError(RuntimeError):
    pass


def _extract_json_block(text: str) -> dict[str, Any]:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise LLMError("Model did not return valid JSON.")

    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError as error:
        raise LLMError("Model returned malformed JSON.") from error


def _call_deepseek(prompt: str, system: str) -> dict[str, Any]:
    """Call DeepSeek API"""
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",  # Use deepseek-reasoner for R1 reasoning
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }
    
    try:
        response = requests.post(DEEPSEEK_API_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        result = response.json()
        # Extract the JSON from the assistant's response
        content = result["choices"][0]["message"]["content"]
        return json.loads(content)
    except Exception as e:
        raise LLMError(f"DeepSeek API error: {e}")


def generate_flawed_task(
    *,
    title: str,
    subject: str,
    source_text: str,
    error_density: int,
) -> dict[str, Any]:
    error_count = {1: 3, 2: 4, 3: 5}.get(error_density, 4)
    system = (
        "You create flawed educational passages for a fact-checking classroom exercise. "
        "Return strict JSON only."
    )
    prompt = f"""
Create a classroom task called "{title}" for subject "{subject}".

Based on the source material below, rewrite it into exactly 3 short paragraphs in natural English.
Intentionally insert exactly {error_count} wrong sentences across the passage.
Each wrong sentence must contain one major error only.
Every wrong sentence must appear verbatim inside the paragraphs and must also appear verbatim in the highlights array.

Rules:
- Keep the passage plausible and readable.
- Errors must be distributed across the passage.
- Each highlight text must be the entire wrong sentence, not a fragment.
- Error types must be one of: "Logical Error", "Factual Error", "AI Hallucination".
- The number of highlight objects must be exactly {error_count}.
- Exactly one highlight may have "isGolden": true when density is 3, otherwise false for all.
- Paragraph text should not contain HTML.
- Use paragraphIndex 0, 1, or 2.
- Output JSON only with this shape:
{{
  "paragraphs": ["..."],
  "highlights": [
    {{
      "text": "...",
      "errorType": "Logical Error",
      "canonicalReason": "...",
      "explanation": "...",
      "paragraphIndex": 0,
      "isGolden": false
    }}
  ]
}}

Source material:
{source_text}
"""
    return _call_deepseek(prompt=prompt, system=system)

def judge_annotation(
    *,
    title: str,
    flawed_text: str,
    canonical_reason: str,
    canonical_type: str,
    student_error_type: str,
    student_reason: str,
) -> dict[str, Any]:
    system = (
        "You are an educational grader. Grade whether a student's explanation correctly identifies "
        "the flaw in a passage. Return strict JSON only."
    )
    prompt = f"""
Task title: {title}
Flawed sentence or phrase: {flawed_text}
Canonical error type: {canonical_type}
Canonical explanation: {canonical_reason}
Student selected error type: {student_error_type}
Student explanation: {student_reason}

Return JSON only with this exact shape:
{{
  "isCorrect": true,
  "feedback": "One short sentence for the student.",
  "confidence": 0.0
}}

Grading rules:
- Mark true when the student's explanation substantially captures the same problem, even if wording is informal.
- Small wording differences are acceptable.
- If the student selects the wrong error type but the reason is still clearly correct, you may still mark true.
- If the explanation is vague, off-topic, or contradicts the canonical explanation, mark false.
"""
    return _call_deepseek(prompt=prompt, system=system)

def fallback_generate_flawed_task(
    *,
    source_text: str,
    error_density: int,
) -> dict[str, Any]:
    error_count = {1: 3, 2: 4, 3: 5}.get(error_density, 4)
    base_sentences = _split_sentences(source_text)
    while len(base_sentences) < error_count + 1:
        base_sentences.append(base_sentences[-1] if base_sentences else "This lesson changed history.")

    paragraphs: list[str] = []
    highlights: list[dict[str, Any]] = []
    working_sentences = base_sentences[:]

    for index in range(min(error_count, len(working_sentences))):
        mutated_sentence, error_type, reason = _mutate_sentence(working_sentences[index], index)
        working_sentences[index] = mutated_sentence
        highlights.append(
            {
                "highlightId": index + 1,
                "text": mutated_sentence,
                "errorType": error_type,
                "canonicalReason": reason,
                "explanation": reason,
                "paragraphIndex": 0,
                "isGolden": error_density == 3 and index == 0,
            }
        )

    chunk_size = max(1, (len(working_sentences) + 2) // 3)
    for index in range(0, len(working_sentences), chunk_size):
        paragraphs.append(" ".join(working_sentences[index:index + chunk_size]).strip())

    for highlight in highlights:
        for paragraph_index, paragraph in enumerate(paragraphs):
            if highlight["text"] in paragraph:
                highlight["paragraphIndex"] = paragraph_index
                break

    return {
        "paragraphs": paragraphs,
        "highlights": highlights,
    }


def _split_sentences(text: str) -> list[str]:
    sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", text.strip()) if sentence.strip()]
    if sentences:
        return sentences

    clauses = [clause.strip() for clause in re.split(r",\s*", text.strip()) if clause.strip()]
    return [f"{clause}." if clause[-1] not in ".!?" else clause for clause in clauses]


def _mutate_sentence(sentence: str, index: int) -> tuple[str, str, str]:
    # Cycle through error types
    error_types = ["Factual Error", "Logical Error", "AI Hallucination"]
    error_type = error_types[index % 3]
    
    # 1. Flip logical words (works for any subject)
    logical_pairs = [
        ("always", "never"),
        ("all", "none"),
        ("increases", "decreases"),
        ("before", "after"),
        ("more", "less"),
        ("same", "different"),
        ("true", "false"),
        ("correct", "incorrect"),
        ("high", "low"),
        ("fast", "slow"),
        ("connected", "disconnected"),
        ("together", "separately"),
    ]
    for word1, word2 in logical_pairs:
        if word1 in sentence.lower():
            return (
                sentence.replace(word1, word2, 1),
                "Logical Error",
                f"This reverses the correct relationship.",
            )
        if word2 in sentence.lower():
            return (
                sentence.replace(word2, word1, 1),
                "Logical Error",
                f"This reverses the correct relationship.",
            )
    
    # 2. Negate the sentence
    if " is " in sentence:
        return (
            sentence.replace(" is ", " is not ", 1),
            "Logical Error",
            "This negates a correct statement.",
        )
    
    if " are " in sentence:
        return (
            sentence.replace(" are ", " are not ", 1),
            "Logical Error",
            "This negates a correct statement.",
        )
    
    if " was " in sentence:
        return (
            sentence.replace(" was ", " was not ", 1),
            "Logical Error",
            "This negates a correct statement.",
        )
    
    # 3. Change factual claims (names, places, relationships)
    factual_pairs = [
        ("client", "server"),
        ("input", "output"),
        ("source", "destination"),
        ("sender", "receiver"),
        ("encryption", "decryption"),
        ("public", "private"),
        ("local", "global"),
        ("internal", "external"),
    ]
    for word1, word2 in factual_pairs:
        if word1 in sentence.lower():
            return (
                sentence.replace(word1, word2, 1),
                "Factual Error",
                f"This misidentifies the correct term. The source says '{word1}', not '{word2}'.",
            )
        if word2 in sentence.lower():
            return (
                sentence.replace(word2, word1, 1),
                "Factual Error",
                f"This misidentifies the correct term.",
            )
    
    # 4. Change amount/degree words
    amount_words = [
        ("majority", "minority"),
        ("most", "few"),
        ("many", "few"),
        ("large", "small"),
        ("significant", "insignificant"),
        ("common", "rare"),
        ("frequent", "infrequent"),
    ]
    for word1, word2 in amount_words:
        if word1 in sentence.lower():
            return (
                sentence.replace(word1, word2, 1),
                "Factual Error",
                f"This misrepresents the actual frequency or amount.",
            )
    
    # 5. Last resort - add a clear contradiction
    return (
        sentence.rstrip(".") + " This is incorrect.",
        "AI Hallucination",
        "This claim is not supported by the source material.",
    )

def build_simulated_study_guide(
    *,
    title: str,
    subject: str,
    source_text: str,
    highlights: list[dict[str, Any]],
) -> dict[str, Any]:
    base_sentences = _split_sentences(source_text)
    if not base_sentences:
        base_sentences = [f"{title} introduces core ideas in {subject}."]

    chunk_size = max(1, (len(base_sentences) + 2) // 3)
    section_titles = [
        "Core Concepts",
        "Cause And Effect",
        "Exam Review Notes",
    ]

    sections: list[dict[str, str]] = []
    for index, start in enumerate(range(0, len(base_sentences), chunk_size)):
        chunk = " ".join(base_sentences[start:start + chunk_size]).strip()
        if not chunk:
            continue
        sections.append(
            {
                "sectionTitle": section_titles[min(index, len(section_titles) - 1)],
                "content": chunk,
            }
        )

    references: list[dict[str, Any]] = []
    for highlight in highlights:
        excerpt = _find_best_reference_sentence(
            sentences=base_sentences,
            target_text=f"{highlight.get('text', '')} {highlight.get('canonicalReason', '')}",
        )
        concept_title = _build_concept_title(excerpt, subject)
        review_points = [
            f"Textbook anchor: {excerpt}",
            f"Why the AI was wrong: {highlight.get('canonicalReason', '')}",
            f"Review tip: compare the original concept with the flawed claim before answering exam questions.",
        ]
        references.append(
            {
                "highlightId": int(highlight["highlightId"]),
                "conceptTitle": concept_title,
                "textbookExcerpt": excerpt,
                "explanation": str(highlight.get("explanation") or highlight.get("canonicalReason") or "").strip(),
                "reviewPoints": review_points,
            }
        )

    return {
        "resourceTitle": f"{subject} Quick Review Notes",
        "overview": (
            f"These simulated lecture notes summarise the trustworthy textbook ideas behind {title}. "
            "Use them to revisit the concepts you missed and turn each AI mistake into a revision entry point."
        ),
        "sections": sections,
        "references": references,
    }


def _find_best_reference_sentence(*, sentences: list[str], target_text: str) -> str:
    target_words = set(re.findall(r"[a-zA-Z]{4,}", target_text.lower()))
    best_sentence = sentences[0]
    best_score = -1

    for sentence in sentences:
        sentence_words = set(re.findall(r"[a-zA-Z]{4,}", sentence.lower()))
        score = len(target_words & sentence_words)
        if score > best_score:
            best_score = score
            best_sentence = sentence

    return best_sentence


def _build_concept_title(sentence: str, subject: str) -> str:
    words = [word for word in re.findall(r"[A-Za-z]+", sentence) if len(word) > 2]
    if not words:
        return f"{subject} checkpoint"

    title_words = words[:4]
    return " ".join(word.capitalize() for word in title_words)
