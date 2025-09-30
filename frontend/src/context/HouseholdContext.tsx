import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { HouseholdProfile } from '../types'
import { MealPlanAPI } from '../services/api'
import { useAuth } from './AuthContext'

interface HouseholdContextType {
  householdProfile: HouseholdProfile | null
  householdId: string | null
  isOnboardingComplete: boolean
  isLoading: boolean
  updateProfile: (profile: HouseholdProfile) => Promise<void>
  refetch: () => void
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined)

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch household profile with React Query
  const { data: householdProfile, isLoading, refetch } = useQuery({
    queryKey: ['household', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      try {
        const profile = await MealPlanAPI.getHouseholdProfileByUserId(user.id)
        return profile || null
      } catch {
        return null
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Mutation for updating profile
  const updateMutation = useMutation({
    mutationFn: async (profile: HouseholdProfile) => {
      // API call to update profile would go here
      return profile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', user?.id] })
    },
  })

  const householdId = householdProfile?.id || null
  const isOnboardingComplete = !!(householdId && householdProfile)

  const value: HouseholdContextType = {
    householdProfile: householdProfile || null,
    householdId,
    isOnboardingComplete,
    isLoading,
    updateProfile: async (profile: HouseholdProfile) => {
      await updateMutation.mutateAsync(profile)
    },
    refetch,
  }

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>
}

export function useHousehold() {
  const context = useContext(HouseholdContext)
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider')
  }
  return context
}
