-- Meal Plan App - Initial Schema
-- Run this in your Supabase SQL editor

-- ============================================
-- TABLES (in dependency order)
-- ============================================

-- Household Profiles table (stores user preferences and family info)
CREATE TABLE IF NOT EXISTS household_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  members JSONB DEFAULT '[]'::jsonb,
  cooking_skill TEXT CHECK (cooking_skill IN ('beginner', 'intermediate', 'advanced')),
  max_cooking_time INTEGER DEFAULT 45,
  budget_per_week NUMERIC,
  favorite_cuisines TEXT[] DEFAULT '{}',
  dislikes TEXT[] DEFAULT '{}',
  kitchen_equipment TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Sessions table (for storing onboarding and weekly planning conversations)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY,
  session_type TEXT NOT NULL CHECK (session_type IN ('onboarding', 'weekly_planning')),
  messages JSONB DEFAULT '[]'::jsonb,
  completed BOOLEAN DEFAULT FALSE,
  household_id UUID REFERENCES household_profiles(id),
  weekly_context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal Plans table (stores generated weekly meal plans)
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES household_profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  meals JSONB DEFAULT '{}'::jsonb,
  constraints JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grocery Lists table (stores generated grocery lists)
CREATE TABLE IF NOT EXISTS grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  items JSONB DEFAULT '{}'::jsonb,
  total_estimated_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chat_sessions_household ON chat_sessions(household_id);
CREATE INDEX IF NOT EXISTS idx_household_profiles_user ON household_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_household ON meal_plans(household_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week ON meal_plans(week_start_date);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_meal_plan ON grocery_lists(meal_plan_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE household_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Household Profiles policies
CREATE POLICY "Users can view own household" ON household_profiles
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own household" ON household_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own household" ON household_profiles
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Meal Plans policies
CREATE POLICY "Users can view own meal plans" ON meal_plans
  FOR SELECT USING (
    household_id IN (SELECT id FROM household_profiles WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert own meal plans" ON meal_plans
  FOR INSERT WITH CHECK (
    household_id IN (SELECT id FROM household_profiles WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- Grocery Lists policies
CREATE POLICY "Users can view own grocery lists" ON grocery_lists
  FOR SELECT USING (
    meal_plan_id IN (
      SELECT id FROM meal_plans WHERE household_id IN (
        SELECT id FROM household_profiles WHERE user_id = auth.uid() OR user_id IS NULL
      )
    )
  );

CREATE POLICY "Users can insert own grocery lists" ON grocery_lists
  FOR INSERT WITH CHECK (
    meal_plan_id IN (
      SELECT id FROM meal_plans WHERE household_id IN (
        SELECT id FROM household_profiles WHERE user_id = auth.uid() OR user_id IS NULL
      )
    )
  );

-- Chat Sessions policies (permissive for anonymous users during onboarding)
CREATE POLICY "Anyone can create chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view chat sessions" ON chat_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update chat sessions" ON chat_sessions
  FOR UPDATE USING (true);
