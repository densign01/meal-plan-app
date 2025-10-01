-- Create recipes table to cache generated recipes
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    cuisine TEXT,
    meal_type TEXT, -- breakfast, lunch, dinner, snack

    -- Recipe details
    prep_time INTEGER, -- minutes
    cook_time INTEGER, -- minutes
    total_time INTEGER, -- minutes
    servings INTEGER DEFAULT 4,
    difficulty TEXT, -- beginner, intermediate, advanced

    -- Recipe content (JSON)
    ingredients JSONB NOT NULL, -- array of ingredient strings
    instructions JSONB NOT NULL, -- array of instruction strings
    equipment_needed JSONB, -- array of equipment strings
    tips JSONB, -- array of tip strings

    -- Dietary and preferences
    dietary_tags JSONB, -- array like ["vegetarian", "gluten-free"]
    allergens JSONB, -- array of allergen strings

    -- Nutrition (optional)
    nutrition_per_serving JSONB, -- {calories, protein, carbs, fat}

    -- Search and matching
    keywords TEXT[], -- for full-text search
    primary_protein TEXT, -- chicken, beef, fish, tofu, etc.
    main_ingredients TEXT[], -- key ingredients for matching

    -- Usage tracking
    times_used INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT DEFAULT 'ai_generated', -- ai_generated, user_submitted, imported

    -- Full recipe JSON for easy retrieval
    full_recipe_json JSONB
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_total_time ON recipes(total_time);
CREATE INDEX IF NOT EXISTS idx_recipes_primary_protein ON recipes(primary_protein);
CREATE INDEX IF NOT EXISTS idx_recipes_keywords ON recipes USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_recipes_dietary_tags ON recipes USING GIN(dietary_tags);
CREATE INDEX IF NOT EXISTS idx_recipes_main_ingredients ON recipes USING GIN(main_ingredients);
CREATE INDEX IF NOT EXISTS idx_recipes_times_used ON recipes(times_used DESC);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER recipes_updated_at_trigger
BEFORE UPDATE ON recipes
FOR EACH ROW
EXECUTE FUNCTION update_recipes_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read recipes (they're shared across all users)
CREATE POLICY "Recipes are viewable by everyone"
ON recipes FOR SELECT
TO authenticated, anon
USING (true);

-- Only allow authenticated users to insert recipes (for now)
CREATE POLICY "Authenticated users can insert recipes"
ON recipes FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create a view for commonly used recipes
CREATE OR REPLACE VIEW popular_recipes AS
SELECT
    id,
    name,
    cuisine,
    meal_type,
    total_time,
    difficulty,
    dietary_tags,
    times_used,
    average_rating,
    primary_protein
FROM recipes
WHERE times_used > 0
ORDER BY times_used DESC, average_rating DESC NULLS LAST
LIMIT 100;
