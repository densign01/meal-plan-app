-- Household Profiles Table
CREATE TABLE household_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    members JSONB NOT NULL,
    cooking_skill TEXT NOT NULL CHECK (cooking_skill IN ('beginner', 'intermediate', 'advanced')),
    max_cooking_time INTEGER NOT NULL,
    budget_per_week DECIMAL(10,2),
    favorite_cuisines TEXT[],
    dislikes TEXT[],
    kitchen_equipment TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal Plans Table
CREATE TABLE meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID REFERENCES household_profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    meals JSONB NOT NULL,
    weekly_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grocery Lists Table
CREATE TABLE grocery_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    total_estimated_cost DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Sessions Table (for conversational onboarding)
CREATE TABLE chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_type TEXT NOT NULL CHECK (session_type IN ('onboarding', 'weekly_planning')),
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    household_id UUID REFERENCES household_profiles(id) ON DELETE SET NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_meal_plans_household_id ON meal_plans(household_id);
CREATE INDEX idx_meal_plans_week_start ON meal_plans(week_start_date);
CREATE INDEX idx_grocery_lists_meal_plan_id ON grocery_lists(meal_plan_id);
CREATE INDEX idx_chat_sessions_household_id ON chat_sessions(household_id);
CREATE INDEX idx_chat_sessions_type ON chat_sessions(session_type);