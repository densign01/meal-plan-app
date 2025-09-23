import { MessageCircle, Calendar, ShoppingCart, User } from 'lucide-react'
import { useAppContext, type TabType } from '../context/AppContext'

interface TabData {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

const tabs: TabData[] = [
  { id: 'home', label: 'Home', icon: MessageCircle },
  { id: 'meal-plan', label: 'Meal Plan', icon: Calendar },
  { id: 'grocery', label: 'Grocery List', icon: ShoppingCart },
  { id: 'profile', label: 'Profile', icon: User }
]

interface TabButtonProps extends TabData {
  active: boolean
  onClick: () => void
  badge?: number
}

function TabButton({ label, icon: Icon, active, onClick, disabled, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center py-2 px-3 transition-colors relative min-h-[60px] flex-1
        ${active
          ? 'text-blue-600'
          : disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:text-gray-900'
        }
        ${disabled ? 'opacity-50' : ''}
      `}
    >
      <div className="relative">
        <Icon className="w-6 h-6 mb-1" />
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-[18px] h-4 flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-blue-600' : ''}`}>
        {label}
      </span>

      {active && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full" />
      )}
    </button>
  )
}

export default function TabNavigation() {
  const {
    activeTab,
    setActiveTab,
    isOnboardingComplete,
    hasActiveMealPlan,
    // hasActiveGroceryList
  } = useAppContext()

  const handleTabClick = (tabId: TabType) => {
    // Prevent navigation to other tabs if onboarding isn't complete
    if (!isOnboardingComplete && tabId !== 'home') {
      return
    }
    setActiveTab(tabId)
  }

  const getTabBadge = (tabId: TabType): number | undefined => {
    switch (tabId) {
      case 'meal-plan':
        // Could show number of days with meals planned
        return undefined
      case 'grocery':
        // Could show number of unchecked items
        return undefined
      default:
        return undefined
    }
  }

  const isTabDisabled = (tabId: TabType): boolean => {
    if (tabId === 'home') return false

    // Other tabs require completed onboarding
    if (!isOnboardingComplete) return true

    // Grocery tab requires an active meal plan
    if (tabId === 'grocery' && !hasActiveMealPlan()) return true

    return false
  }

  return (
    <>
      {/* Optional: Progress indicator for onboarding - moved to top */}
      {!isOnboardingComplete && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm text-blue-700">
              Complete your profile setup to access meal planning features
            </p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              {...tab}
              active={activeTab === tab.id}
              onClick={() => handleTabClick(tab.id)}
              disabled={isTabDisabled(tab.id)}
              badge={getTabBadge(tab.id)}
            />
          ))}
        </div>
      </nav>
    </>
  )
}