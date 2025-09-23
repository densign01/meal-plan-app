# Plan: Fix Household Profile Creation Flow

## Problem Statement
The onboarding chat completion creates household profiles but doesn't return the household ID to the frontend in the expected format, causing the flow to use a fallback 'temp-household-id'.

## Solution Overview
Modify the chat completion flow to return the created household ID in the `extracted_data` object so the frontend can properly transition to the next step.

## Technical Approach

### Option 1: Modify extracted_data in chat route (Recommended)
**Pros**: Minimal changes, follows existing patterns
**Cons**: None significant

### Option 2: Use household service in chat route
**Pros**: More consistent with service layer
**Cons**: More changes required, potential breaking changes

**Chosen**: Option 1 for simplicity and minimal risk

## Implementation Plan

### Step 1: Update Chat Route Return Logic
**File**: `backend/routes/chat.py:81-97`

**Change**: After creating household profile, update the `extracted_data` to include the generated ID:

```python
if result["completed"] and result["extracted_data"]:
    # Create household profile
    profile_result = supabase.table("household_profiles").insert(
        result["extracted_data"]
    ).execute()

    household_id = profile_result.data[0]["id"]
    update_data["household_id"] = household_id

    # NEW: Add household_id to extracted_data for frontend
    result["extracted_data"]["id"] = household_id
```

### Step 2: Update Response Model (Optional)
**File**: `backend/routes/chat.py:14-21`

**Consider**: Add household_id field to ChatResponse model for clarity:

```python
class ChatResponse(BaseModel):
    message: str
    session_id: str
    completed: bool
    extracted_data: Optional[Dict[str, Any]] = None
    household_id: Optional[str] = None  # NEW
```

### Step 3: Error Handling Enhancement
**File**: `backend/routes/chat.py:81-97`

**Add**: Proper error handling for profile creation:

```python
try:
    profile_result = supabase.table("household_profiles").insert(
        result["extracted_data"]
    ).execute()

    if not profile_result.data:
        raise Exception("Failed to create household profile")

    household_id = profile_result.data[0]["id"]
    # ... rest of logic
except Exception as e:
    # Log error and continue without household creation
    logger.error(f"Household creation failed: {e}")
```

### Step 4: Frontend Validation (Optional)
**File**: `frontend/src/components/agents/OnboardingAgent.tsx:48`

**Current**:
```typescript
const householdId = data.extracted_data.id || 'temp-household-id'
```

**Enhanced**:
```typescript
const householdId = data.extracted_data?.id || data.household_id
if (!householdId) {
  console.error('No household ID received from backend')
  // Handle error case
}
```

## Testing Plan

1. **Unit Test**: Backend route returns correct household ID
2. **Integration Test**: Complete onboarding flow end-to-end
3. **Error Test**: Handle profile creation failure gracefully

## Rollback Plan
If issues arise, revert chat.py changes and frontend will use 'temp-household-id' fallback.

## Dependencies
- None (self-contained backend change)
- No database schema changes required
- No breaking API changes

## Time Estimate
- Implementation: 15 minutes
- Testing: 10 minutes
- Total: 25 minutes