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
- The app is configured to run in **production mode** with real AI-powered grading and feedback
- **HuggingFace AI Integration:** The app uses HuggingFace Inference API for real content generation when `HF_API_KEY` is configured
- **Real grading system:** Student submissions are graded based on actual answer keys and error detection algorithms, not demo/deterministic content
- **Pre-populated data:** The database includes realistic demo courses, tasks, and sample submissions for testing
- **Local development:** SQLite is the default for zero-config setup. For production, use PostgreSQL with proper `DATABASE_URL`
- **Vercel deployment:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup instructions

## Real AI Integration

The app is configured with HuggingFace Inference API for real content generation. The `HF_API_KEY` is already set to use Mistral-7B model for:
- Providing Socratic hints during task reviews
- Generating chat responses during student-teacher discussions
- Real-time AI-powered educational feedback

The HF_API_KEY is automatically loaded from environment variables in production (Vercel). No additional configuration needed.

If you want to use a different HuggingFace token:
1. Get a new API token: https://huggingface.co/settings/tokens
2. Update the HF_API_KEY in Vercel project settings
3. Redeploy the application

## Verified & Production Ready
- ✅ `npm run db:push` - Database schema synchronization
- ✅ `npm run db:seed` - Pre-populated with 3 courses, 6 tasks, 5 users
- ✅ `npm run build` - Production build compilation
- ✅ Vercel deployment with PostgreSQL (Neon)
- ✅ JWT authentication fully functional
- ✅ HuggingFace AI integration active
- ✅ Real grading and evaluation system (not demo content)
- ✅ Load-tested with sample submissions and multiple user roles
