# Migration Guide: FastAPI → Supabase Edge Functions

This guide will help you complete the migration from Railway-hosted FastAPI backend to Supabase Edge Functions.

## ✅ Completed Steps

1. **Supabase CLI installed** and project initialized
2. **Edge Functions created:**
   - `generate-grocery-list` - Grocery list generation from meal plans
   - `chat-onboarding` - User onboarding conversation flow
   - `chat-weekly-planning` - Weekly meal planning chat flow
3. **RLS Policies created** for all database tables (household_profiles, meal_plans, grocery_lists, chat_sessions)
4. **Shared utilities** created in `_shared/ai-gateway.ts`

## 🚀 Next Steps

### Step 1: Set Up Environment Variables

1. Get your Supabase project credentials:
   ```bash
   # Navigate to your Supabase project dashboard
   # Go to Settings → API
   # Copy: Project URL, anon key, and service_role key
   ```

2. Create `.env` file in `/supabase`:
   ```bash
   cd supabase
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

3. Update AI_GATEWAY_URL with your Vercel deployment URL

### Step 2: Link to Supabase Project

```bash
cd "/Users/densign/Documents/Coding projects/Meal-plan"
supabase link --project-ref your-project-ref
```

### Step 3: Apply RLS Policies

```bash
supabase db push
```

### Step 4: Test Edge Functions Locally

```bash
# Start Supabase local development
supabase start

# Serve edge functions locally
supabase functions serve --env-file supabase/.env

# Test grocery list generation
curl -X POST http://localhost:54321/functions/v1/generate-grocery-list \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"meal_plan_id": "test-meal-plan-id"}'

# Test onboarding start
curl -X POST http://localhost:54321/functions/v1/chat-onboarding \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "start"}'
```

### Step 5: Deploy Edge Functions to Production

```bash
# Deploy all functions
supabase functions deploy generate-grocery-list
supabase functions deploy chat-onboarding
supabase functions deploy chat-weekly-planning

# Or deploy all at once
supabase functions deploy
```

### Step 6: Update Frontend

#### 6.1 Install Supabase Client

```bash
cd frontend
npm install @supabase/supabase-js
```

#### 6.2 Create Supabase Client

Create `frontend/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 6.3 Update Frontend Environment Variables

Add to `frontend/.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### 6.4 Update API Calls

Replace Axios calls with Supabase:

**Before (Axios):**
```typescript
import api from './api'

// Get household profile
const response = await api.get(`/household/${householdId}`)
const household = response.data
```

**After (Supabase):**
```typescript
import { supabase } from '@/lib/supabase'

// Get household profile
const { data: household, error } = await supabase
  .from('household_profiles')
  .select('*')
  .eq('id', householdId)
  .single()

if (error) throw error
```

**Edge Function Calls:**
```typescript
// Generate grocery list
const { data, error } = await supabase.functions.invoke('generate-grocery-list', {
  body: { meal_plan_id: mealPlanId }
})

// Start onboarding
const { data, error } = await supabase.functions.invoke('chat-onboarding', {
  body: { action: 'start' }
})

// Continue onboarding
const { data, error } = await supabase.functions.invoke('chat-onboarding', {
  body: {
    action: 'continue',
    session_id: sessionId,
    message: userMessage,
    user_id: userId
  }
})
```

### Step 7: Update Components

Key files to update:

1. **`frontend/src/components/OnboardingAgent.tsx`**
   - Replace `api.post('/chat/onboarding/start')` with `supabase.functions.invoke('chat-onboarding', { body: { action: 'start' } })`
   - Replace `api.post('/chat/onboarding/:id')` with `supabase.functions.invoke('chat-onboarding', { body: { action: 'continue', session_id, message } })`

2. **`frontend/src/components/WeeklyPlanningAgent.tsx`**
   - Replace `api.post('/chat/weekly-planning/start')` with `supabase.functions.invoke('chat-weekly-planning', { body: { action: 'start', household_id } })`
   - Replace `api.post('/chat/weekly-planning/:id')` with `supabase.functions.invoke('chat-weekly-planning', { body: { action: 'continue', session_id, message } })`
   - Add meal plan generation call: `supabase.functions.invoke('chat-weekly-planning', { body: { action: 'generate', session_id, household_id } })`

3. **`frontend/src/components/GroceryTab.tsx`**
   - Replace `api.post('/grocery/generate/:id')` with `supabase.functions.invoke('generate-grocery-list', { body: { meal_plan_id } })`

4. **Direct Database Queries** (for simple CRUD):
   ```typescript
   // Get meal plans
   const { data: mealPlans } = await supabase
     .from('meal_plans')
     .select('*')
     .eq('household_id', householdId)
     .order('week_start_date', { ascending: false })

   // Get grocery list
   const { data: groceryList } = await supabase
     .from('grocery_lists')
     .select('*')
     .eq('meal_plan_id', mealPlanId)
     .single()
   ```

### Step 8: Test Frontend Integration

1. Start frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Test workflows:
   - [ ] Onboarding flow (create household profile)
   - [ ] Weekly planning flow (generate meal plan)
   - [ ] Grocery list generation
   - [ ] View meal plans
   - [ ] View grocery lists

### Step 9: Deploy to Production

1. **Update Vercel Environment Variables:**
   ```
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_anon_key
   ```

2. **Deploy frontend:**
   ```bash
   cd frontend
   npm run build
   vercel --prod
   ```

3. **Verify production edge functions** are deployed and working

### Step 10: Shut Down Railway

1. Verify all functionality works on Supabase
2. Back up any Railway logs/data if needed
3. Delete Railway project
4. Remove FastAPI backend code (optional - keep for reference)

## 📊 Architecture Comparison

### Before (FastAPI + Railway)
```
Frontend → Railway (FastAPI) → Supabase Database
                ↓
         AI Gateway (Vercel)
```

### After (Supabase Edge Functions)
```
Frontend → Supabase Edge Functions → Supabase Database
                    ↓
              AI Gateway (Vercel)
```

## 🎯 Benefits

1. **No more Railway** - One less deployment to manage
2. **Lower latency** - Edge functions run globally
3. **Auto-scaling** - Built into Supabase
4. **Better DX** - Single platform for database + functions
5. **Expo-ready** - Same Supabase client works in React Native
6. **RLS security** - Database-level security policies

## 🔐 Security Notes

- Edge functions use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS
- RLS policies protect direct database access from frontend/Expo
- Always validate user permissions in edge functions before mutations

## 📱 Expo Migration (Future)

Once this migration is complete, Expo integration will be straightforward:

```typescript
// Expo app - exactly the same as web!
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

## 🆘 Troubleshooting

### Edge Function Errors
```bash
# View function logs
supabase functions logs generate-grocery-list

# Check function status
supabase functions list
```

### RLS Policy Issues
```bash
# Check if RLS is enabled
supabase db diff

# Test policies in Supabase dashboard SQL editor
```

### CORS Issues
- Make sure `corsHeaders` are included in all responses
- Verify `OPTIONS` method is handled

## 📚 Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Expo + Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
