# Debunk AI - Production Deployment Guide

This guide covers deploying Debunk AI with real AI integration (HuggingFace API) and PostgreSQL database.

## Prerequisites

- Node.js 18+ and npm
- A HuggingFace account with API token (optional, but recommended for production)
- A PostgreSQL database (for production)
- Vercel account (for deploying to Vercel)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd debunk-ai
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory (never commit this to git):

```bash
# Use the .env.example as a template
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

#### For Local Development (SQLite):
```env
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secure-random-string
HF_API_KEY=hf_YOUR_HUGGINGFACE_TOKEN_HERE
NODE_ENV=development
```

#### For Production (PostgreSQL):
```env
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://username:password@host:5432/dbname
JWT_SECRET=your-very-secure-random-string-64-chars-minimum
HF_API_KEY=hf_YOUR_HUGGINGFACE_TOKEN_HERE
NODE_ENV=production
```

### 3. HuggingFace API Setup

1. Visit https://huggingface.co/settings/tokens
2. Create a new API token with "read" access
3. Add the token to your `.env.local`:
   ```env
   HF_API_KEY=hf_YOUR_TOKEN_HERE
   ```

**How it works:**
- The app uses real HuggingFace Mistral-7B model for Socratic hints, chat responses, and educational guidance
- HF_API_KEY is required for production deployment; the app will warn if not configured
- Pre-populated courses, tasks, and sample submissions provide realistic test data without relying on computed demo content

### 4. Database Setup

#### Local Development (SQLite):
```bash
npm run db:push
npm run db:seed
```

#### Production (PostgreSQL):

**Option A: Using Vercel Postgres**
1. Create a Vercel Postgres database in your Vercel project
2. Vercel automatically sets `DATABASE_URL` - just set `DATABASE_PROVIDER=postgresql`

**Option B: Using external PostgreSQL**
1. Create a PostgreSQL database
2. Update `DATABASE_URL` in your environment variables
3. Run migrations:
   ```bash
   npm run db:push
   npm run db:seed
   ```

### 5. Local Development

```bash
npm run dev
```

Visit http://localhost:3000

**Demo Credentials:**
- Email: `teacher@debunk.ai` | Password: `password123`
- Email: `student@debunk.ai` | Password: `password123`
- Email: `student2@debunk.ai` | Password: `password123`

## Deploying to Vercel

### Step 1: Prepare Git Repository

```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

### Step 2: Create Vercel Project

1. Go to https://vercel.com/new
2. Import your repository
3. Select Next.js as the framework
4. In "Environment Variables" section, add:
   ```
   DATABASE_PROVIDER=postgresql
   DATABASE_URL=postgresql://... (from Vercel Postgres)
   JWT_SECRET=your-production-secret
   HF_API_KEY=hf_your_token
   NODE_ENV=production
   ```

### Step 3: Deploy

Click "Deploy" - Vercel will automatically:
- Install dependencies
- Run `npm run build`
- Deploy to production

### Step 4: Run Database Migrations

After first deployment, run in Vercel's environment:
```bash
vercel env pull  # Pull production environment variables
npm run db:push  # Apply schema changes
npm run db:seed  # Seed demo data
```

Or use Vercel CLI:
```bash
vercel --prod  # Deploy again with migrations
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| DATABASE_PROVIDER | Yes | Database type: `sqlite` or `postgresql` | `postgresql` |
| DATABASE_URL | Yes | Database connection string | `postgresql://user:pass@host/db` |
| JWT_SECRET | Yes | Secret for signing JWT tokens | `random-64-char-string` |
| HF_API_KEY | No | HuggingFace API token for real AI | `hf_...` |
| NODE_ENV | No | Environment mode | `production` |
| APP_URL | No | Base URL for CORS/redirects | `https://debunk.example.com` |

## Security Checklist

- [ ] Change `JWT_SECRET` to a truly random 64+ character string
- [ ] Never commit `.env.local` to git
- [ ] Use PostgreSQL for production (not SQLite)
- [ ] Enable HTTPS on your domain
- [ ] Set appropriate CORS headers if API is accessed from different domain
- [ ] Review `src/lib/auth.ts` for secure session configuration
- [ ] Rotate `HF_API_KEY` if exposed

## Monitoring & Troubleshooting

### Check Logs

**Vercel:**
```bash
vercel logs --prod
```

**Local:**
```bash
npm run dev  # Check terminal output
```

### Common Issues

**"UNAUTHORIZED" errors:**
- Check `JWT_SECRET` is set correctly
- Ensure session cookies are valid
- Clear browser cookies and re-login

**Database connection errors:**
- Verify `DATABASE_URL` format
- Check database is accessible from Vercel IP range
- Test locally with `npx prisma studio`

**AI generation failures:**
- Check `HF_API_KEY` is valid
- Verify HuggingFace API quota
- Check HF API status at https://status.huggingface.co

### View Database

```bash
# Local SQLite
npx prisma studio

# Production PostgreSQL (if you have access)
npx prisma studio
```

## Performance Optimization

1. **Database indexing:** Already configured in Prisma schema
2. **API rate limiting:** Consider adding redis for session store
3. **Image optimization:** Use Next.js Image component
4. **Caching:** Leverage Vercel Edge Caching

## Scaling Considerations

- Switch from SQLite to PostgreSQL (✓ Already configured)
- Use Redis for session storage (for high-traffic scenarios)
- Implement API rate limiting
- Add CDN for static assets (Vercel includes this)
- Monitor database query performance with Prisma

## Support

For issues:
1. Check Vercel logs: `vercel logs --prod`
2. Check local reproduction: `npm run dev`
3. Review Prisma docs: https://www.prisma.io/docs
4. Check HuggingFace API status

## License

See LICENSE file in repository
