import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { MealPlanAPI } from '../../services/api'
import type { ChatMessage } from '../../types'
import ChatInterface from '../shared/ChatInterface'
import { ArrowLeft } from 'lucide-react'

interface WeeklyPlanningAgentProps {
  householdId: string
  onComplete: (weeklyContext: any) => void
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
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.message }
      ])

      // Check if weekly planning is complete
      if (data.completed && data.extracted_data) {
        setIsCompleted(true)
        setTimeout(() => onComplete(data.extracted_data), 1000)
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

  const isLoading = startMutation.isPending || continueMutation.isPending

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

      {isCompleted && (
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-800 font-medium">
            ✅ Week planned! Generating your personalized meal plan...
          </p>
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
