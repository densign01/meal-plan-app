import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { MealPlanAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import type { ChatMessage } from '../../types'
import ChatInterface from '../shared/ChatInterface'
import { useLocalStorage, useLocalStorageString } from '../../hooks/useLocalStorage'

interface OnboardingAgentProps {
  onComplete: (householdId: string, profileData?: any) => void
  onReset: () => void
}

export default function OnboardingAgent({ onComplete, onReset }: OnboardingAgentProps) {
  const [sessionId, setSessionId] = useLocalStorageString('onboardingSessionId', null)
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('onboardingMessages', [])
  const [isCompleted, setIsCompleted] = useState(false)
  const { user } = useAuth()

  // Start onboarding session
  const startMutation = useMutation({
    mutationFn: MealPlanAPI.startOnboarding,
    onSuccess: (data) => {
      setSessionId(data.session_id)
      setMessages([{ role: 'assistant', content: data.message }])
    },
    onError: (error) => {
      console.error('Failed to start onboarding:', error)
      setMessages([{
        role: 'assistant',
        content: 'Sorry, I had trouble starting. Please try refreshing the page.'
      }])
    }
  })

  // Continue onboarding conversation
  const continueMutation = useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      MealPlanAPI.continueOnboarding(sessionId, message, user?.id),
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.message }
      ])

      // Check if onboarding is complete
      if (data.completed && data.extracted_data) {
        setIsCompleted(true)
        // Extract household ID from the response
        const householdId = data.extracted_data?.id
        if (!householdId) {
          console.error('No household ID received from backend')
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: 'There was an issue saving your profile. Please try again.'
            }
          ])
          return
        }
        setTimeout(() => onComplete(householdId, data.extracted_data), 3000)
      }
    },
    onError: (error) => {
      console.error('Failed to continue onboarding:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble processing that. Could you please try again?'
        }
      ])
    }
  })

  // Start onboarding when component mounts (only if no existing session)
  useEffect(() => {
    console.log('🎯 OnboardingAgent mounted')
    console.log('📦 Existing sessionId:', sessionId)
    console.log('📦 Existing messages:', messages.length)

    // Only start a new session if we don't have one and have no messages
    if (!sessionId && messages.length === 0) {
      console.log('🆕 Starting new onboarding session')
      startMutation.mutate()
    } else if (sessionId && messages.length > 0) {
      console.log('♻️ Restoring existing onboarding session from localStorage')
    }
  }, [])

  const handleSendMessage = (message: string) => {
    if (!sessionId || isCompleted) return

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: message }])

    // Send to backend
    continueMutation.mutate({ sessionId, message })
  }

  const isLoading = startMutation.isPending || continueMutation.isPending

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Meal Plan Assistant
        </h2>
        <p className="text-gray-600">
          Let's start by learning about your household and cooking preferences.
        </p>
      </div>

      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        placeholder="Tell me about your household..."
        disabled={isCompleted}
      />

      {isCompleted && (
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-800 font-medium">
            ✅ Profile setup complete! Moving to weekly planning...
          </p>
        </div>
      )}

      {(startMutation.isError || continueMutation.isError) && (
        <div className="text-center space-y-4">
          <p className="text-red-600">
            Something went wrong. Please try again.
          </p>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  )
}
