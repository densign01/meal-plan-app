# Four-Tab Redesign Implementation Plan

## Overview
Transform the current sequential meal planning app into a four-tab interface: Home (Chat), Meal Plan, Grocery List, and Profile. Include draggable meal cards and improved household member management.

## Requirements Summary
1. **Four tabs**: Home/Chat, Meal Plan, Grocery List, Profile
2. **Draggable meal cards**: Move meals between days in Meal Plan tab
3. **Profile updates**: Only require ages for children, not adults
4. **Design improvements**: Better UX and visual organization
5. **Chat functionality**: Home tab handles onboarding and meal plan modifications

## Architecture Approach

### State Management Strategy
**Context Provider + React Query Hybrid**
- Create `AppContext` for cross-tab state management
- Keep React Query for API state and caching
- Context manages: activeTab, householdId, currentMealPlan, selectedWeek

### Navigation Strategy
**State-based tabs (not router)**
- Maintain current single-page app approach
- Use state-driven tab switching for better control
- Preserve existing URL structure for now

## Implementation Plan

### Phase 1: Foundation (Tab Shell & Context)

#### 1.1 Create App Context Provider
**File: `/src/context/AppContext.tsx`**
```tsx
interface AppContextType {
  // Tab management
  activeTab: 'home' | 'meal-plan' | 'grocery' | 'profile'
  setActiveTab: (tab: string) => void

  // Cross-tab data
  householdId: string | null
  setHouseholdId: (id: string) => void
  currentMealPlan: MealPlan | null
  setCurrentMealPlan: (plan: MealPlan) => void
  currentGroceryList: GroceryList | null
  setCurrentGroceryList: (list: GroceryList) => void

  // UI state
  isOnboardingComplete: boolean
  setIsOnboardingComplete: (complete: boolean) => void
}
```

#### 1.2 Update App.tsx Structure
**File: `/src/App.tsx`**
```tsx
<QueryClientProvider client={queryClient}>
  <AppContextProvider>
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Meal Plan Assistant</h1>
          <p className="text-gray-600">AI-powered meal planning for busy families</p>
        </div>
      </header>

      <TabNavigation />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <TabContent />
      </main>
    </div>
  </AppContextProvider>
</QueryClientProvider>
```

#### 1.3 Create Tab Navigation Component
**File: `/src/components/TabNavigation.tsx`**
```tsx
import { MessageCircle, Calendar, ShoppingCart, User } from 'lucide-react'

const tabs = [
  { id: 'home', label: 'Home', icon: MessageCircle },
  { id: 'meal-plan', label: 'Meal Plan', icon: Calendar },
  { id: 'grocery', label: 'Grocery List', icon: ShoppingCart },
  { id: 'profile', label: 'Profile', icon: User }
]

// Horizontal tab bar with icons
<nav className="bg-white border-b">
  <div className="max-w-6xl mx-auto px-4">
    <div className="flex space-x-8">
      {tabs.map(tab => (
        <TabButton key={tab.id} {...tab} />
      ))}
    </div>
  </div>
</nav>
```

#### 1.4 Create Tab Content Router
**File: `/src/components/TabContent.tsx`**
```tsx
export default function TabContent() {
  const { activeTab } = useAppContext()

  switch (activeTab) {
    case 'home': return <HomeTab />
    case 'meal-plan': return <MealPlanTab />
    case 'grocery': return <GroceryTab />
    case 'profile': return <ProfileTab />
    default: return <HomeTab />
  }
}
```

### Phase 2: Tab Component Implementation

#### 2.1 Home Tab (Chat Functionality)
**File: `/src/components/tabs/HomeTab.tsx`**

**Purpose**: Unified chat interface for onboarding and meal plan modifications
**Components to reuse**: OnboardingAgent, WeeklyPlanningAgent, ChatInterface

```tsx
// State-driven chat modes
type ChatMode = 'onboarding' | 'weekly-planning' | 'meal-modification'

// Intelligent chat routing based on app state
const determineChatMode = (householdId: string | null, isOnboardingComplete: boolean): ChatMode => {
  if (!householdId || !isOnboardingComplete) return 'onboarding'
  return 'meal-modification' // Default for existing users
}

// UI Structure
<div className="space-y-6">
  <div className="text-center">
    <h2>Welcome to Meal Plan Assistant</h2>
    <p>Chat with me to plan your meals or make changes</p>
  </div>

  {!isOnboardingComplete && <OnboardingFlow />}
  {isOnboardingComplete && <MealPlanChat />}

  <QuickActions />
</div>
```

**Quick Actions Component**:
- "Plan New Week" button
- "Modify Current Plan" button
- "Update Profile" button (navigates to Profile tab)

#### 2.2 Meal Plan Tab (Visual Calendar + Drag/Drop)
**File: `/src/components/tabs/MealPlanTab.tsx`**

**Purpose**: Weekly meal plan with draggable meal cards
**Components to extract**: Day sidebar + recipe details from MealPlanAgent

