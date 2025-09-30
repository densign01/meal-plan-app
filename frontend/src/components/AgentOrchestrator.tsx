import { useState } from 'react'
import type { AgentIntent } from '../types'
import OnboardingAgent from './agents/OnboardingAgent'
import WeeklyPlanningAgent from './agents/WeeklyPlanningAgent'
import MealPlanAgent from './agents/MealPlanAgent'
import ErrorBoundary from './ErrorBoundary'

export default function AgentOrchestrator() {
  const [currentAgent, setCurrentAgent] = useState<AgentIntent>('start_onboarding')
  const [context, setContext] = useState<any>({})

  const handleAgentTransition = (nextAgent: AgentIntent, newContext: any = {}) => {
    setContext({ ...context, ...newContext })
    setCurrentAgent(nextAgent)
  }

  const resetToStart = () => {
    setContext({})
    setCurrentAgent('start_onboarding')
  }

  const renderCurrentAgent = () => {
    switch (currentAgent) {
      case 'start_onboarding':
      case 'continue_onboarding':
        return (
          <OnboardingAgent
            onComplete={(householdId: string) =>
              handleAgentTransition('start_weekly_planning', { householdId })
            }
            onReset={resetToStart}
          />
        )

      case 'start_weekly_planning':
      case 'continue_weekly_planning':
        return (
          <WeeklyPlanningAgent
            householdId={context.householdId}
            onComplete={(weeklyContext: any) =>
              handleAgentTransition('generate_meal_plan', {
                ...context,
                weeklyContext
              })
            }
            onBack={() => handleAgentTransition('start_onboarding')}
          />
        )

      case 'generate_meal_plan':
      case 'view_meal_plan':
        return (
          <MealPlanAgent
            householdId={context.householdId}
            weeklyContext={context.weeklyContext}
            onStartOver={resetToStart}
            onPlanNewWeek={() =>
              handleAgentTransition('start_weekly_planning', {
                householdId: context.householdId
              })
            }
          />
        )

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Unknown agent state. Starting over...</p>
            <button
              onClick={resetToStart}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start Over
            </button>
          </div>
        )
    }
  }

  return (
    <ErrorBoundary onReset={resetToStart}>
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center space-x-2 ${
            ['start_onboarding', 'continue_onboarding'].includes(currentAgent)
              ? 'text-blue-600 font-semibold'
              : 'text-gray-400'
          }`}>
            <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white text-sm">1</div>
            <span>Setup</span>
          </div>

          <div className="w-12 h-0.5 bg-gray-300"></div>

          <div className={`flex items-center space-x-2 ${
            ['start_weekly_planning', 'continue_weekly_planning'].includes(currentAgent)
              ? 'text-blue-600 font-semibold'
              : 'text-gray-400'
          }`}>
            <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white text-sm">2</div>
            <span>Planning</span>
          </div>

          <div className="w-12 h-0.5 bg-gray-300"></div>

          <div className={`flex items-center space-x-2 ${
            ['generate_meal_plan', 'view_meal_plan'].includes(currentAgent)
              ? 'text-blue-600 font-semibold'
              : 'text-gray-400'
          }`}>
            <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white text-sm">3</div>
            <span>Meal Plan</span>
          </div>
        </div>

        {/* Current agent component */}
        {renderCurrentAgent()}
      </div>
    </ErrorBoundary>
  )
}
