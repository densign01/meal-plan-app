import { createContext, useContext, useState, type ReactNode } from 'react'

export type TabType = 'home' | 'meal-plan' | 'grocery' | 'profile'

interface NavigationContextType {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  selectedMealDay: string
  setSelectedMealDay: (day: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [selectedMealDay, setSelectedMealDay] = useState('monday')

  const value: NavigationContextType = {
    activeTab,
    setActiveTab,
    selectedMealDay,
    setSelectedMealDay,
  }

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
