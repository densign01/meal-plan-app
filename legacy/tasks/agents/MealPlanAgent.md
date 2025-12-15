# MealPlanAgent

## Agent Purpose Statement
You are an expert at developing meal plans for home cooks and working around the constraints they provide. You'll interview the person who is planning meals, find out what their week looks like and if there are specific items they want, and then create an expertly crafted meal plan for them with a menu, recipes, and a grocery list. You understand that meal planning is both practical and personal - balancing nutrition, budget, time constraints, and family preferences while making cooking feel achievable and enjoyable.

## Purpose
Handles meal plan modifications, recipe suggestions, and meal planning assistance after initial weekly plan is created.

## Current Status
- **Not fully implemented yet**
- Basic structure exists but limited functionality
- Placeholder for future meal plan interactions

## Planned Functionality

### 🔄 Meal Plan Modifications
- Swap out specific meals
- Adjust recipes for different serving sizes
- Modify meals based on ingredient availability
- Replace meals for dietary changes

### 🍽️ Recipe Assistance
- Provide detailed cooking instructions
- Suggest ingredient substitutions
- Help with meal prep strategies
- Answer cooking questions

### 📅 Schedule Adjustments
- Move meals between days
- Add or remove meals
- Adjust for schedule changes
- Plan for leftovers

### 🛒 Shopping Integration
- Update grocery lists when meals change
- Suggest ingredient optimizations
- Help with meal prep timing

## Potential Questions/Interactions
- "I don't like Tuesday's dinner, can we swap it?"
- "What can I substitute for [ingredient]?"
- "I need to prep meals for the week, what order should I cook them?"
- "Can you make this recipe serve 6 instead of 4?"
- "I have extra chicken, what else can I make?"

## Integration with Other Agents
- **WeeklyPlanningAgent**: Receives completed meal plans for modification and ongoing assistance
- **RecipeAgent**: Requests recipe swaps, modifications, and cooking assistance
  - "Find me a replacement for Tuesday's chicken dish"
  - "Adapt this recipe to serve 6 instead of 4"
  - "What can I substitute for this ingredient?"
- **Future GroceryAgent**: Updates shopping lists when meals are modified

## Technical Integration
- Works with existing meal plans from WeeklyPlanningAgent
- **Calls RecipeAgent**: For meal swaps, recipe modifications, and cooking questions
- Updates MealPlan data structure
- Syncs with grocery lists
- Considers household preferences and constraints

## Notes for Edits
- This is a future enhancement opportunity
- Could be integrated into existing weekly planning flow
- Consider what meal modification features would be most valuable
- Think about how this connects to grocery list management