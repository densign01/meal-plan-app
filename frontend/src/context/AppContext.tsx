import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { MealPlan, GroceryList, HouseholdProfile } from '../types'
import { MealPlanAPI } from '../services/api'
import { useAuth } from './AuthContext'

export type TabType = 'home' | 'meal-plan' | 'grocery' | 'profile'

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
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null)
  const [currentGroceryList, setCurrentGroceryList] = useState<GroceryList | null>(null)
  const [householdProfile, setHouseholdProfile] = useState<HouseholdProfile | null>(null)
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  const [selectedMealDay, setSelectedMealDay] = useState('monday')

  const { user } = useAuth()

  // Load existing household data when user authenticates
  useEffect(() => {
    const loadUserData = async () => {
      if (user && !householdId && !householdProfile) {
        try {
          // Try to fetch existing household profile by user ID
          const profile = await MealPlanAPI.getHouseholdProfileByUserId(user.id)

          if (profile) {
            console.log('Found existing household profile:', profile)
            setHouseholdId(profile.id)
            setHouseholdProfile(profile)

            // Also load their recent meal plans
            try {
              const { meal_plans } = await MealPlanAPI.getHouseholdMealPlans(profile.id)
              if (meal_plans.length > 0) {
                setCurrentMealPlan(meal_plans[0]) // Most recent
              }
            } catch (error) {
              // No meal plans yet, that's okay
            }
          }
        } catch (error) {
          // User doesn't have a household profile yet, they need onboarding
          console.log('No existing household profile found, user needs onboarding:', error)
        }
      }
    }

    loadUserData()
  }, [user, householdId, householdProfile])

  // Clear data when user logs out
  useEffect(() => {
    if (!user && (householdId || householdProfile)) {
      resetAppState()
    }
  }, [user, householdId, householdProfile])

  // Auto-determine onboarding completion
  useEffect(() => {
    if (householdId && householdProfile) {
      setIsOnboardingComplete(true)
    } else {
      setIsOnboardingComplete(false)
    }
  }, [householdId, householdProfile])

  // Allow navigation to all tabs regardless of onboarding status
  // Individual tabs will handle their own onboarding state display

  const hasActiveMealPlan = () => {
    return currentMealPlan !== null
  }

  const hasActiveGroceryList = () => {
    return currentGroceryList !== null
  }

  const resetAppState = () => {
    setHouseholdId(null)
    setCurrentMealPlan(null)
    setCurrentGroceryList(null)
    setHouseholdProfile(null)
    setIsOnboardingComplete(false)
    setActiveTab('home')
    setSelectedMealDay('monday')
  }

  const value: AppContextType = {
    // Tab management
    activeTab,
    setActiveTab,

    // Cross-tab data
    householdId,
    setHouseholdId,
    currentMealPlan,
    setCurrentMealPlan,
    currentGroceryList,
    setCurrentGroceryList,
    householdProfile,
    setHouseholdProfile,

    // UI state
    isOnboardingComplete,
    setIsOnboardingComplete,
    selectedMealDay,
    setSelectedMealDay,

    // Helper methods
    hasActiveMealPlan,
    hasActiveGroceryList,
    resetAppState,
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