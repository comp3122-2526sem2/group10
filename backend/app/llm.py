from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from typing import Any


OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")


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


def _call_ollama(prompt: str, system: str) -> dict[str, Any]:
    payload = json.dumps(
        {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.2,
                "num_predict": 600,
            },
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        url=f"{OLLAMA_URL}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError) as error:
        raise LLMError(
            "Unable to reach Ollama. Make sure Ollama is installed, running, and the model is pulled."
        ) from error

    if "response" not in body:
        raise LLMError("Unexpected Ollama response payload.")

    return _extract_json_block(body["response"])


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
    return _call_ollama(prompt=prompt, system=system)


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
    return _call_ollama(prompt=prompt, system=system)


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
    numeric_match = re.search(r"\b(\d{3,4})\b", sentence)
    if numeric_match:
        original = numeric_match.group(1)
        replacement = str(int(original) + 120)
        return (
            sentence.replace(original, replacement, 1),
            "Factual Error",
            f"The original source does not support the changed year or number {replacement}.",
        )

    if "century" in sentence.lower():
        mutated = re.sub(r"late 18th century", "late 15th century", sentence, flags=re.IGNORECASE)
        if mutated != sentence:
            return (
                mutated,
                "Factual Error",
                "The timing is wrong. The Industrial Revolution began in the late 18th century, not the late 15th century.",
            )

    replacements = [
        ("Britain", "France", "Factual Error", "The source identifies Britain as the starting point, not France."),
        ("steam power", "solar power", "AI Hallucination", "Steam power was central in the original material, while solar power is an invented substitution here."),
        ("mechanization", "manual copying", "Logical Error", "The sentence reverses the role of mechanization in industrial production."),
        ("global trade", "strict local isolation", "Logical Error", "The source says the Industrial Revolution expanded trade rather than isolating markets."),
        ("urbanization", "mass return to isolated farms", "AI Hallucination", "This inserts a claim that contradicts the source and reads like an unsupported hallucination."),
    ]

    replacement = replacements[index % len(replacements)]
    if replacement[0] in sentence:
        return (
            sentence.replace(replacement[0], replacement[1], 1),
            replacement[2],
            replacement[3],
        )

    if "transformed" in sentence:
        return (
            sentence.replace("transformed", "completely blocked", 1),
            "Logical Error",
            "The source says the development transformed production, so saying it blocked change reverses the meaning.",
        )

    return (
        sentence.rstrip(".") + " because it was first powered by personal smartphones.",
        "AI Hallucination",
        "The added claim about personal smartphones is invented and not supported by the source.",
    )
