import { useState, useEffect } from 'react'
import { useAppContext } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { Calendar, User, MessageCircle, Plus } from 'lucide-react'
import OnboardingAgent from '../agents/OnboardingAgent'
import WeeklyPlanningAgent from '../agents/WeeklyPlanningAgent'
import AuthModal from '../AuthModal'
import ErrorBoundary from '../ErrorBoundary'

type ChatMode = 'onboarding' | 'weekly-planning' | 'meal-modification'

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  onClick: () => void
  disabled?: boolean
}

function QuickAction({ icon: Icon, title, description, onClick, disabled }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-4 rounded-lg border text-left transition-colors w-full
        ${disabled
          ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
        }
      `}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 mt-1 ${disabled ? 'text-gray-400' : 'text-blue-600'}`} />
        <div>
          <h3 className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
            {title}
          </h3>
          <p className={`text-sm mt-1 ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}

function WelcomeSection() {
  const { isOnboardingComplete, householdProfile, setActiveTab } = useAppContext()

  const quickActions = [
    {
      icon: Plus,
      title: 'Plan New Week',
      description: 'Start planning meals for a new week',
      onClick: () => {
        // This will trigger weekly planning mode
        window.location.reload() // Temporary - will implement proper state management
      },
      disabled: !isOnboardingComplete
    },
    {
      icon: Calendar,
      title: 'View Meal Plan',
      description: 'See your current weekly meal plan',
      onClick: () => setActiveTab('meal-plan'),
      disabled: !isOnboardingComplete
    },
    {
      icon: User,
      title: 'Edit Profile',
      description: 'Update household preferences and members',
      onClick: () => setActiveTab('profile'),
      disabled: !isOnboardingComplete
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isOnboardingComplete
            ? `Welcome back${householdProfile?.members[0]?.name ? `, ${householdProfile.members[0].name}` : ''}!`
            : 'Welcome to Meal Plan Assistant'
          }
        </h2>
        <p className="text-gray-600">
          {isOnboardingComplete
            ? 'What would you like to do today?'
            : 'Let\'s get you set up with personalized meal planning'
          }
        </p>
      </div>

      {/* Quick Actions */}
      {isOnboardingComplete && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HomeTab() {
  const {
    isOnboardingComplete,
    householdId,
    setHouseholdId,
    // setHouseholdProfile,
    setActiveTab,
    resetAppState
  } = useAppContext()

  const { user } = useAuth()

  const [chatMode, setChatMode] = useState<ChatMode>('onboarding')
  const [showChat, setShowChat] = useState(!isOnboardingComplete)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Handle returning user who logs in - skip onboarding if they already have a profile
  useEffect(() => {
    if (user && isOnboardingComplete && householdId) {
      // User just logged in and already has a profile, hide onboarding chat
      setShowChat(false)
      setChatMode('meal-modification') // Default to meal modification for returning users
    }
  }, [user, isOnboardingComplete, householdId])

  // Update showChat when onboarding completion status changes
  useEffect(() => {
    if (!isOnboardingComplete && !showChat) {
      setShowChat(true)
      setChatMode('onboarding')
    }
  }, [isOnboardingComplete, showChat])

  const handleOnboardingComplete = (newHouseholdId: string) => {
    setHouseholdId(newHouseholdId)
    // The profile will be set by the onboarding agent
    setShowChat(false)

    // Show auth modal if user is not already authenticated
    if (!user) {
      setTimeout(() => {
        setShowAuthModal(true)
      }, 500)
    } else {
      // Auto-transition to weekly planning if already authenticated
      setTimeout(() => {
        setChatMode('weekly-planning')
        setShowChat(true)
      }, 1000)
    }
  }

  const handleWeeklyPlanningComplete = () => {
    setShowChat(false)
    // Auto-transition to meal plan tab
    setTimeout(() => {
      setActiveTab('meal-plan')
    }, 500)
  }

  const handleStartNewChat = (mode: ChatMode) => {
    setChatMode(mode)
    setShowChat(true)
  }

  const handleReset = () => {
    resetAppState()
    setChatMode('onboarding')
    setShowChat(true)
  }

  const handleAuthSuccess = () => {
    // After successful authentication, proceed to weekly planning
    setTimeout(() => {
      setChatMode('weekly-planning')
      setShowChat(true)
    }, 500)
  }

  const handleAuthSkip = () => {
    // User chose to continue without account, proceed to weekly planning
    setTimeout(() => {
      setChatMode('weekly-planning')
      setShowChat(true)
    }, 500)
  }

  return (
    <ErrorBoundary onReset={handleReset}>
      <div className="space-y-8">
        {/* Welcome Section - always visible */}
        <WelcomeSection />

        {/* Chat Section - conditional */}
        {showChat && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {chatMode === 'onboarding' && 'Profile Setup'}
                {chatMode === 'weekly-planning' && 'Weekly Planning'}
                {chatMode === 'meal-modification' && 'Chat with Assistant'}
              </h3>
            </div>

            {chatMode === 'onboarding' && (
              <OnboardingAgent
                onComplete={handleOnboardingComplete}
                onReset={handleReset}
              />
            )}

            {chatMode === 'weekly-planning' && householdId && (
              <WeeklyPlanningAgent
                householdId={householdId}
                onComplete={handleWeeklyPlanningComplete}
                onBack={() => {
                  setChatMode('onboarding')
                  setShowChat(true)
                }}
              />
            )}

            {/* Future: meal-modification chat */}
            {chatMode === 'meal-modification' && (
              <div className="text-center py-8 text-gray-500">
                <p>Meal modification chat coming soon!</p>
                <button
                  onClick={() => setShowChat(false)}
                  className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close Chat
                </button>
              </div>
            )}
          </div>
        )}

        {/* Show chat toggle when hidden */}
        {!showChat && isOnboardingComplete && (
          <div className="text-center">
            <button
              onClick={() => handleStartNewChat('meal-modification')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with Assistant</span>
            </button>
          </div>
        )}

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-gray-600">
            <p>Debug: Onboarding Complete: {isOnboardingComplete ? 'Yes' : 'No'}</p>
            <p>Debug: Household ID: {householdId || 'None'}</p>
            <p>Debug: Chat Mode: {chatMode}</p>
            <p>Debug: Show Chat: {showChat ? 'Yes' : 'No'}</p>
            <p>Debug: User: {user ? user.email : 'Not authenticated'}</p>
          </div>
        )}
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          handleAuthSkip()
        }}
        onSuccess={handleAuthSuccess}
      />
    </ErrorBoundary>
  )
}