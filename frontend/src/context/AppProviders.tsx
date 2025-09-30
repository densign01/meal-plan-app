import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './AuthContext'
import { NavigationProvider } from './NavigationContext'
import { HouseholdProvider } from './HouseholdContext'
import { MealPlanProvider } from './MealPlanContext'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationProvider>
          <HouseholdProvider>
            <MealPlanProvider>
              {children}
            </MealPlanProvider>
          </HouseholdProvider>
        </NavigationProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
