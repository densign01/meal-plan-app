# Recipe Cards Implementation Plan

## Overview
Enhance the recipe display system to show complete recipe details and implement proper serving size calculation (1.5x household size, rounded up).

## Changes Required

### 1. Update Recipe Type Interface
**File**: `frontend/src/types/index.ts`

Add missing fields to match backend response:
```typescript
export interface Recipe {
  // Existing fields
  name: string
  prep_time: number
  cook_time: number
  servings: number
  ingredients: string[]
  instructions: string[]
  dietary_tags: string[]

  // New fields to add
  description?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  cuisine?: string
  equipment_needed?: string[]
  tips?: string[]
  nutrition_per_serving?: {
    calories: number
    protein: string
    carbs: string
    fat: string
  }
  total_time?: number
  source_inspiration?: string
}
```

### 2. Update Backend Serving Size Calculation
**File**: `backend/services/recipe_service.py`

Modify the `get_recipe_for_meal_slot` and `develop_recipe` methods:
- Change serving calculation from `len(household_profile.get('members', []))`
- To: `math.ceil(len(household_profile.get('members', [])) * 1.5)`
- Examples:
  - 1 person → 2 servings
  - 2 people → 3 servings
  - 3 people → 5 servings
  - 4 people → 6 servings
  - 5 people → 8 servings

### 3. Update Recipe Card Modal Display
**File**: `frontend/src/components/tabs/MealPlanTab.tsx`

Enhance the existing modal (lines 255-336) to display:
- Recipe description (if available)
- Difficulty level badge
- Equipment needed section
- Tips/notes section
- Nutrition information card
- Better visual hierarchy

Layout structure:
```
┌─────────────────────────────────────┐
│ Header (name, day, close button)    │
├─────────────────────────────────────┤
│ Description (brief)                  │
│ Meta (time, servings, difficulty)   │
│ Dietary Tags                         │
├─────────────────────────────────────┤
│ Ingredients (2-column on wide)       │
├─────────────────────────────────────┤
│ Instructions (numbered steps)        │
├─────────────────────────────────────┤
│ Equipment Needed (if applicable)     │
├─────────────────────────────────────┤
│ Tips & Notes (if applicable)         │
├─────────────────────────────────────┤
│ Nutrition Info (card format)         │
└─────────────────────────────────────┘
```

### 4. Visual Enhancements
- Add difficulty badge with color coding:
  - Beginner: green
  - Intermediate: yellow
  - Advanced: red
- Make ingredient list scannable (checkboxes for future?)
- Add icons for equipment
- Use consistent spacing and typography
- Ensure mobile responsiveness

## Implementation Steps

1. **Update Types** (frontend/src/types/index.ts)
   - Add new optional fields to Recipe interface
   - Maintain backward compatibility with existing data

2. **Update Backend Serving Logic** (backend/services/recipe_service.py)
   - Import math module
   - Update serving calculation in line 141
   - Update any other places where servings are calculated

3. **Enhance Recipe Modal** (frontend/src/components/tabs/MealPlanTab.tsx)
   - Add description display
   - Add difficulty badge
   - Add equipment section (conditional rendering)
   - Add tips section (conditional rendering)
   - Add nutrition card
   - Improve responsive layout

4. **Test & Verify**
   - Generate new meal plan with updated serving sizes
   - Verify UI displays all new fields correctly
   - Test on different screen sizes
   - Verify backward compatibility with existing meal plans

## Files to Modify
1. `frontend/src/types/index.ts` - Add Recipe fields
2. `backend/services/recipe_service.py` - Update serving calculation
3. `frontend/src/components/tabs/MealPlanTab.tsx` - Enhance modal display

## Notes
- All changes maintain backward compatibility
- New fields are optional to support existing data
- Serving size change applies to all new meal plans
- Modal improvements use existing Tailwind patterns