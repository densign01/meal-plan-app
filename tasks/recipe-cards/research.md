# Recipe Cards Research

## Current State Analysis

### Backend Recipe Structure
The backend has a fully implemented `RecipeService` (recipe_service.py) that generates detailed recipes with:
- Recipe metadata (name, prep_time, cook_time, servings, difficulty, cuisine)
- Complete ingredient lists (formatted with measurements)
- Step-by-step instructions
- Equipment needed
- Dietary tags
- Nutrition information per serving
- Tips and substitutions

The AI prompt uses GPT-4o-mini and is well-structured to generate practical, family-friendly recipes.

### Frontend Current Implementation
The frontend already has:
- A `Recipe` interface in types/index.ts with basic fields:
  - name, prep_time, cook_time, servings
  - ingredients (string array)
  - instructions (string array)
  - dietary_tags (string array)
- A `RecipeCard` component in MealPlanTab.tsx that displays:
  - Recipe name
  - Total time (prep + cook)
  - Servings count
  - Dietary tags (first 2 visible, "+X more")
- A modal view that shows:
  - Full ingredient list with bullet points
  - Complete instructions with numbered steps
  - All timing details

### Gaps Identified
1. **Type Mismatch**: Backend generates more fields than frontend expects:
   - Backend has: description, difficulty, equipment_needed, nutrition_per_serving, tips
   - Frontend only has: basic fields

2. **Serving Size Logic**: No implementation for 1.5x rounding:
   - Current: Uses household member count directly
   - Required: Round up (household_members * 1.5)
   - Examples: 3 people → 5 servings, 4 people → 6 servings

3. **Recipe Display**: Modal exists but could be enhanced:
   - Currently shows ingredients and instructions
   - Missing: description, difficulty, equipment, tips, nutrition

### Existing Patterns
- Tailwind CSS for styling
- Lucide icons for UI elements
- Modal pattern for detailed views
- Component composition (RecipeCard → DayCard → MealPlanTab)

## User Requirements
1. Display ingredient list ✅ (already exists)
2. Display recipe steps ✅ (already exists)
3. Easy to follow recipes ✅ (backend generates appropriate for skill level)
4. Operate within family constraints ✅ (backend considers dietary restrictions, equipment, skill)
5. **NEW**: Serving size = 1.5x household size, rounded up

## Technical Stack
- Frontend: React with Tailwind CSS
- Backend: FastAPI with OpenAI GPT-4o-mini
- Database: Supabase PostgreSQL (for storing recipes)