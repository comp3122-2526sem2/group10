from __future__ import annotations

import html
import os
import re
from typing import Any
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .db import bootstrap, get_connection, utc_now
from .llm import LLMError, fallback_generate_flawed_task, generate_flawed_task, judge_annotation


bootstrap()

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app = FastAPI(title="Debunk AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def make_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:10]}"


def create_session(user_id: str) -> str:
    token = uuid4().hex
    with get_connection() as connection:
        connection.execute(
            "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, user_id, utc_now()),
        )
    return token


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip().lower()


def build_content_html(paragraphs: list[str], highlights: list[dict[str, Any]]) -> str:
    highlighted_by_paragraph: dict[int, list[dict[str, Any]]] = {}
    for highlight in highlights:
        paragraph_index = int(highlight.get("paragraphIndex", 0))
        highlighted_by_paragraph.setdefault(paragraph_index, []).append(highlight)

    html_parts: list[str] = []
    for index, paragraph in enumerate(paragraphs):
        items = highlighted_by_paragraph.get(index, [])
        if not items:
            html_parts.append(f"<p>{html.escape(paragraph)}</p>")
            continue

        cursor = 0
        rendered: list[str] = []
        ordered_items = sorted(items, key=lambda item: paragraph.find(item["text"]))

        for item in ordered_items:
            snippet = item["text"]
            position = paragraph.find(snippet, cursor)
            if position == -1:
                raise ValueError(f'Highlight snippet "{snippet}" was not found in paragraph {index}.')

            rendered.append(html.escape(paragraph[cursor:position]))
            rendered.append(
                '<span data-highlight-id="{highlight_id}" data-golden="{is_golden}">{text}</span>'.format(
                    highlight_id=item["highlightId"],
                    is_golden=str(bool(item.get("isGolden", False))).lower(),
                    text=html.escape(snippet),
                )
            )
            cursor = position + len(snippet)

        rendered.append(html.escape(paragraph[cursor:]))
        html_parts.append(f"<p>{''.join(rendered)}</p>")

    return "".join(html_parts)


def ensure_valid_generation(raw_result: dict[str, Any], density: int) -> dict[str, Any]:
    paragraphs = [str(item).strip() for item in raw_result.get("paragraphs", []) if str(item).strip()]
    highlights = raw_result.get("highlights", [])
    if len(paragraphs) < 2:
        raise ValueError("Model returned too few paragraphs.")

    expected_errors = {1: 3, 2: 4, 3: 5}.get(density, 4)
    if len(highlights) < 2:
        raise ValueError("Model returned too few highlights.")

    normalized_highlights: list[dict[str, Any]] = []
    seen_texts: set[str] = set()
    for highlight in highlights:
        text = str(highlight.get("text", "")).strip()
        error_type = str(highlight.get("errorType", "")).strip() or "Factual Error"
        canonical_reason = str(highlight.get("canonicalReason", "")).strip()
        explanation = str(highlight.get("explanation", "")).strip() or canonical_reason
        paragraph_index = int(highlight.get("paragraphIndex", 0))
        normalized_text = normalize_text(text)
        if not text or not canonical_reason or normalized_text in seen_texts:
            continue

        seen_texts.add(normalized_text)
        normalized_highlights.append(
            {
                "highlightId": len(normalized_highlights) + 1,
                "text": text,
                "errorType": error_type,
                "canonicalReason": canonical_reason,
                "explanation": explanation,
                "paragraphIndex": max(0, min(paragraph_index, len(paragraphs) - 1)),
                "isGolden": bool(highlight.get("isGolden", False)) if density == 3 else False,
            }
        )
        if len(normalized_highlights) >= expected_errors:
            break

    if len(normalized_highlights) < 2:
        raise ValueError("Model returned incomplete highlight data.")

    if density != 3:
        for item in normalized_highlights:
            item["isGolden"] = False

    return {
        "paragraphs": paragraphs,
        "highlights": normalized_highlights,
    }


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token.")

    token = authorization.replace("Bearer ", "", 1)
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT users.*
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (token,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=401, detail="Invalid session.")
    return dict(row)


def require_role(user: dict[str, Any], allowed_roles: set[str]) -> dict[str, Any]:
    if user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions.")
    return user


class RegisterPayload(BaseModel):
    email: str
    password: str
    name: str
    role: str


class LoginPayload(BaseModel):
    email: str
    password: str


class GeneratePayload(BaseModel):
    title: str = "Untitled Fact-Check Task"
    subject: str = "General"
    sourceText: str
    density: int = Field(default=2, ge=1, le=3)


class PublishPayload(BaseModel):
    taskId: str
    title: str
    subject: str


class AnnotationPayload(BaseModel):
    taskId: str
    highlightId: int
    errorType: str
    reason: str


class ClassroomPayload(BaseModel):
    name: str


class TeacherAssignPayload(BaseModel):
    email: str


class InviteStudentsPayload(BaseModel):
    emails: list[str]


@app.get("/api/v1/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/auth/register")
def register(payload: RegisterPayload) -> dict[str, Any]:
    user_id = make_id("u")
    try:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO users (id, email, password, name, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, payload.email.lower(), payload.password, payload.name, payload.role, utc_now()),
            )
    except Exception as error:
        raise HTTPException(status_code=400, detail="Unable to register user.") from error

    token = create_session(user_id)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": payload.name,
            "role": payload.role,
        },
    }


