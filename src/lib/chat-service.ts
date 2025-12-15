import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import {
  ONBOARDING_SYSTEM_PROMPT,
  DATA_EXTRACTION_SYSTEM_PROMPT,
  WEEKLY_PLANNING_SYSTEM_PROMPT
} from './chat-prompts'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ProcessChatResult {
  message: string
  completed: boolean
}

export async function processChatMessage(
  userMessage: string,
  chatHistory: ChatMessage[],
  chatType: 'onboarding' | 'weekly-planning'
): Promise<ProcessChatResult> {
  const systemPrompt = chatType === 'onboarding'
    ? ONBOARDING_SYSTEM_PROMPT
    : WEEKLY_PLANNING_SYSTEM_PROMPT

  const completionMarker = chatType === 'onboarding'
    ? 'PROFILE_COMPLETE'
    : 'SCHEDULE_COMPLETE'

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...chatHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userMessage }
  ]

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    messages,
  })

  const responseText = result.text
  const completed = responseText.includes(completionMarker)

  // Clean up the response by removing the marker
  const cleanMessage = responseText.replace(completionMarker, '').trim()

  return {
    message: cleanMessage,
    completed,
  }
}

export async function extractOnboardingData(
  chatHistory: ChatMessage[]
): Promise<Record<string, unknown>> {
  const conversationText = chatHistory
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      { role: 'system', content: DATA_EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: `Extract the profile data from this conversation:\n\n${conversationText}` }
    ],
  })

  // Parse the JSON response
  const jsonMatch = result.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from response')
  }

  return JSON.parse(jsonMatch[0])
}

export async function extractWeeklyContext(
  chatHistory: ChatMessage[]
): Promise<Record<string, unknown>> {
  const conversationText = chatHistory
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      {
        role: 'system',
        content: `Extract weekly schedule constraints from this conversation. Return JSON with:
{
  "busy_days": ["day names that need quick meals"],
  "skip_days": ["day names not needing dinner"],
  "special_events": [{"day": "...", "event": "...", "needs": "..."}],
  "requests": ["any specific meal requests"]
}`
      },
      { role: 'user', content: conversationText }
    ],
  })

  const jsonMatch = result.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { busy_days: [], skip_days: [], special_events: [], requests: [] }
  }

  return JSON.parse(jsonMatch[0])
}
