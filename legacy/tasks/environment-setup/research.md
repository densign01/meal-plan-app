# Research: Environment Setup

## Current State

### Backend Environment (`.env.example`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_api_key
```

### Frontend Environment (`.env.example`)
```
VITE_API_URL=http://localhost:8000
```

## Required API Keys/Services

### 1. Supabase
- **What**: PostgreSQL database hosting
- **Setup**: Create project at supabase.com
- **Required**:
  - `SUPABASE_URL`: Project API URL
  - `SUPABASE_KEY`: Project API key (anon/public)
- **Schema**: Need to run `backend/schema.sql`

### 2. OpenAI
- **What**: AI chat and meal planning
- **Setup**: Get API key from openai.com
- **Required**:
  - `OPENAI_API_KEY`: API key with GPT access
- **Model**: Using `gpt-4o-mini` per tech stack

### 3. Local Development
- **Backend**: Port 8000 (FastAPI default)
- **Frontend**: Vite dev server (typically 5173)
- **Connection**: Frontend needs backend URL

## Setup Dependencies
1. Supabase project creation
2. Database schema execution
3. OpenAI API key
4. Environment file creation

## Existing Patterns
- ✅ `.env.example` files exist for both frontend/backend
- ✅ Standard environment variable naming
- ✅ Proper separation of frontend/backend configs
- ✅ Tech stack specified in `tasks/tech_stack.md`

## Files to Create
1. `backend/.env` (from `.env.example`)
2. `frontend/.env.local` (from `.env.example`)
3. Supabase database tables (from `schema.sql`)