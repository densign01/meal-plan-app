import { useState, useEffect } from 'react'
import { useAppContext } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { MealPlanAPI } from '../../services/api'
import { Calendar, User, MessageCircle, Plus, CheckCircle } from 'lucide-react'
import OnboardingAgent from '../agents/OnboardingAgent'
import WeeklyPlanningAgent from '../agents/WeeklyPlanningAgent'
import AuthModal from '../AuthModal'
import ErrorBoundary from '../ErrorBoundary'

type ChatMode = 'onboarding' | 'onboarding-complete' | 'weekly-planning' | 'meal-modification'

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

function WelcomeSection({ onStartMealPlanning }: { onStartMealPlanning: () => void }) {
  const { isOnboardingComplete, householdProfile, setActiveTab } = useAppContext()

  const quickActions = [
    {
      icon: Plus,
      title: 'Plan New Week',
      description: 'Start planning meals for a new week',
      onClick: onStartMealPlanning,
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
    setHouseholdProfile,
    setActiveTab,
    resetAppState
  } = useAppContext()

  const { user } = useAuth()

  const [chatMode, setChatMode] = useState<ChatMode>('onboarding')
  const [showChat, setShowChat] = useState(!isOnboardingComplete)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [weeklyContext, setWeeklyContext] = useState<any>(null)
  const [generatedMealPlan, setGeneratedMealPlan] = useState<any>(null)

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

  const handleOnboardingComplete = (newHouseholdId: string, profileData?: any) => {
    setHouseholdId(newHouseholdId)

    // Set the profile data if provided
    if (profileData) {
      setHouseholdProfile(profileData)
    }

    // Show completion message and ask about meal planning
    setChatMode('onboarding-complete')
    setShowChat(true)

    // Show auth modal if user is not already authenticated
    if (!user) {
      setTimeout(() => {
        setShowAuthModal(true)
      }, 2000)
    }
  }

  const handleWeeklyPlanningComplete = (mealPlan: any) => {
    // Store the generated meal plan and transition to meal plan tab
    console.log('📅 Weekly planning and meal plan generation completed:', mealPlan)
    setGeneratedMealPlan(mealPlan)

    // Hide chat and go to meal plan tab
    setShowChat(false)
    setTimeout(() => {
      setActiveTab('meal-plan')
    }, 500)
  }


  const handleStartNewChat = (mode: ChatMode) => {
    setChatMode(mode)
    setShowChat(true)
  }

  const handleStartMealPlanning = () => {
    console.log('🚀 Starting meal planning')
    console.log('📋 Current state:', { isOnboardingComplete, householdId, chatMode, showChat })
    setChatMode('weekly-planning')
    setShowChat(true)
    console.log('✅ Set chat mode to weekly-planning and showChat to true')
  }

  const handleSkipMealPlanning = () => {
    setShowChat(false)
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
        <WelcomeSection onStartMealPlanning={handleStartMealPlanning} />

        {/* Chat Section - conditional */}
        {showChat && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-4">
              {(chatMode === 'onboarding-complete' || chatMode === 'weekly-complete') ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <MessageCircle className="w-5 h-5 text-blue-600" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {chatMode === 'onboarding' && 'Profile Setup'}
                {chatMode === 'onboarding-complete' && 'Setup Complete!'}
                {chatMode === 'weekly-planning' && 'Weekly Planning & Meal Generation'}
                {chatMode === 'meal-modification' && 'Chat with Assistant'}
              </h3>
            </div>

            {chatMode === 'onboarding' && (
              <OnboardingAgent
                onComplete={handleOnboardingComplete}
                onReset={handleReset}
              />
            )}

            {chatMode === 'onboarding-complete' && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Thanks! Your profile is all set up.
                </h3>
                <p className="text-gray-600 mb-6">
                  Your household profile has been saved. Would you like to create your first meal plan?
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleStartMealPlanning}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Yes, let's create a meal plan!
                  </button>
                  <button
                    onClick={handleSkipMealPlanning}
                    className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            )}

            {chatMode === 'weekly-planning' && (
              <>
                {(() => {
                  console.log('🔍 Weekly planning render check:', { chatMode, householdId, showChat })
                  return householdId ? (
                    <WeeklyPlanningAgent
                      householdId={householdId}
                      onComplete={handleWeeklyPlanningComplete}
                      onBack={() => setShowChat(false)}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-red-600 mb-4">
                        Error: No household profile found. Please complete onboarding first.
                      </p>
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Start Over
                      </button>
                    </div>
                  )
                })()}
              </>
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