```tsx
// Key Features
- Weekly calendar view (Sun-Sat)
- Draggable meal cards between days
- Recipe detail panel
- Meal plan generation controls

// Drag and Drop Implementation
import { DndProvider, useDrag, useDrop } from 'react-dnd'

interface DraggableMealCard {
  day: string
  recipe: Recipe
  onDrop: (targetDay: string) => void
}

// UI Structure
<DndProvider backend={HTML5Backend}>
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    {/* Week View */}
    <div className="lg:col-span-3">
      <WeeklyCalendar mealPlan={currentMealPlan} onMealMove={handleMealMove} />
    </div>

    {/* Recipe Details */}
    <div className="lg:col-span-1">
      <RecipeDetailPanel selectedRecipe={selectedRecipe} />
    </div>
  </div>
</DndProvider>
```

**WeeklyCalendar Component**:
```tsx
<div className="grid grid-cols-7 gap-4">
  {days.map(day => (
    <DayColumn key={day} day={day} meal={mealPlan.meals[day]} onMealDrop={onMealMove} />
  ))}
</div>
```

**DayColumn Component** (Drop Zone):
```tsx
const [{ isOver }, drop] = useDrop({
  accept: 'meal',
  drop: (item: { sourceDay: string }) => onMealDrop(item.sourceDay, day),
  collect: monitor => ({ isOver: monitor.isOver() })
})

<div ref={drop} className={`border-2 border-dashed ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
  <h3>{dayName}</h3>
  {meal && <DraggableMealCard meal={meal} sourceDay={day} />}
</div>
```

#### 2.3 Grocery Tab (Enhanced List Management)
**File: `/src/components/tabs/GroceryTab.tsx`**

**Purpose**: Grocery list with categorization and export
**Components to extract**: Grocery list section from MealPlanAgent

```tsx
// Key Features
- Categorized grocery items
- PDF export functionality
- Checkbox functionality for shopping
- Cost estimation (if available)

// UI Structure
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <h2 className="text-2xl font-bold">Grocery List</h2>
    <div className="flex space-x-3">
      <button onClick={exportGroceryListPDF}>
        <Download className="w-4 h-4" />
        Export PDF
      </button>
      <button onClick={exportGroceryListText}>
        <FileText className="w-4 h-4" />
        Export Text
      </button>
    </div>
  </div>

  <GroceryListGrid groceryList={currentGroceryList} />
</div>
```

**Enhanced Features**:
- Interactive checkboxes for completed items
- Smart categorization (Produce, Meat, Dairy, etc.)
- Cost estimation integration (future)
- Shopping mode (larger text, better mobile UX)

#### 2.4 Profile Tab (Household Management)
**File: `/src/components/tabs/ProfileTab.tsx`**

**Purpose**: Household profile and member management
**New component** based on HouseholdProfile type

```tsx
// Key Features
- Household overview
- Individual member cards
- Preference editing
- Kitchen equipment management

// UI Structure
<div className="space-y-8">
  <HouseholdOverview profile={householdProfile} />
  <HouseholdMembers members={householdProfile.members} onUpdate={updateMember} />
  <CookingPreferences preferences={cookingPrefs} onUpdate={updatePreferences} />
  <KitchenEquipment equipment={kitchenEquipment} onUpdate={updateEquipment} />
</div>
```

**HouseholdMembers Component**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {members.map(member => (
    <MemberCard key={member.name} member={member} onEdit={openMemberEditor} />
  ))}
  <AddMemberCard onClick={openAddMemberForm} />
</div>
```

**MemberCard Component**:
```tsx
<div className="bg-white rounded-lg border p-4">
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-semibold">{member.name}</h3>
    <button onClick={() => onEdit(member)}>
      <Edit className="w-4 h-4" />
    </button>
  </div>

  <div className="space-y-2 text-sm text-gray-600">
    <div>{member.is_adult ? 'Adult' : `Child (${member.age} years)`}</div>
    {member.dietary_restrictions.length > 0 && (
      <div>
        <span className="font-medium">Dietary needs:</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {member.dietary_restrictions.map(restriction => (
            <span key={restriction} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {restriction}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
</div>
```

### Phase 3: Type Updates & Backend Changes

#### 3.1 Update HouseholdMember Type
**File: `/src/types/index.ts`**
```tsx
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

#### 3.2 Update Onboarding Prompt
**File: `/backend/chat.py`**
```python
# Update onboarding to only ask ages for children
ONBOARDING_SYSTEM_PROMPT = """
...
1. "Tell me about your household - how many people, their names, and ages for any children (we only need ages for kids)?"
...
"""
```

### Phase 4: Enhanced Features

#### 4.1 Drag and Drop Setup
**Dependencies to add:**
```bash
npm install react-dnd react-dnd-html5-backend @types/react-dnd
```

#### 4.2 PDF Export Enhancement
**File: `/src/utils/pdfExport.ts`**
```tsx
import jsPDF from 'jspdf'

