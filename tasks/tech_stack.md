# Tech Stack Guidelines

> **Location**: `./tasks/tech_stack.md`

## Purpose
Define the default technology stack for projects to ensure consistency, faster onboarding, and reuse of patterns and components.

## Core Stack
- **Frontend**: React (Tailwind for styling, shadcn/ui for components)
- **Backend (default)**: **FastAPI** deployed on **Railway**
  - Alternatives: Vercel API Routes (with Vercel AI SDK) for lightweight JS/Edge endpoints; Render for simple container/web services
- **Database**: PostgreSQL (prefer **Supabase**; **Neon** is an acceptable alternative if needed)
- **Auth**: Supabase Auth
- **Hosting**
  - Frontend: Vercel
  - Backend: Railway (default)
- **AI/LLM API**: [Vercel AI SDK](https://sdk.vercel.ai/docs) (preferred over direct OpenAI API)
  - **Default model**: `gpt-5-mini`

## Optional / Recommended Tools
- **Testing**: Pytest (backend), Jest (frontend)
- **Monitoring/Logging**: Sentry, Logtail
- **CI/CD**: GitHub Actions (or Vercel’s built-in for frontend)
- **Edge/Workers**: Cloudflare Workers (for lightweight edge functions)
- **Supabase Edge Functions**: Good for DB-adjacent logic gated by RLS

## Local Development & Testing
- **Streamlit for local prototyping** (quick UI to exercise backend/LLM flows)
  - Run with `streamlit run streamlit_app.py`
  - Keep API calls behind environment variables (e.g., `OPENAI_API_KEY`)

## Versioning & Dependencies
- Pin dependencies via `requirements.txt` (Python) and `package.json` (JS)
- Track breaking changes in `CHANGELOG.md`
- Record notable stack/version decisions in this file

## Developer Practices
- **Commit early and often to GitHub** using small, focused PRs with clear messages
- Use feature branches with semantic names (e.g., `feat/meal-parser`, `fix/typo-coach-copy`)
- Keep environment variables in `.env.local` (never commit secrets)

## File Placement & Cross-References
- Place at `./tasks/tech_stack.md`
- Cross-reference from `./tasks/context_engineering.md` (see “0. Tasks” bullet)
