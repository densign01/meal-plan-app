import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { MealPlan, GroceryList } from '../types'
import { MealPlanAPI } from '../services/api'
import { useHousehold } from './HouseholdContext'

interface MealPlanContextType {
  currentMealPlan: MealPlan | null
  currentGroceryList: GroceryList | null
  isLoading: boolean
  hasActiveMealPlan: () => boolean
  hasActiveGroceryList: () => boolean
  setCurrentMealPlan: (plan: MealPlan | null) => void
  setCurrentGroceryList: (list: GroceryList | null) => void
  refetchMealPlans: () => void
}

const MealPlanContext = createContext<MealPlanContextType | undefined>(undefined)

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const { householdId } = useHousehold()
  const queryClient = useQueryClient()

  // Fetch meal plans with React Query
  const { data: mealPlans, isLoading, refetch: refetchMealPlans } = useQuery({
    queryKey: ['mealPlans', householdId],
    queryFn: async () => {
      if (!householdId) return []
      try {
        const { meal_plans } = await MealPlanAPI.getHouseholdMealPlans(householdId)
        return meal_plans || []
      } catch {
        return []
      }
    },
    enabled: !!householdId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const currentMealPlan = mealPlans && mealPlans.length > 0 ? mealPlans[0] : null
  const currentGroceryList = null // TODO: Implement grocery list fetching

  const hasActiveMealPlan = () => currentMealPlan !== null
  const hasActiveGroceryList = () => currentGroceryList !== null

  // Manual setters for backwards compatibility (can be removed once components are refactored)
  const setCurrentMealPlan = (plan: MealPlan | null) => {
    queryClient.setQueryData(['mealPlans', householdId], plan ? [plan] : [])
  }

  const setCurrentGroceryList = (_list: GroceryList | null) => {
    // TODO: Implement when grocery list is ready
  }

  const value: MealPlanContextType = {
    currentMealPlan,
    currentGroceryList,
    isLoading,
    hasActiveMealPlan,
    hasActiveGroceryList,
    setCurrentMealPlan,
    setCurrentGroceryList,
    refetchMealPlans,
  }

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>
}

export function useMealPlan() {
  const context = useContext(MealPlanContext)
  if (context === undefined) {
    throw new Error('useMealPlan must be used within a MealPlanProvider')
  }
  return context
}
