// Backwards compatibility layer for old AppContext
// This maintains the old API while delegating to new focused contexts
import { createContext, useContext, type ReactNode } from 'react'
import type { MealPlan, GroceryList, HouseholdProfile } from '../types'
import { useNavigation, type TabType } from './NavigationContext'
import { useHousehold } from './HouseholdContext'
import { useMealPlan } from './MealPlanContext'

interface AppContextType {
  // Tab management
  activeTab: TabType
  setActiveTab: (tab: TabType) => void

  // Cross-tab data
  householdId: string | null
  setHouseholdId: (id: string | null) => void
  currentMealPlan: MealPlan | null
  setCurrentMealPlan: (plan: MealPlan | null) => void
  currentGroceryList: GroceryList | null
  setCurrentGroceryList: (list: GroceryList | null) => void
  householdProfile: HouseholdProfile | null
  setHouseholdProfile: (profile: HouseholdProfile | null) => void

  // UI state
  isOnboardingComplete: boolean
  setIsOnboardingComplete: (complete: boolean) => void
  selectedMealDay: string
  setSelectedMealDay: (day: string) => void

  // Helper methods
  hasActiveMealPlan: () => boolean
  hasActiveGroceryList: () => boolean
  resetAppState: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppContextProvider({ children }: { children: ReactNode }) {
  const navigation = useNavigation()
  const household = useHousehold()
  const mealPlan = useMealPlan()

  const value: AppContextType = {
    // Tab management
    activeTab: navigation.activeTab,
    setActiveTab: navigation.setActiveTab,

    // Cross-tab data
    householdId: household.householdId,
    setHouseholdId: () => {
      // Now managed by React Query, refetch instead
      household.refetch()
    },
    currentMealPlan: mealPlan.currentMealPlan,
    setCurrentMealPlan: mealPlan.setCurrentMealPlan,
    currentGroceryList: mealPlan.currentGroceryList,
    setCurrentGroceryList: mealPlan.setCurrentGroceryList,
    householdProfile: household.householdProfile,
    setHouseholdProfile: async (profile: HouseholdProfile | null) => {
      if (profile) {
        await household.updateProfile(profile)
      }
    },

    // UI state
    isOnboardingComplete: household.isOnboardingComplete,
    setIsOnboardingComplete: () => {
      // No-op, now derived from household state
    },
    selectedMealDay: navigation.selectedMealDay,
    setSelectedMealDay: navigation.setSelectedMealDay,

    // Helper methods
    hasActiveMealPlan: mealPlan.hasActiveMealPlan,
    hasActiveGroceryList: mealPlan.hasActiveGroceryList,
    resetAppState: () => {
      // Clear all state by refetching with null user
      navigation.setActiveTab('home')
      navigation.setSelectedMealDay('monday')
      // Query cache will be cleared on logout via AuthContext
    },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider')
  }
  return context
}

export type { TabType }
