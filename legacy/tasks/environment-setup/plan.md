# Plan: Environment Setup

## Problem Statement
Need to create environment files and set up external services (Supabase, OpenAI) to enable local development and testing.

## Solution Overview
1. Set up Supabase project and database
2. Get OpenAI API key
3. Create environment files
4. Test connections

## Implementation Plan

### Step 1: Create Supabase Project
**Actions**:
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for project provisioning (~2 minutes)
4. Get project URL and API key from Settings > API

**Output**:
- `SUPABASE_URL`: Project API URL
- `SUPABASE_KEY`: Anon/public API key

### Step 2: Set Up Database Schema
**File**: `backend/schema.sql` (already exists)

**Actions**:
1. Go to Supabase SQL Editor
2. Copy contents of `backend/schema.sql`
3. Execute SQL to create tables
4. Verify tables were created

**Expected Tables**:
- `household_profiles`
- `meal_plans`
- `grocery_lists`
- `chat_sessions`

### Step 3: Get OpenAI API Key
**Actions**:
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Ensure account has GPT-4 access (or confirm gpt-4o-mini access)

**Output**: `OPENAI_API_KEY`

### Step 4: Create Backend Environment File
**File**: `backend/.env` (new)

**Template**: Copy from `backend/.env.example`
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
OPENAI_API_KEY=sk-your-key
```

### Step 5: Create Frontend Environment File
**File**: `frontend/.env.local` (new)

**Template**: Copy from `frontend/.env.example`
```
VITE_API_URL=http://localhost:8000
```

### Step 6: Verify Backend Dependencies
**File**: `backend/requirements.txt` (exists)

**Action**: Ensure dependencies are installed
```bash
cd backend
pip install -r requirements.txt
```

### Step 7: Verify Frontend Dependencies
**File**: `frontend/package.json` (exists)

**Action**: Ensure dependencies are installed
```bash
cd frontend
npm install
```

### Step 8: Test Backend Connection
**Actions**:
1. Start backend server: `cd backend && python main.py`
2. Test health endpoint: `curl http://localhost:8000/health`
3. Verify Supabase connection (should not error on startup)
4. Verify OpenAI connection (test a simple chat call)

### Step 9: Test Frontend Connection
**Actions**:
1. Start frontend: `cd frontend && npm run dev`
2. Open browser to frontend URL
3. Verify API calls reach backend (check network tab)

## Validation Checklist

### Backend
- [ ] Server starts without errors
- [ ] `/health` endpoint returns `{"status": "healthy"}`
- [ ] Database connection works (no Supabase errors)
- [ ] OpenAI API key is valid (test chat endpoint)

### Frontend
- [ ] Development server starts
- [ ] App loads in browser
- [ ] API calls reach backend (network requests visible)
- [ ] No console errors related to environment

### Integration
- [ ] Frontend can call backend APIs
- [ ] Backend can create database records
- [ ] AI chat responses work

## Security Notes
- Never commit `.env` files to git
- Use different API keys for production
- Supabase keys should be "anon" keys for frontend access
- Consider row-level security (RLS) for production

## Troubleshooting

### Common Issues
1. **Port conflicts**: Change backend port if 8000 is in use
2. **CORS errors**: Verify frontend URL in backend CORS settings
3. **Database errors**: Check Supabase project status and SQL execution
4. **OpenAI errors**: Verify API key and billing status

### Fallback Options
- Use mock data if external APIs fail
- Local SQLite for database if Supabase issues
- Hardcoded responses if OpenAI API unavailable

## Time Estimate
- Supabase setup: 10 minutes
- OpenAI setup: 5 minutes
- Environment files: 5 minutes
- Testing: 15 minutes
- **Total: 35 minutes**