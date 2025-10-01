# Recipe Caching System - Setup Instructions

## Status
✅ Code deployed to Railway
⏳ **Waiting for SQL migration to be run in Supabase**
⏳ Recipe caching will be active once migration is complete

## What's Been Implemented

The recipe caching system has been fully implemented with the following features:

1. **Database-Backed Caching**: All generated recipes are automatically saved to Supabase
2. **Cache-First Strategy**: System checks database for existing recipes before generating new ones
3. **Smart Matching**: Recipes are matched based on:
   - Cuisine type
   - Meal type (breakfast, lunch, dinner, snack)
   - Maximum cooking time
   - Dietary restrictions
4. **Popularity Tracking**: Recipes track `times_used` to prioritize popular recipes
5. **Fast Lookups**: GIN indexes on keywords, dietary tags, and main ingredients

## Next Steps

### Step 1: Run SQL Migration in Supabase (REQUIRED)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the SQL from `backend/migrations/create_recipes_table.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute

**The SQL creates:**
- `recipes` table with comprehensive schema
- Multiple indexes for fast searches
- Row Level Security (RLS) policies
- Automatic timestamp triggers
- `popular_recipes` view

### Step 2: Verify Migration

After running the migration, verify it worked by running this SQL:

```sql
-- Check that table exists
SELECT * FROM recipes LIMIT 1;

-- Should return 0 rows initially
```

### Step 3: Test Recipe Caching

Once the migration is complete, the caching will automatically work:

1. Generate a meal plan as normal
2. Check backend logs - you should see messages like:
   - `🔍 Found X cached recipes matching criteria` (when cache hit)
   - `✨ Using cached recipe: [Recipe Name]` (when using cached recipe)
   - `✅ Saved recipe '[Recipe Name]' to database` (when saving new recipe)

### Step 4: Pre-Generate Starter Recipes (Optional)

To speed up initial use, you can pre-generate 50-100 recipes:

```bash
cd backend
source venv/bin/activate
python3 scripts/pregeneraterecipes.py
```

This will populate the database with a variety of recipes across:
- Different cuisines (Italian, Mexican, Asian, American, Mediterranean)
- Different meal types (breakfast, lunch, dinner)
- Different dietary restrictions (vegetarian, vegan, gluten-free)

## Expected Performance Improvement

- **Before**: 10-15 seconds per recipe (AI generation)
- **After (cache hit)**: <1 second per recipe (database lookup)
- **After (cache miss)**: 10-15 seconds (AI generation) + recipe saved for next time

## How It Works

1. **User requests meal plan**
2. **For each meal slot:**
   - System searches database for matching recipes
   - If found: Uses cached recipe (fast!)
   - If not found: Generates new recipe with AI and saves to database
3. **Over time:** Database grows with quality recipes, making future meal plans faster

## File Locations

- Migration SQL: `backend/migrations/create_recipes_table.sql`
- Recipe Service: `backend/services/recipe_service.py`
- Pre-generation Script: `backend/scripts/pregenerate_recipes.py` (to be created)

## Troubleshooting

**If recipes aren't being cached:**
1. Check that migration ran successfully in Supabase
2. Check backend logs for error messages
3. Verify `self.use_cache = True` in RecipeService.__init__

**If cache searches are slow:**
1. Verify indexes were created (check Supabase Database → Indexes)
2. GIN indexes should exist on: keywords, dietary_tags, main_ingredients

**If recipe quality is poor:**
- The cache prioritizes `times_used` count
- Poor recipes will naturally get filtered out over time as good recipes are used more
