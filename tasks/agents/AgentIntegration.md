# Agent Integration into App Functionality

## Current App Structure vs. Planned Agent Architecture

### 🏗️ **Current Implementation (What Exists Now)**

#### **HomeTab.tsx**
- Contains chat interface with different modes:
  - `onboarding` → **OnboardingAgent** (✅ Implemented)
  - `onboarding-complete` → Static thank you message
  - `weekly-planning` → **WeeklyPlanningAgent** (✅ Implemented)
  - `meal-modification` → Placeholder for **MealPlanAgent**

#### **Current Agent Components**
- **OnboardingAgent.tsx** (✅ Active)
  - Collects household profile
  - Uses `MealPlanAPI.startOnboarding()` and `MealPlanAPI.continueOnboarding()`
  - Passes `extracted_data` back to HomeTab

- **WeeklyPlanningAgent.tsx** (✅ Active)
  - Creates weekly meal plans
  - Uses `MealPlanAPI.startWeeklyPlanning()` and `MealPlanAPI.continueWeeklyPlanning()`
  - Returns meal plan data

- **MealPlanAgent.tsx** (🔄 Placeholder)
  - Currently just shows "coming soon" message
  - Should handle meal modifications

### 🎯 **Planned Agent Architecture**

## Agent Interaction Flow

```
User Opens App
       ↓
1. OnboardingAgent
   - Collects household profile
   - Stores in AppContext
       ↓
2. WeeklyPlanningAgent
   - Gets household profile
   - Asks about week preferences
   - For each meal slot:
     → Calls RecipeAgent internally
   - Returns complete meal plan
       ↓
3. MealPlanAgent (ongoing)
   - Modifies existing meal plans
   - For recipe changes:
     → Calls RecipeAgent internally
       ↓
4. RecipeAgent (backend service)
   - Called by other agents
   - Sources/develops specific recipes
   - Not directly user-facing
```

## Integration Points in Current App

### **Frontend Components**
- **HomeTab** → Chat interface hosts active agents
- **MealPlanTab** → Could integrate MealPlanAgent for modifications
- **ProfileTab** → Could allow re-running OnboardingAgent for updates
- **GroceryTab** → Future integration with recipe ingredients

### **Current API Structure**
```javascript
// Existing APIs that agents use
MealPlanAPI.startOnboarding()
MealPlanAPI.continueOnboarding(sessionId, message)
MealPlanAPI.startWeeklyPlanning(householdId)
MealPlanAPI.continueWeeklyPlanning(sessionId, message)

// Needed for new agents
MealPlanAPI.startMealModification(mealPlanId) // for MealPlanAgent
MealPlanAPI.getRecipe(requirements) // for RecipeAgent
MealPlanAPI.adaptRecipe(recipeId, modifications) // for RecipeAgent
```

## Implementation Strategy

### **Phase 1: Current State (Working)**
- ✅ OnboardingAgent collecting profiles
- ✅ WeeklyPlanningAgent creating meal plans
- ✅ Basic UI flow working

### **Phase 2: Enhance WeeklyPlanningAgent**
- Add grocery shopping day and week start preferences
- Improve date selection logic
- Better integration with household profiles

### **Phase 3: Implement MealPlanAgent**
- Replace placeholder in HomeTab
- Add meal modification capabilities
- Integrate with existing meal plans

### **Phase 4: Add RecipeAgent Backend**
- Create recipe sourcing/development service
- Integrate with WeeklyPlanningAgent and MealPlanAgent
- Add recipe APIs

### **Phase 5: Advanced Features**
- MealPlanAgent integration in MealPlanTab
- Profile editing through OnboardingAgent
- Cross-tab agent interactions

## Technical Architecture

### **Agent Communication Patterns**

#### **User-Facing Agents** (Have chat interfaces)
- **OnboardingAgent** → Direct user interaction
- **WeeklyPlanningAgent** → Direct user interaction
- **MealPlanAgent** → Direct user interaction

#### **Service Agents** (Called by other agents)
- **RecipeAgent** → Internal service, no direct UI

### **Data Flow**
```
OnboardingAgent
  ↓ (household profile)
AppContext.setHouseholdProfile()
  ↓
WeeklyPlanningAgent
  ↓ (calls RecipeAgent internally)
  ↓ (meal plan)
AppContext.setCurrentMealPlan()
  ↓
MealPlanTab displays plan
  ↓
MealPlanAgent (for modifications)
  ↓ (calls RecipeAgent internally)
  ↓ (updated meal plan)
AppContext.setCurrentMealPlan()
```

## Current Gaps to Fill

### **Immediate Needs**
1. **MealPlanAgent implementation** - replace placeholder
2. **RecipeAgent backend service** - for recipe sourcing
3. **Enhanced WeeklyPlanningAgent** - add scheduling preferences

### **Future Enhancements**
1. **Cross-tab agent integration** - use agents outside HomeTab
2. **Agent memory/context** - remember user preferences
3. **Multi-agent coordination** - agents working together
4. **GroceryAgent** - for shopping list management

## Benefits of This Architecture

- **Separation of Concerns**: Each agent has a specific expertise
- **Reusability**: RecipeAgent serves multiple other agents
- **Scalability**: Easy to add new specialized agents
- **User Experience**: Conversational, context-aware interactions
- **Maintainability**: Clear boundaries between agent responsibilities