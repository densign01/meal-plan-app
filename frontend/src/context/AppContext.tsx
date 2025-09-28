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
  const [householdId, setHouseholdId] = useState<string | null>(() => {
    // Try to restore from localStorage on initial load
    try {
      return localStorage.getItem('householdId')
    } catch {
      return null
    }
  })
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null)
  const [currentGroceryList, setCurrentGroceryList] = useState<GroceryList | null>(null)
  const [householdProfile, setHouseholdProfile] = useState<HouseholdProfile | null>(() => {
    // Try to restore from localStorage on initial load
    try {
      const stored = localStorage.getItem('householdProfile')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  const [selectedMealDay, setSelectedMealDay] = useState('monday')

  const { user } = useAuth()

  // Persist householdId to localStorage when it changes
  useEffect(() => {
    try {
      if (householdId) {
        localStorage.setItem('householdId', householdId)
        console.log('AppContext: Saved householdId to localStorage:', householdId)
      } else {
        localStorage.removeItem('householdId')
        console.log('AppContext: Removed householdId from localStorage')
      }
    } catch (error) {
      console.warn('AppContext: Failed to persist householdId:', error)
    }
  }, [householdId])

  // Persist householdProfile to localStorage when it changes
  useEffect(() => {
    try {
      if (householdProfile) {
        localStorage.setItem('householdProfile', JSON.stringify(householdProfile))
        console.log('AppContext: Saved householdProfile to localStorage')
      } else {
        localStorage.removeItem('householdProfile')
        console.log('AppContext: Removed householdProfile from localStorage')
      }
    } catch (error) {
      console.warn('AppContext: Failed to persist householdProfile:', error)
    }
  }, [householdProfile])

  // Load existing household data when user authenticates
  useEffect(() => {
    const loadUserData = async () => {
      if (user && !householdId && !householdProfile) {
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

              // Also load their recent meal plans
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
  }, [user]) // Remove householdId and householdProfile from dependencies to avoid loop

  // Track user authentication state for debugging
  useEffect(() => {
    console.log('🔍 AppContext: User state changed')
    console.log('👤 User object:', user)
    console.log('📊 Current state:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasHouseholdId: !!householdId,
      householdIdValue: householdId,
      hasProfile: !!householdProfile
    })

    // TEMPORARILY DISABLE AUTO-CLEARING to stop the loop
    // We'll handle logout manually when needed
    console.log('ℹ️ Auto-clearing disabled - data will persist across auth state changes')
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
    setHouseholdId(null)
    setCurrentMealPlan(null)
    setCurrentGroceryList(null)
    setHouseholdProfile(null)
    setIsOnboardingComplete(false)
    setActiveTab('home')
    setSelectedMealDay('monday')

    // Clear localStorage
    try {
      localStorage.removeItem('householdId')
      localStorage.removeItem('householdProfile')
      console.log('AppContext: Cleared localStorage')
    } catch (error) {
      console.warn('AppContext: Failed to clear localStorage:', error)
    }
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