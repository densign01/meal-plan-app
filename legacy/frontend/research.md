# Four-Tab Redesign Research: Meal Planning App

## Executive Summary

The current meal planning app uses a sequential workflow managed by the `AgentOrchestrator` component. This research analyzes the existing architecture to plan a redesign into a four-tab interface: Home/Chat, Meal Plan, Grocery List, and Profile.

## 1. Current UI Structure Analysis

### App.tsx Structure
```tsx
// /Users/densign/Documents/Coding projects/Meal-plan/frontend/src/App.tsx
<QueryClientProvider client={queryClient}>
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm border-b">
      <h1>Meal Plan Assistant</h1>
    </header>
    <main className="max-w-4xl mx-auto px-4 py-8">
      <AgentOrchestrator />
    </main>
  </div>
</QueryClientProvider>
```

**Key Findings:**
- Uses React Query for state management and API calls
- Fixed max-width layout (max-w-4xl)
- Simple header with app title and description
- Tailwind CSS for styling throughout

### AgentOrchestrator Current Flow
```tsx
// Current sequential workflow
'start_onboarding' → 'start_weekly_planning' → 'generate_meal_plan'
```

**Current Progress Indicator:**
- Three-step visual indicator (Setup → Planning → Meal Plan)
- Uses numbered circles with connecting lines
- State-aware styling for current step

## 2. Existing Components Analysis & Reuse Opportunities

### Tab 1: Home/Chat
**Primary Components to Reuse:**
- `OnboardingAgent` (/Users/densign/Documents/Coding projects/Meal-plan/frontend/src/components/agents/OnboardingAgent.tsx)
- `WeeklyPlanningAgent` (/Users/densign/Documents/Coding projects/Meal-plan/frontend/src/components/agents/WeeklyPlanningAgent.tsx)
- `ChatInterface` (/Users/densign/Documents/Coding projects/Meal-plan/frontend/src/components/shared/ChatInterface.tsx)

**Key Features:**
```tsx
// ChatInterface - Reusable for any chat functionality
interface ChatInterfaceProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
}
```

### Tab 2: Meal Plan
**Primary Component to Reuse:**
- `MealPlanAgent` (/Users/densign/Documents/Coding projects/Meal-plan/frontend/src/components/agents/MealPlanAgent.tsx)

**Key Visual Components:**
```tsx
// Day selector sidebar
<div className="space-y-2">
  {days.map((day) => (
    <button className={selectedDay === day ? 'bg-blue-600 text-white' : 'bg-gray-50'}>
      <div className="font-medium">{dayNames[day]}</div>
      <div className="text-sm opacity-75 truncate">{mealPlan.meals[day]?.name}</div>
    </button>
  ))}
</div>

// Recipe detail view
<div className="bg-white rounded-lg shadow-sm border p-6">
  <h3>{selectedRecipe.name}</h3>
  <div className="flex items-center space-x-6 mb-6 text-sm text-gray-600">
    <div><Clock /> {totalTime} min total</div>
    <div><Users /> {servings} servings</div>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>Ingredients</div>
    <div>Instructions</div>
  </div>
</div>
```

### Tab 3: Grocery List
**Component to Extract from MealPlanAgent:**
```tsx
// Current grocery list section (lines 249-282 in MealPlanAgent.tsx)
<div className="bg-white rounded-lg shadow-sm border p-6">
  <div className="flex items-center justify-between mb-4">
    <h3><ShoppingCart />Grocery List</h3>
    <button onClick={exportGroceryList}>
      <Download />Export List
    </button>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Object.entries(groceryList.items).map(([category, items]) => (
      <div key={category}>
        <h4>{category}</h4>
        <ul>{items.map(item => <li>• {item}</li>)}</ul>
      </div>
    ))}
  </div>
</div>
```

### Tab 4: Profile
**Components to Create/Extract:**
- Extract household profile management from onboarding
- **Note: Onboarding requirement change** - Only need ages for children, not adults

