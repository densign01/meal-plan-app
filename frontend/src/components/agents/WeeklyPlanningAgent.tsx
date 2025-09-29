import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { MealPlanAPI } from '../../services/api'
import type { ChatMessage } from '../../types'
import ChatInterface from '../shared/ChatInterface'
import { ArrowLeft } from 'lucide-react'

interface WeeklyPlanningAgentProps {
  householdId: string
  onComplete: (mealPlan: any) => void
  onBack: () => void
}

export default function WeeklyPlanningAgent({
  householdId,
  onComplete,
  onBack
}: WeeklyPlanningAgentProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false)
  const [mealPlan, setMealPlan] = useState<any>(null)

  // Start weekly planning session
  const startMutation = useMutation({
    mutationFn: () => {
      console.log('🔄 Starting weekly planning API call with householdId:', householdId)
      return MealPlanAPI.startWeeklyPlanning(householdId)
    },
    onSuccess: (data) => {
      console.log('✅ Weekly planning started successfully:', data)
      setSessionId(data.session_id)
      setMessages([{ role: 'assistant', content: data.message }])
    },
    onError: (error) => {
      console.error('❌ Failed to start weekly planning:', error)
      setMessages([{
        role: 'assistant',
        content: 'Sorry, I had trouble starting weekly planning. Please try again.'
      }])
    }
  })

  // Continue weekly planning conversation
  const continueMutation = useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      MealPlanAPI.continueWeeklyPlanning(sessionId, message),
    onSuccess: (data, variables) => {
      // Only add the assistant message - user message already added in handleSendMessage
      setMessages(prev => [
        ...prev,
        { role: 'assistant' as const, content: data.message }
      ])

      // Check if weekly planning is complete
      if (data.completed) {
        setIsCompleted(true)
        // Get current messages including the ones we just added
        const fullChatHistory = [
          ...messages,
          { role: 'user' as const, content: variables.message },
          { role: 'assistant' as const, content: data.message }
        ]
        generateMealPlanMutation.mutate(fullChatHistory)
      }
    },
    onError: (error) => {
      console.error('Failed to continue weekly planning:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble processing that. Could you please try again?'
        }
      ])
    }
  })

  // Generate meal plan mutation using three-agent workflow
  const generateMealPlanMutation = useMutation({
    mutationFn: async (chatHistory: any) => {
      setIsGeneratingMealPlan(true)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Perfect! Now let me create your personalized meal plan...' }
      ])

      // Step 1: Get household profile
      const householdProfile = await MealPlanAPI.getHouseholdProfile(householdId)
      console.log('✅ Household profile fetched:', householdProfile)

      // Step 2: Use three-agent workflow to generate comprehensive meal plan
      const generateResult = await MealPlanAPI.generateComprehensiveMealPlan(householdId, chatHistory, householdProfile)
      console.log('✅ Comprehensive meal plan generated:', generateResult)

      return generateResult
    },
    onSuccess: (mealPlanData) => {
      setMealPlan(mealPlanData)
      setIsGeneratingMealPlan(false)

      // Create meal plan display message with proper formatting
      let mealPlanMessage = "Here's your personalized meal plan with detailed recipes!\n\n"
      if (mealPlanData?.meals) {
        Object.entries(mealPlanData.meals).forEach(([day, meal]: [string, any]) => {
          const dayName = day.charAt(0).toUpperCase() + day.slice(1)
          const mealName = meal?.name || meal || 'No meal planned'

          // Show if it has detailed recipe
          if (meal?.recipe && meal?.type === 'cooked_meal') {
            const recipe = meal.recipe
            mealPlanMessage += `${dayName}: ${mealName}\n`
            mealPlanMessage += `  ⏱️ ${recipe.total_time || recipe.prep_time + recipe.cook_time}min | 🍽️ ${recipe.servings} servings\n`
          } else {
            mealPlanMessage += `${dayName}: ${mealName}\n`
          }
        })
      }
      mealPlanMessage += "\n📅 Click 'View Full Meal Plan' below to see complete recipes with ingredients and instructions!"

      // Add the meal plan as an inline chat message
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: mealPlanMessage }
      ])

      // Don't automatically call onComplete - let user decide when to transition
    },
    onError: (error) => {
      console.error('❌ Failed to generate meal plan:', error)
      setIsGeneratingMealPlan(false)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble generating your meal plan. Would you like me to try again?'
        }
      ])
    }
  })

  // Start weekly planning when component mounts
  useEffect(() => {
    console.log('🎯 WeeklyPlanningAgent mounted with householdId:', householdId)
    if (householdId) {
      startMutation.mutate()
    } else {
      console.error('❌ No householdId provided to WeeklyPlanningAgent')
    }
  }, [householdId])

  const handleSendMessage = (message: string) => {
    if (!sessionId || isCompleted) return

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: message }])

    // Send to backend
    continueMutation.mutate({ sessionId, message })
  }

  const isLoading = startMutation.isPending || continueMutation.isPending || isGeneratingMealPlan

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Weekly Planning
          </h2>
          <p className="text-gray-600">
            Tell me about your upcoming week so I can plan your meals accordingly.
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        placeholder="Describe your week (busy days, events, etc.)..."
        disabled={isCompleted}
      />

      {mealPlan && (
        <div className="text-center">
          <button
            onClick={() => onComplete(mealPlan)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            📅 View Full Meal Plan
          </button>
        </div>
      )}

      {(startMutation.isError || continueMutation.isError) && (
        <div className="text-center space-y-4">
          <p className="text-red-600">
            Something went wrong. Please try again.
          </p>
          <button
            onClick={() => startMutation.mutate()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
