import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { processChatMessage, extractWeeklyContext } from '@/lib/chat-service'

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
    const result = await processChatMessage(message, chatHistory, 'weekly-planning')

    // Add assistant response to history
    chatHistory.push({ role: 'assistant', content: result.message })

    // Prepare update data
    const updateData: Record<string, unknown> = {
      messages: chatHistory,
      completed: result.completed,
      updated_at: new Date().toISOString(),
    }

    let weeklyContext: Record<string, unknown> | null = null

    if (result.completed) {
      try {
        weeklyContext = await extractWeeklyContext(chatHistory)
        updateData.weekly_context = weeklyContext
      } catch (error) {
        console.error('Weekly context extraction error:', error)
        // Continue without extracted context
        weeklyContext = {}
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
      ready_for_generation: result.completed,
      weekly_context: weeklyContext,
    })
  } catch (error) {
    console.error('Continue weekly planning error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