@app.post("/api/v1/auth/login")
def login(payload: LoginPayload) -> dict[str, Any]:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE email = ? AND password = ?",
            (payload.email.lower(), payload.password),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user = dict(row)
    token = create_session(user["id"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "role": user["role"],
        },
    }


@app.get("/api/v1/auth/me")
def get_me(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return {
        "id": user["id"],
        "name": user["name"],
        "role": user["role"],
        "points": user["points"],
    }


@app.get("/api/v1/student/me")
def get_student_me(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return get_me(user)


@app.get("/api/v1/student/tasks")
def get_student_tasks(
    status: str = "pending",
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    require_role(user, {"student"})
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                tasks.id,
                tasks.subject,
                tasks.title,
                tasks.total_errors,
                COUNT(CASE WHEN annotations.is_correct = 1 THEN 1 END) AS found_errors
            FROM tasks
            LEFT JOIN annotations
                ON annotations.task_id = tasks.id
               AND annotations.student_id = ?
            WHERE tasks.status = 'published'
            GROUP BY tasks.id
            ORDER BY tasks.created_at DESC
            """,
            (user["id"],),
        ).fetchall()

    data: list[dict[str, Any]] = []
    for row in rows:
        found_errors = row["found_errors"] or 0
        task_status = "completed" if found_errors >= row["total_errors"] else "pending"
        if status and task_status != status:
            continue
        data.append(
            {
                "id": row["id"],
                "subject": row["subject"],
                "title": row["title"],
                "flawsCount": row["total_errors"],
                "locked": False,
                "status": task_status,
            }
        )
    return {"data": data}


@app.get("/api/v1/student/tasks/{task_id}")
def get_student_task_detail(task_id: str, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    require_role(user, {"student"})
    with get_connection() as connection:
        task = connection.execute(
            "SELECT * FROM tasks WHERE id = ? AND status = 'published'",
            (task_id,),
        ).fetchone()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found.")

        highlights = connection.execute(
            """
            SELECT
                task_highlights.highlight_id,
                task_highlights.text,
                EXISTS(
                    SELECT 1
                    FROM annotations
                    WHERE annotations.task_id = task_highlights.task_id
                      AND annotations.highlight_id = task_highlights.highlight_id
                      AND annotations.student_id = ?
                      AND annotations.is_correct = 1
                ) AS is_resolved
            FROM task_highlights
            WHERE task_highlights.task_id = ?
            ORDER BY task_highlights.highlight_id
            """,
            (user["id"], task_id),
        ).fetchall()

    found_errors = sum(1 for highlight in highlights if highlight["is_resolved"])
    return {
        "taskId": task["id"],
        "title": task["title"],
        "contentHtml": task["content_html"],
        "highlights": [
            {
                "highlightId": highlight["highlight_id"],
                "text": highlight["text"],
                "isResolved": bool(highlight["is_resolved"]),
            }
            for highlight in highlights
        ],
        "foundErrors": found_errors,
        "totalErrors": task["total_errors"],
    }


@app.post("/api/v1/student/annotations")
def submit_annotation(
    payload: AnnotationPayload,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    require_role(user, {"student"})
    with get_connection() as connection:
        highlight = connection.execute(
            """
            SELECT tasks.title, task_highlights.*
            FROM task_highlights
            JOIN tasks ON tasks.id = task_highlights.task_id
            WHERE task_highlights.task_id = ? AND task_highlights.highlight_id = ?
            """,
            (payload.taskId, payload.highlightId),
        ).fetchone()

        if highlight is None:
            raise HTTPException(status_code=404, detail="Highlight not found.")

        existing = connection.execute(
            """
            SELECT * FROM annotations
            WHERE task_id = ? AND highlight_id = ? AND student_id = ?
            """,
            (payload.taskId, payload.highlightId, user["id"]),
        ).fetchone()

    if existing is not None:
        return {
            "success": True,
            "pointsEarned": existing["points_earned"],
            "isCorrect": bool(existing["is_correct"]),
            "aiFeedback": existing["ai_feedback"],
            "message": "You have already submitted an annotation for this error.",
            "isGolden": bool(highlight["is_golden"]),
        }

    try:
        llm_result = judge_annotation(
            title=highlight["title"],
            flawed_text=highlight["text"],
            canonical_reason=highlight["canonical_reason"],
            canonical_type=highlight["error_type"],
            student_error_type=payload.errorType,
            student_reason=payload.reason,
        )
        is_correct = bool(llm_result.get("isCorrect", False))
        feedback = str(llm_result.get("feedback", "")).strip() or "Thanks for checking the AI output."
    except LLMError:
        type_matches = normalize_text(payload.errorType) == normalize_text(highlight["error_type"])
        canonical_words = set(normalize_text(highlight["canonical_reason"]).split())
        student_words = set(normalize_text(payload.reason).split())
        overlap = len(canonical_words & student_words)
        is_correct = type_matches or overlap >= 2
        feedback = (
            "Your explanation matches the core issue."
            if is_correct
            else "Your explanation does not yet match the stored issue."
        )

    points = 15 if is_correct and highlight["is_golden"] else 5 if is_correct else 0
    annotation_id = make_id("ann")
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO annotations (
                id, task_id, highlight_id, student_id, error_type, reason,
                is_correct, points_earned, ai_feedback, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                annotation_id,
                payload.taskId,
                payload.highlightId,
                user["id"],
                payload.errorType,
                payload.reason,
                int(is_correct),
                points,
                feedback,
                utc_now(),
            ),
        )
        if points:
            connection.execute(
                "UPDATE users SET points = points + ? WHERE id = ?",
                (points, user["id"]),
            )

    return {
        "success": True,
        "pointsEarned": points,
        "isCorrect": is_correct,
        "aiFeedback": feedback,
        "message": (
            "You hit the Golden Hallucination! Triple Points Awarded!"
            if is_correct and highlight["is_golden"]
            else "Successfully debunked the AI hallucination!"
            if is_correct
            else "Annotation saved, but the judge did not mark it as correct."
        ),
        "isGolden": bool(highlight["is_golden"]),
    }


@app.get("/api/v1/student/leaderboard")
def get_leaderboard(limit: int = 10, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    require_role(user, {"student", "teacher", "admin"})
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, name, points
            FROM users
            WHERE role = 'student'
            ORDER BY points DESC, created_at ASC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return {
        "data": [
            {
                "rank": index,
                "studentId": row["id"],
                "name": row["name"],
                "points": row["points"],
            }
            for index, row in enumerate(rows, start=1)
        ]
    }


@app.post("/api/v1/teacher/generate-flaws")
def generate_task_draft(
    payload: GeneratePayload,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    require_role(user, {"teacher", "admin"})

    try:
        raw_result = generate_flawed_task(
            title=payload.title,
            subject=payload.subject,
            source_text=payload.sourceText,
            error_density=payload.density,
        )
        result = ensure_valid_generation(raw_result, payload.density)
        content_html = build_content_html(result["paragraphs"], result["highlights"])
    except (LLMError, ValueError):
        result = fallback_generate_flawed_task(
            source_text=payload.sourceText,
            error_density=payload.density,
        )
        content_html = build_content_html(result["paragraphs"], result["highlights"])

    task_id = make_id("task")
    generated_text = "\n\n".join(result["paragraphs"])
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO tasks (
                id, title, subject, source_text, content_html,
                status, error_density, created_by, total_errors, created_at
            )
            VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)
            """,
            (
                task_id,
                payload.title,
                payload.subject,
                payload.sourceText,
                content_html,
                payload.density,
                user["id"],
                len(result["highlights"]),
                utc_now(),
            ),
        )
        connection.executemany(
            """
            INSERT INTO task_highlights (
                task_id, highlight_id, text, error_type, canonical_reason,
                explanation, is_golden, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    task_id,
                    item["highlightId"],
                    item["text"],
                    item["errorType"],
                    item["canonicalReason"],
                    item["explanation"],
                    int(item["isGolden"]),
                    utc_now(),
                )
                for item in result["highlights"]
            ],
        )

    return {
        "taskId": task_id,
        "title": payload.title,
        "subject": payload.subject,
        "generatedText": generated_text,
        "contentHtml": content_html,
        "highlights": result["highlights"],
        "totalErrors": len(result["highlights"]),
        "status": "Draft",
    }


@app.post("/api/v1/teacher/tasks")
def publish_task(payload: PublishPayload, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    require_role(user, {"teacher", "admin"})
    with get_connection() as connection:
        task = connection.execute("SELECT * FROM tasks WHERE id = ?", (payload.taskId,)).fetchone()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found.")

        connection.execute(
            """
            UPDATE tasks
            SET title = ?, subject = ?, status = 'published'
            WHERE id = ?
            """,
            (payload.title, payload.subject, payload.taskId),
        )
    return {"success": True, "taskId": payload.taskId}


@app.get("/api/v1/teacher/overview")
def get_teacher_overview(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    require_role(user, {"teacher", "admin"})
    with get_connection() as connection:
        active_students = connection.execute(
            "SELECT COUNT(*) AS count FROM users WHERE role = 'student'"
        ).fetchone()["count"]
        generated_tasks = connection.execute(
            "SELECT COUNT(*) AS count FROM tasks WHERE status = 'published'"
        ).fetchone()["count"]
        scores = connection.execute(
            """
            SELECT AVG(
                CASE
                    WHEN tasks.total_errors = 0 THEN 0
                    ELSE 100.0 * student_stats.correct_count / tasks.total_errors
                END
            ) AS average_score
            FROM (
                SELECT
                    task_id,
                    student_id,
                    COUNT(CASE WHEN is_correct = 1 THEN 1 END) AS correct_count
                FROM annotations
                GROUP BY task_id, student_id
            ) AS student_stats
            JOIN tasks ON tasks.id = student_stats.task_id
            """
        ).fetchone()

    return {
        "activeStudents": active_students,
        "avgFactCheckScore": round(scores["average_score"] or 0),
        "generatedTasks": generated_tasks,
    }


@app.get("/api/v1/teacher/tasks")
def get_teacher_tasks(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    require_role(user, {"teacher", "admin"})
    with get_connection() as connection:
        total_students = connection.execute(
            "SELECT COUNT(*) AS count FROM users WHERE role = 'student'"
        ).fetchone()["count"] or 1
        rows = connection.execute(
            """
            SELECT
                tasks.id,
                tasks.title,
                tasks.subject,
                tasks.status,
                tasks.created_at,
                COALESCE(progress.completed_students, 0) AS completed_students
            FROM tasks
            LEFT JOIN (
                SELECT
                    task_progress.task_id,
                    COUNT(*) AS completed_students
                FROM (
                    SELECT
                        annotations.task_id,
                        annotations.student_id,
                        COUNT(CASE WHEN annotations.is_correct = 1 THEN 1 END) AS correct_count
                    FROM annotations
                    GROUP BY annotations.task_id, annotations.student_id
                ) AS task_progress
                JOIN tasks AS progress_tasks ON progress_tasks.id = task_progress.task_id
                WHERE task_progress.correct_count >= progress_tasks.total_errors
                GROUP BY task_progress.task_id
            ) AS progress ON progress.task_id = tasks.id
            WHERE status = 'published'
            GROUP BY tasks.id
            ORDER BY tasks.created_at DESC
            """
        ).fetchall()

    return {
        "data": [
            {
                "id": row["id"],
                "title": row["title"],
                "subject": row["subject"],
                "status": "Completed",
                "createdAt": row["created_at"],
                "completion": round((row["completed_students"] / total_students) * 100),
            }
            for row in rows
        ]
    }


@app.get("/api/v1/teacher/tasks/{task_id}")
def get_teacher_task(task_id: str, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    require_role(user, {"teacher", "admin"})
    with get_connection() as connection:
        task = connection.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found.")

        highlights = connection.execute(
            """
            SELECT highlight_id, text
            FROM task_highlights
            WHERE task_id = ?
            ORDER BY highlight_id
            """,
            (task_id,),
        ).fetchall()

    return {
        "id": task["id"],
        "status": "Completed" if task["status"] == "published" else "Draft",
        "title": task["title"],
        "contentHtml": task["content_html"],
        "highlights": [
            {"highlightId": row["highlight_id"], "text": row["text"]}
            for row in highlights
        ],
        "totalErrors": task["total_errors"],
    }


@app.get("/api/v1/teacher/tasks/{task_id}/analytics")
def get_teacher_task_analytics(task_id: str, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    require_role(user, {"teacher", "admin"})
    with get_connection() as connection:
        task = connection.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found.")

        total_students = connection.execute(
            "SELECT COUNT(*) AS count FROM users WHERE role = 'student'"
        ).fetchone()["count"]
        submissions = connection.execute(
            """
            SELECT
                users.name AS student_name,
                COUNT(CASE WHEN annotations.is_correct = 1 THEN 1 END) AS score
            FROM annotations
            JOIN users ON users.id = annotations.student_id
            WHERE annotations.task_id = ?
            GROUP BY annotations.student_id
            """,
            (task_id,),
        ).fetchall()

        missed = connection.execute(
            """
            SELECT
                task_highlights.highlight_id,
                COUNT(annotations.id) AS attempts,
                COUNT(CASE WHEN annotations.is_correct = 1 THEN 1 END) AS correct_attempts
            FROM task_highlights
            LEFT JOIN annotations
              ON annotations.task_id = task_highlights.task_id
             AND annotations.highlight_id = task_highlights.highlight_id
            WHERE task_highlights.task_id = ?
            GROUP BY task_highlights.highlight_id
            ORDER BY (attempts - correct_attempts) DESC, task_highlights.highlight_id ASC
            LIMIT 1
            """,
            (task_id,),
        ).fetchone()

    completion_rate = 0.0
    if total_students:
        completed_count = sum(1 for row in submissions if row["score"] >= task["total_errors"])
        completion_rate = round((completed_count / total_students) * 100, 1)

    return {
        "taskId": task_id,
        "completionRate": completion_rate,
        "mostCommonMissedHighlightId": missed["highlight_id"] if missed else None,
        "studentSubmissions": [
            {
                "studentName": row["student_name"],
                "score": row["score"],
                "status": "Completed" if row["score"] >= task["total_errors"] else "In Progress",
            }
            for row in submissions
        ],
    }


@app.get("/api/v1/teacher/reports/{task_id}/heatmaps")
def get_blindspot_heatmap(task_id: str, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    require_role(user, {"teacher", "admin"})
    with get_connection() as connection:
        task = connection.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if task is None:
            raise HTTPException(status_code=404, detail="Task not found.")

        rows = connection.execute(
            """
            SELECT
                task_highlights.text,
                task_highlights.error_type,
                task_highlights.highlight_id,
                COUNT(DISTINCT annotations.student_id) AS attempts,
                COUNT(DISTINCT CASE WHEN annotations.is_correct = 1 THEN annotations.student_id END) AS correct_students
            FROM task_highlights
            LEFT JOIN annotations
              ON annotations.task_id = task_highlights.task_id
             AND annotations.highlight_id = task_highlights.highlight_id
            WHERE task_highlights.task_id = ?
            GROUP BY task_highlights.highlight_id
            ORDER BY task_highlights.highlight_id
            """,
            (task_id,),
        ).fetchall()

        total_students = connection.execute(
            "SELECT COUNT(*) AS count FROM users WHERE role = 'student'"
        ).fetchone()["count"] or 1

    blindspots = []
    for row in rows:
        miss_rate = 1 - (row["correct_students"] / total_students)
        blindspots.append(
            {
                "text": row["text"],
                "errorType": row["error_type"],
                "missRate": round(max(0, min(1, miss_rate)), 2),
            }
        )

    return {
        "taskId": task_id,
        "title": task["title"],
        "blindspots": blindspots,
    }


@app.get("/api/v1/admin/classrooms")
def get_classrooms(user: dict[str, Any] = Depends(get_current_user)) -> list[dict[str, Any]]:
    require_role(user, {"admin"})
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, name, code, enrolled FROM classrooms ORDER BY created_at ASC"
        ).fetchall()
    return [dict(row) for row in rows]


@app.post("/api/v1/admin/classrooms")
def create_classroom(
    payload: ClassroomPayload,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    require_role(user, {"admin"})
    classroom = {
        "id": make_id("class"),
        "name": payload.name,
        "code": make_id("code").replace("code-", "").upper(),
        "enrolled": 0,
    }
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO classrooms (id, name, code, enrolled, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (classroom["id"], classroom["name"], classroom["code"], 0, utc_now()),
        )
    return classroom


@app.post("/api/v1/admin/classrooms/{classroom_id}/teachers")
def assign_teacher(
    classroom_id: str,
    payload: TeacherAssignPayload,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    require_role(user, {"admin"})
    with get_connection() as connection:
        classroom = connection.execute(
            "SELECT id FROM classrooms WHERE id = ?",
            (classroom_id,),
        ).fetchone()
        if classroom is None:
            raise HTTPException(status_code=404, detail="Classroom not found.")

        teacher_name = payload.email.split("@", 1)[0].replace(".", " ").title()
        connection.execute(
            """
            INSERT INTO classroom_teachers (id, classroom_id, email, name, role_label, created_at)
            VALUES (?, ?, ?, ?, 'Member', ?)
            """,
            (make_id("ct"), classroom_id, payload.email, teacher_name, utc_now()),
        )
    return {"success": True}


@app.post("/api/v1/admin/classrooms/{classroom_id}/refresh-code")
def refresh_classroom_code(
    classroom_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> str:
    require_role(user, {"admin"})
    new_code = make_id("join").replace("join-", "").upper()
    with get_connection() as connection:
        updated = connection.execute(
            "UPDATE classrooms SET code = ? WHERE id = ?",
            (new_code, classroom_id),
        )
        if updated.rowcount == 0:
            raise HTTPException(status_code=404, detail="Classroom not found.")
    return new_code


@app.post("/api/v1/admin/classrooms/{classroom_id}/students/invite")
def invite_students(
    classroom_id: str,
    payload: InviteStudentsPayload,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    require_role(user, {"admin"})
    emails = [email.strip().lower() for email in payload.emails if email.strip()]
    with get_connection() as connection:
        classroom = connection.execute(
            "SELECT id FROM classrooms WHERE id = ?",
            (classroom_id,),
        ).fetchone()
        if classroom is None:
            raise HTTPException(status_code=404, detail="Classroom not found.")

        connection.executemany(
            """
            INSERT INTO classroom_invitations (id, classroom_id, email, invitation_type, created_at)
            VALUES (?, ?, ?, 'student', ?)
            """,
            [(make_id("invite"), classroom_id, email, utc_now()) for email in emails],
        )
    return {"success": True, "count": len(emails)}