**Current HouseholdProfile Type:**
```tsx
export interface HouseholdProfile {
  id?: string
  members: HouseholdMember[]  // Current: { name, age, is_adult, dietary_restrictions }
  cooking_skill: 'beginner' | 'intermediate' | 'advanced'
  max_cooking_time: number
  budget_per_week?: number
  favorite_cuisines: string[]
  dislikes: string[]
  kitchen_equipment: string[]
}
```

**Required Profile Type Update:**
```tsx
export interface HouseholdMember {
  name: string
  age?: number  // Only required for children
  is_adult: boolean
  dietary_restrictions: string[]
}
```

## 3. Tab/Navigation Patterns

### Current Navigation Pattern
The app currently uses state-based navigation in `AgentOrchestrator`:
```tsx
const [currentAgent, setCurrentAgent] = useState<AgentIntent>('start_onboarding')
const [context, setContext] = useState<any>({})

const handleAgentTransition = (nextAgent: AgentIntent, newContext: any = {}) => {
  setContext({ ...context, ...newContext })
  setCurrentAgent(nextAgent)
}
```

### Recommended Tab Navigation Pattern
**Option 1: React Router (Recommended)**
```tsx
// Install react-router-dom
<BrowserRouter>
  <TabNavigation />
  <Routes>
    <Route path="/" element={<HomeTab />} />
    <Route path="/meal-plan" element={<MealPlanTab />} />
    <Route path="/grocery" element={<GroceryTab />} />
    <Route path="/profile" element={<ProfileTab />} />
  </Routes>
</BrowserRouter>
```

**Option 2: State-based tabs (Current Pattern)**
```tsx
const [activeTab, setActiveTab] = useState<'home' | 'meal-plan' | 'grocery' | 'profile'>('home')
```

### Proposed Tab Component Pattern
```tsx
const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
      active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
)
```

## 4. State Management Analysis

### Current State Flow
```tsx
// AgentOrchestrator manages global context
const [context, setContext] = useState<any>({
  householdId?: string,
  weeklyContext?: any
})

// Passed down to agents
<OnboardingAgent onComplete={(householdId) => handleAgentTransition('start_weekly_planning', { householdId })} />
<WeeklyPlanningAgent householdId={context.householdId} onComplete={(weeklyContext) => handleAgentTransition(...)} />
<MealPlanAgent householdId={context.householdId} weeklyContext={context.weeklyContext} />
```

### Recommended Tab State Management

**Option 1: Context Provider (Recommended)**
```tsx
// Create AppContext
interface AppContextType {
  householdId: string | null
  mealPlan: MealPlan | null
  groceryList: GroceryList | null
  householdProfile: HouseholdProfile | null
  setHouseholdId: (id: string) => void
  // ... other setters
}

// Wrap app with provider
<AppContextProvider>
  <TabNavigation />
  <TabContent />
</AppContextProvider>
```

**Option 2: React Query Global State**
```tsx
// Use React Query cache as global state
const { data: householdProfile } = useQuery({
  queryKey: ['household', householdId],
  queryFn: () => MealPlanAPI.getHouseholdProfile(householdId)
})
```

## 5. Data Models Review

### Current Types (from /Users/densign/Documents/Coding projects/Meal-plan/frontend/src/types/index.ts)

**Key Types:**
- `HouseholdMember` - Needs age requirement update
- `HouseholdProfile` - Complete profile structure
- `Recipe` - Well-structured recipe data
- `MealPlan` - Weekly meal plan with recipes
- `GroceryList` - Categorized grocery items
- `ChatMessage` - Chat interface support

**Required Updates for Profile Tab:**
```tsx
// Updated HouseholdMember type
export interface HouseholdMember {
  name: string
  age?: number  // Optional for adults, required for children
  is_adult: boolean
  dietary_restrictions: string[]
}

// Add validation helper
export const validateMember = (member: HouseholdMember): boolean => {
  if (!member.is_adult && !member.age) {
    return false // Children must have age
  }
  return true
}
```

