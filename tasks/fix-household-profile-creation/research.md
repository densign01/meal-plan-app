# Research: Fix Household Profile Creation

## Issue Analysis

### Current Flow
1. **Frontend** (`OnboardingAgent.tsx:48`): Expects `data.extracted_data.id` to contain household ID
2. **Backend** (`chat.py:83-88`): Creates household profile but returns entire profile data, not just ID
3. **Problem**: Frontend expects `extracted_data.id` but backend returns profile data without guaranteed `id` field

### Existing Patterns

#### Backend Chat Route (`routes/chat.py:81-88`)
```python
if result["completed"] and result["extracted_data"]:
    # Create household profile
    profile_result = supabase.table("household_profiles").insert(
        result["extracted_data"]
    ).execute()

    household_id = profile_result.data[0]["id"]
    update_data["household_id"] = household_id
```

**Issues Found:**
1. ✅ **Good**: Creates household profile when chat completes
2. ✅ **Good**: Stores household_id in chat session
3. ❌ **Bad**: Doesn't return household_id in response to frontend
4. ❌ **Bad**: Frontend expects `extracted_data.id` but backend doesn't set it

#### Frontend Expectation (`OnboardingAgent.tsx:48`)
```typescript
const householdId = data.extracted_data.id || 'temp-household-id'
```

**Gap**: Backend creates profile but doesn't update `extracted_data` with the generated ID.

### Household Service Pattern (`services/household_service.py`)
- ✅ Exists and has proper CRUD operations
- ✅ `create_household_profile()` returns the created ID
- ✅ Generates UUID and timestamps properly
- **Not used in chat flow** - chat route directly inserts to database

### Environment Variable Patterns
- ✅ Backend: `.env.example` with Supabase and OpenAI keys
- ✅ Frontend: `.env.example` with API URL
- ✅ Standard naming conventions used

## Root Cause
The chat completion flow creates the household profile but doesn't return the generated household ID to the frontend in the expected format.

## Dependencies
- Chat route needs to return household_id in `extracted_data`
- Environment files need to be created from examples
- Supabase project needs to be set up with schema