import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { processChatMessage, extractOnboardingData } from '@/lib/chat-service'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const { message, history } = await req.json()
    const userId = req.nextUrl.searchParams.get('user_id')

    // Try to get existing session from database, but don't fail if not found
    let chatHistory: ChatMessage[] = []

    const { data: session } = await supabaseServer
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (session) {
      chatHistory = session.messages || []
    } else if (history) {
      // Use history from client if database session not found
      chatHistory = history
    }

    // Add user message to history
    chatHistory.push({ role: 'user', content: message })

    // Process with AI
    const result = await processChatMessage(message, chatHistory, 'onboarding')

    // Add assistant response to history
    chatHistory.push({ role: 'assistant', content: result.message })

    // Prepare update data
    const updateData: Record<string, unknown> = {
      messages: chatHistory,
      completed: result.completed,
      updated_at: new Date().toISOString(),
    }

    let extractedData: Record<string, unknown> | null = null

    if (result.completed) {
      try {
        // Extract profile data using AI
        extractedData = await extractOnboardingData(chatHistory)

        // Add user_id if provided
        if (userId) {
          extractedData.user_id = userId
        }

        // Create household profile in Supabase
        const { data: household, error: householdError } = await supabaseServer
          .from('household_profiles')
          .insert({
            user_id: userId || null,
            members: extractedData.members,
            cooking_skill: extractedData.cooking_skill,
            max_cooking_time: extractedData.max_cooking_time || 45,
            favorite_cuisines: extractedData.favorite_cuisines || [],
            dislikes: extractedData.dislikes || [],
            kitchen_equipment: [],
          })
          .select()
          .single()

        if (householdError) {
          console.error('Failed to create household profile:', householdError)
          throw new Error('Failed to save profile')
        }

        extractedData.id = household.id
        updateData.household_id = household.id
      } catch (error) {
        console.error('Data extraction error:', error)
        return NextResponse.json(
          { error: 'Failed to extract profile data' },
          { status: 500 }
        )
      }
    }

    // Update session
    await supabaseServer
      .from('chat_sessions')
      .update(updateData)
      .eq('id', sessionId)

    return NextResponse.json({
      message: result.message,
      session_id: sessionId,
      completed: result.completed,
      extracted_data: extractedData,
    })
  } catch (error) {
    console.error('Continue onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
