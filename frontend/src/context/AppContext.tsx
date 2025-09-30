import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { MealPlan, GroceryList, HouseholdProfile } from '../types'
import { MealPlanAPI } from '../services/api'
import { useAuth } from './AuthContext'
import { useLocalStorage, useLocalStorageString } from '../hooks/useLocalStorage'

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
  const [householdId, setHouseholdId] = useLocalStorageString('householdId', null)
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null)
  const [currentGroceryList, setCurrentGroceryList] = useState<GroceryList | null>(null)
  const [householdProfile, setHouseholdProfile] = useLocalStorage<HouseholdProfile | null>('householdProfile', null)
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  const [selectedMealDay, setSelectedMealDay] = useState('monday')

  const { user } = useAuth()

  // Load existing household data when user authenticates
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        console.log('AppContext: Loading user data for:', user.id)
        try {
          // Try to fetch existing household profile by user ID
          const profile = await MealPlanAPI.getHouseholdProfileByUserId(user.id)

          if (profile) {
            console.log('AppContext: Found existing household profile:', profile)
            const profileId = profile.id
            if (profileId) {
              setHouseholdId(profileId)
              setHouseholdProfile(profile)

              // Always load their recent meal plans (even if we already have one, refresh from DB)
              try {
                const { meal_plans } = await MealPlanAPI.getHouseholdMealPlans(profileId)
                if (meal_plans.length > 0) {
                  setCurrentMealPlan(meal_plans[0]) // Most recent
                }
              } catch (error) {
                console.log('AppContext: No meal plans found (this is ok):', error)
              }
            }
          }
        } catch (error) {
          // User doesn't have a household profile yet, they need onboarding
          console.log('AppContext: No existing household profile found, user needs onboarding:', error)
        }
      }
    }

    loadUserData()
  }, [user]) // Only depend on user to reload data whenever user changes

  // DEBUG: Track user state changes without any clearing logic
  useEffect(() => {
    console.log('🔍 DEBUG: User changed', { user: !!user, id: user?.id })
    console.log('🚀 VERCEL BUILD CHECK: This message proves new code is deployed!')
  }, [user])

  // Auto-determine onboarding completion
  useEffect(() => {
    console.log('AppContext: Checking onboarding completion:', { householdId, householdProfile: !!householdProfile })
    if (householdId && householdProfile) {
      console.log('AppContext: Setting onboarding complete = true')
      setIsOnboardingComplete(true)
    } else {
      console.log('AppContext: Setting onboarding complete = false')
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
    console.log('AppContext: Resetting app state')
    setHouseholdId(null) // Automatically clears localStorage via useLocalStorage hook
    setCurrentMealPlan(null)
    setCurrentGroceryList(null)
    setHouseholdProfile(null) // Automatically clears localStorage via useLocalStorage hook
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