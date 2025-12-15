-- Enable Row Level Security on all tables
ALTER TABLE household_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HOUSEHOLD PROFILES POLICIES
-- =====================================================

-- Allow users to view their own household profiles
CREATE POLICY "Users can view own household profiles"
ON household_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create their own household profiles
CREATE POLICY "Users can create own household profiles"
ON household_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own household profiles
CREATE POLICY "Users can update own household profiles"
ON household_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own household profiles
CREATE POLICY "Users can delete own household profiles"
ON household_profiles FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- MEAL PLANS POLICIES
-- =====================================================

-- Allow users to view meal plans for their households
CREATE POLICY "Users can view own meal plans"
ON meal_plans FOR SELECT
USING (
  household_id IN (
    SELECT id FROM household_profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to create meal plans for their households
CREATE POLICY "Users can create meal plans"
ON meal_plans FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT id FROM household_profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to update their meal plans
CREATE POLICY "Users can update own meal plans"
ON meal_plans FOR UPDATE
USING (
  household_id IN (
    SELECT id FROM household_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  household_id IN (
    SELECT id FROM household_profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to delete their meal plans
CREATE POLICY "Users can delete own meal plans"
ON meal_plans FOR DELETE
USING (
  household_id IN (
    SELECT id FROM household_profiles WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- GROCERY LISTS POLICIES
-- =====================================================

-- Allow users to view grocery lists for their meal plans
CREATE POLICY "Users can view own grocery lists"
ON grocery_lists FOR SELECT
USING (
  meal_plan_id IN (
    SELECT mp.id FROM meal_plans mp
    INNER JOIN household_profiles hp ON mp.household_id = hp.id
    WHERE hp.user_id = auth.uid()
  )
);

-- Allow users to create grocery lists for their meal plans
CREATE POLICY "Users can create grocery lists"
ON grocery_lists FOR INSERT
WITH CHECK (
  meal_plan_id IN (
    SELECT mp.id FROM meal_plans mp
    INNER JOIN household_profiles hp ON mp.household_id = hp.id
    WHERE hp.user_id = auth.uid()
  )
);

-- Allow users to update their grocery lists
CREATE POLICY "Users can update own grocery lists"
ON grocery_lists FOR UPDATE
USING (
  meal_plan_id IN (
    SELECT mp.id FROM meal_plans mp
    INNER JOIN household_profiles hp ON mp.household_id = hp.id
    WHERE hp.user_id = auth.uid()
  )
)
WITH CHECK (
  meal_plan_id IN (
    SELECT mp.id FROM meal_plans mp
    INNER JOIN household_profiles hp ON mp.household_id = hp.id
    WHERE hp.user_id = auth.uid()
  )
);

-- Allow users to delete their grocery lists
CREATE POLICY "Users can delete own grocery lists"
ON grocery_lists FOR DELETE
USING (
  meal_plan_id IN (
    SELECT mp.id FROM meal_plans mp
    INNER JOIN household_profiles hp ON mp.household_id = hp.id
    WHERE hp.user_id = auth.uid()
  )
);

-- =====================================================
-- CHAT SESSIONS POLICIES
-- =====================================================

-- Allow users to view their own chat sessions
CREATE POLICY "Users can view own chat sessions"
ON chat_sessions FOR SELECT
USING (
  -- Onboarding sessions (before household_id is set) or sessions linked to user's household
  household_id IS NULL OR
  household_id IN (
    SELECT id FROM household_profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to create chat sessions
CREATE POLICY "Users can create chat sessions"
ON chat_sessions FOR INSERT
WITH CHECK (
  -- Allow creating sessions without household_id (for onboarding)
  household_id IS NULL OR
  household_id IN (
    SELECT id FROM household_profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to update their chat sessions
CREATE POLICY "Users can update own chat sessions"
ON chat_sessions FOR UPDATE
USING (
  household_id IS NULL OR
  household_id IN (
    SELECT id FROM household_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  household_id IS NULL OR
  household_id IN (
    SELECT id FROM household_profiles WHERE user_id = auth.uid()
  )
);

-- Allow users to delete their chat sessions
CREATE POLICY "Users can delete own chat sessions"
ON chat_sessions FOR DELETE
USING (
  household_id IS NULL OR
  household_id IN (
    SELECT id FROM household_profiles WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- SERVICE ROLE BYPASS
-- =====================================================

-- Note: Edge functions use SERVICE_ROLE_KEY which bypasses RLS
-- This is intentional - edge functions act on behalf of users
-- and perform additional validation before database operations