## 6. API Integration Points

### Current API Structure (from /Users/densign/Documents/Coding projects/Meal-plan/frontend/src/services/api.ts)

**Chat APIs (Home Tab):**
- `startOnboarding()` / `continueOnboarding()`
- `startWeeklyPlanning()` / `continueWeeklyPlanning()`

**Profile APIs (Profile Tab):**
- `getHouseholdProfile(householdId)`
- `updateHouseholdProfile(householdId, updates)`

**Meal Plan APIs (Meal Plan Tab):**
- `generateMealPlan(householdId, weeklyContext)`
- `getMealPlan(mealPlanId)`
- `getHouseholdMealPlans(householdId)`

**Grocery APIs (Grocery Tab):**
- `generateGroceryList(mealPlanId)`
- `getGroceryList(groceryListId)`
- `getGroceryListByMealPlan(mealPlanId)`

## 7. UI Framework & Styling Patterns

### Current Stack
- **Framework:** React 19.1.1 with TypeScript
- **Styling:** Tailwind CSS 3.4.17
- **Icons:** Lucide React 0.544.0
- **State:** React Query 5.90.1
- **HTTP:** Axios 1.12.2

### Consistent Styling Patterns
```css
/* Common layouts */
.container { @apply max-w-4xl mx-auto px-4 py-8; }
.card { @apply bg-white rounded-lg shadow-sm border p-6; }
.button-primary { @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700; }
.button-secondary { @apply px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700; }

/* State colors */
.text-success { @apply text-green-800; }
.bg-success { @apply bg-green-50 border-green-200; }
.text-error { @apply text-red-600; }
```

## 8. Implementation Recommendations

### Phase 1: Tab Shell
1. Create tab navigation component
2. Set up routing or state-based navigation
3. Create empty tab components

### Phase 2: Extract Components
1. **Home Tab:** Combine OnboardingAgent + WeeklyPlanningAgent
2. **Meal Plan Tab:** Extract from MealPlanAgent (remove grocery section)
3. **Grocery Tab:** Extract grocery list from MealPlanAgent
4. **Profile Tab:** Create new component based on HouseholdProfile

### Phase 3: State Management
1. Implement context provider or enhance React Query usage
2. Update data flow between tabs
3. Handle tab-specific loading states

### Phase 4: Profile Updates
1. Update HouseholdMember type for age requirements
2. Update onboarding flow to only ask ages for children
3. Create profile editing interface

### Component Extraction Priority
1. **High Priority:** MealPlanAgent → MealPlanTab + GroceryTab
2. **Medium Priority:** ChatInterface → Unified chat for Home tab
3. **Low Priority:** ErrorBoundary → Tab-specific error handling

### Error Handling Pattern
The existing `ErrorBoundary` provides a good pattern:
```tsx
<ErrorBoundary onReset={resetToHome}>
  <TabContent />
</ErrorBoundary>
```

## 9. Migration Strategy

### Backward Compatibility
- Keep existing AgentOrchestrator as fallback
- Feature flag for new tab interface
- Gradual migration path

### Data Migration
- No data model changes needed except HouseholdMember.age
- Existing API endpoints work with tab structure
- Context data maps directly to tab state

### Testing Strategy
- Component unit tests for extracted components
- Integration tests for tab navigation
- E2E tests for complete user flows

## Conclusion

The existing codebase is well-structured for tab extraction. The main components can be reused with minimal changes, and the API structure already supports the tab-based approach. The primary work involves:

1. Creating tab navigation
2. Extracting grocery list from MealPlanAgent
3. Building profile management UI
4. Implementing proper state management across tabs
5. Updating age requirements for household members

The Tailwind CSS framework and existing component patterns provide a solid foundation for consistent UI across all tabs.