export const exportGroceryListPDF = (groceryList: GroceryList) => {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text('Grocery List', 20, 30)

  // Categories
  let yPosition = 50
  Object.entries(groceryList.items).forEach(([category, items]) => {
    doc.setFontSize(14)
    doc.text(category.toUpperCase(), 20, yPosition)
    yPosition += 10

    items.forEach(item => {
      doc.setFontSize(10)
      doc.text(`• ${item}`, 25, yPosition)
      yPosition += 7
    })
    yPosition += 5
  })

  doc.save('grocery-list.pdf')
}
```

#### 4.3 Smart Tab Notifications
```tsx
// Badge notifications on tabs
const TabBadge = ({ count }: { count?: number }) => {
  if (!count) return null
  return (
    <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
      {count}
    </span>
  )
}

// Usage: <TabButton label="Grocery List" badge={uncheckedItemsCount} />
```

### Phase 5: Mobile Optimization

#### 5.1 Responsive Tab Navigation
```tsx
// Mobile: Bottom tab bar
// Desktop: Top horizontal tabs

const isMobile = useWindowSize().width < 768

return isMobile ? <BottomTabBar /> : <TopTabBar />
```

#### 5.2 Mobile-Specific Components
- Swipeable tabs on mobile
- Larger touch targets
- Simplified drag and drop (tap to move)

## Data Flow Architecture

### Cross-Tab State Management
```tsx
// App Context manages shared state
const AppContext = {
  // Core data
  householdId: '123',
  currentMealPlan: MealPlan,
  currentGroceryList: GroceryList,
  householdProfile: HouseholdProfile,

  // UI state
  activeTab: 'meal-plan',
  selectedMealDay: 'monday',
  selectedRecipe: Recipe,

  // Actions
  updateMealPlan: (changes) => void,
  moveMeal: (fromDay, toDay) => void,
  regenerateGroceryList: () => void
}
```

### API Integration Pattern
```tsx
// Each tab has dedicated hooks
const useMealPlanTab = (householdId: string) => {
  const { data: mealPlans } = useQuery(['mealPlans', householdId], ...)
  const { data: currentPlan } = useQuery(['currentMealPlan'], ...)

  const moveMeal = useMutation({
    mutationFn: ({ fromDay, toDay, recipe }) =>
      MealPlanAPI.updateMealPlan(currentPlan.id, { [toDay]: recipe, [fromDay]: null })
  })

  return { mealPlans, currentPlan, moveMeal }
}
```

## File Structure

```
src/
├── components/
│   ├── tabs/
│   │   ├── HomeTab.tsx           # Chat interface
│   │   ├── MealPlanTab.tsx       # Calendar + drag/drop
│   │   ├── GroceryTab.tsx        # Enhanced grocery list
│   │   └── ProfileTab.tsx        # Household management
│   ├── shared/
│   │   ├── TabNavigation.tsx     # Tab switching
│   │   ├── TabContent.tsx        # Content router
│   │   ├── DraggableMealCard.tsx # Drag and drop meals
│   │   ├── WeeklyCalendar.tsx    # 7-day grid
│   │   └── MemberCard.tsx        # Profile member cards
│   └── agents/ (existing)
├── context/
│   └── AppContext.tsx            # Cross-tab state
├── hooks/
│   ├── useMealPlanTab.tsx        # Meal plan operations
│   ├── useGroceryTab.tsx         # Grocery operations
│   └── useProfileTab.tsx         # Profile operations
├── utils/
│   ├── pdfExport.ts              # Enhanced PDF generation
│   └── dragAndDrop.ts            # Drag/drop utilities
└── types/
    └── index.ts                  # Updated member types
```

## Migration Strategy

### Phase Implementation Order
1. **Week 1**: Tab shell + context (Phase 1)
2. **Week 2**: Home + Profile tabs (Phase 2.1, 2.4)
3. **Week 3**: Meal Plan tab + drag/drop (Phase 2.2)
4. **Week 4**: Grocery tab + PDF export (Phase 2.3, 4.2)
5. **Week 5**: Mobile optimization + polish (Phase 5)

### Testing Strategy
- **Unit tests**: Individual tab components
- **Integration tests**: Cross-tab state management
- **E2E tests**: Complete user flows across tabs
- **Mobile tests**: Touch interactions and responsive design

### Performance Considerations
- Lazy load tab content (only render active tab)
- Memoize expensive operations (meal plan calculations)
- Optimize drag and drop (debounce position updates)
- Cache API responses aggressively with React Query

## Success Metrics
1. **UX Improvement**: Reduce clicks to access meal plan (from 3-4 to 1)
2. **Feature Usage**: Track drag/drop interactions
3. **Efficiency**: Faster grocery list access and management
4. **Profile Management**: Easier household member editing
5. **Mobile Experience**: Touch-friendly interactions

## Risk Mitigation
- **Complexity**: Start with simple state-based tabs before advanced features
- **Performance**: Profile performance bottlenecks with React DevTools
- **Mobile UX**: Test extensively on different screen sizes
- **Data Loss**: Implement auto-save for meal plan modifications
- **Browser Support**: Test drag/drop across browsers (fallback for mobile)

This plan provides a clear roadmap for transforming the sequential meal planning app into an intuitive four-tab interface while preserving existing functionality and adding powerful new features like drag-and-drop meal management.