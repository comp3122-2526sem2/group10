# Debunk AI

Debunk AI is a course project that turns students into AI fact-checkers. Teachers generate deliberately flawed reading passages from source material, students identify and explain the mistakes, and the system stores scores and class analytics in a real database.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: FastAPI + SQLite
- Local LLM: Ollama with an open-source model

## Project Structure

- `frontend/`: student, teacher, and admin UI
- `backend/`: FastAPI API, SQLite database, Ollama integration
- `backend/data/debunk_ai.db`: runtime database file
- `idea.md`, `feature_list.md`, `api_contract.md`: original planning docs

## Quick Start

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

### 2. Backend Virtual Environment

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 3. Start Ollama

If you installed Ollama with Homebrew:

```bash
brew services start ollama
```

Or run it manually:

```bash
ollama serve
```

### 4. Pull a Local Model

Recommended for faster classroom demos:

```bash
ollama pull qwen2.5:1.5b
```

Larger but slower:

```bash
ollama pull qwen2.5:3b
```

### 5. Optional Environment Variables

You can switch the backend model without changing code:

```bash
export OLLAMA_MODEL=qwen2.5:1.5b
export OLLAMA_URL=http://127.0.0.1:11434
export FRONTEND_ORIGIN=http://localhost:5173
```

### 6. Start the Backend

```bash
cd backend
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API runs on `http://127.0.0.1:8000`.

## How To Use

### Register Accounts

Use the landing page and create three roles as needed:

- `student`
- `teacher`
- `admin`

This project intentionally keeps auth simple for course-demo use. Registration writes directly into SQLite and login checks the stored email/password pair.

### Teacher Workflow

1. Open the teacher dashboard.
2. Enter task title, subject, and source material.
3. Pick a hallucination density.
4. Generate flawed text with the local model.
5. Publish the task.

### Student Workflow

1. Open the student dashboard.
2. Start a published task.
3. Click highlighted sentences in the workspace.
4. Submit the error type and explanation.
5. Receive points and AI feedback.

### Admin Workflow

1. Open the admin dashboard.
2. Create classrooms.
3. Assign teachers by email.
4. Refresh invite codes or record student invites.

## Reset Data

To reset the database completely:

```bash
rm backend/data/debunk_ai.db
```

Then restart the backend. Default classrooms will be recreated automatically.

## Notes

- The core feature depends on a local Ollama model. If generation is too slow, switch to `qwen2.5:1.5b`.
- The frontend no longer uses mock APIs.
- The backend stores sessions, tasks, highlights, annotations, points, and classroom data in SQLite.
