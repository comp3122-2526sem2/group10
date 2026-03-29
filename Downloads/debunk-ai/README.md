# Debunk AI

A runnable full-stack implementation of the uploaded **Debunk AI** product specification.

## Stack
- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL (production) / SQLite (development)
- Cookie/JWT session authentication
- Real AI integration with HuggingFace Inference API (optional)

## Quick Start
```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000

## Demo Accounts
- `teacher@debunk.ai` / `password123`
- `student@debunk.ai` / `password123`
- `student2@debunk.ai` / `password123`

## Implemented Modules
- Landing, login, register
- Student dashboard, course list, task workspace, grading result, review chat, profile, mistake journal, encyclopedia, leaderboard
- Teacher dashboard, course management, task creation, task preview, task detail, submission review, challenge monitor
- REST APIs for auth, courses, tasks, submissions, hints, chat, teach-back, profile, leaderboard, mistakes, encyclopedia

## Notes
- The app runs out of the box in **demo mode** with a deterministic content/error generator
- **To enable real AI generation:** Configure `HF_API_KEY` environment variable with your HuggingFace token at https://huggingface.co/settings/tokens
- **For production:** Use PostgreSQL database (configured via `DATABASE_PROVIDER` and `DATABASE_URL`)
- **Local development:** SQLite is the default for zero-config setup. Switch to PostgreSQL anytime by setting environment variables
- **Vercel deployment:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup instructions

## Real AI Integration

The app supports HuggingFace Inference API for real content generation:

1. Get your API token: https://huggingface.co/settings/tokens
2. Add to `.env.local`:
   ```
   HF_API_KEY=hf_your_token_here
   ```
3. Restart the app - it will automatically use real AI

If `HF_API_KEY` is not set, the app gracefully falls back to demo mode.

## Verified
- `npm run db:push`
- `npm run db:seed`
- `npm run build`
- Basic smoke tests for login and dashboard routes
