# Agent Architecture Map

## Overview
The meal planning app uses a multi-agent architecture with clear separation of concerns between conversational agents and data processing agents.

## Current Agent Architecture Flow

### **Phase 1: Onboarding**
```
User → Frontend → Backend → Conversational Onboarding Agent
                          ↓
                    Data Extraction Agent → Supabase
                          ↓
                    household_id returned to Frontend
```

**Conversational Onboarding Agent**
- **Purpose**: Friendly, warm conversation to gather user information
- **Input**: User messages, conversation history
- **Output**: Natural language responses, completion flag
- **Data Collected**: Name, household members, ages, dietary restrictions, cooking skill, food preferences
- **Location**: `backend/chat.py` - ONBOARDING_SYSTEM_PROMPT

**Data Extraction Agent** (NEW - TO BE IMPLEMENTED)
- **Purpose**: Clinical data parsing and validation
- **Input**: Complete conversation transcript
- **Output**: Structured JSON for database
- **Schema**:
```json
{
  "members": [{"name": "string", "age": int, "is_adult": bool, "dietary_restrictions": []}],
  "cooking_skill": "beginner|intermediate|advanced",
  "favorite_cuisines": [],
  "dislikes": []
}
```

### **Phase 2: Weekly Planning**
```
User + household_id → Frontend → Backend → Weekly Planning Agent
                                        ↓
                              weekly_context extracted → Meal Plan Generation
```

**Weekly Planning Agent**
- **Purpose**: Gather weekly schedule and constraints
- **Input**: User messages about their week, household_id
- **Output**: Weekly context summary
- **Data Collected**: Busy days, special events, time constraints
- **Location**: `backend/chat.py` - WEEKLY_PLANNING_SYSTEM_PROMPT

### **Phase 3: Meal Plan Generation**
```
household_id + weekly_context → Meal Plan Generator → meal_plan_id
```

**Meal Plan Generator**
- **Purpose**: Create weekly meal assignments
- **Input**: Household profile + weekly context
- **Output**: Complete meal plan with recipes
- **Storage**: meal_plans table

### **Phase 4: Recipe Services**
```
meal_plan requirements → Recipe Agent → Individual recipes
```

**Recipe Agent**
- **Purpose**: Generate or find specific recipes
- **Input**: Meal type, cuisine, dietary restrictions, skill level
- **Output**: Detailed recipes with ingredients/instructions
- **Endpoints**: Various `/recipes/*` endpoints

### **Phase 5: Grocery List**
```
meal_plan_id → Grocery List Generator → grocery_list_id
```

**Grocery List Generator**
- **Purpose**: Consolidate ingredients into shopping list
- **Input**: Complete meal plan
- **Output**: Consolidated shopping list

## Information Flow Map

```
1. User Profile Data
   ├── Basic Info (name, household)
   ├── Dietary Info (restrictions, preferences)
   └── Cooking Info (skill level)

2. Weekly Context
   ├── Schedule constraints
   ├── Special events
   └── Meal preferences for the week

3. Meal Plans
   ├── Daily meal assignments
   ├── Recipe references
   └── Serving calculations

4. Recipes
   ├── Ingredients with quantities
   ├── Cooking instructions
   └── Nutritional info

5. Grocery Lists
   ├── Consolidated ingredients
   ├── Quantities for full week
   └── Organization by category
```

## Implementation Priority

### Immediate (Phase 1 Fixes)
1. **Separate Onboarding Agents**: Split conversational and data extraction
2. **Remove JSON Logic**: Clean conversational agent of data processing
3. **Create Data Extraction Agent**: New agent focused solely on parsing

### Future Phases
- Enhance weekly planning agent
- Improve meal plan generation
- Optimize recipe selection
- Smart grocery list consolidation

## Key Principles
- **Separation of Concerns**: Each agent has one clear responsibility
- **Conversational Agents**: Focus on user experience and natural language
- **Data Agents**: Focus on accuracy and structured output
- **Error Isolation**: Failures in one agent don't break others
- **Independent Optimization**: Each agent can be tuned separately