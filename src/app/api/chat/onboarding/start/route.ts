import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { ONBOARDING_WELCOME } from '@/lib/chat-prompts'
import { v4 as uuidv4 } from 'uuid'

export async function POST() {
  try {
    const sessionId = uuidv4()

    // Create new chat session in Supabase
    const { error } = await supabaseServer
      .from('chat_sessions')
      .insert({
        id: sessionId,
        session_type: 'onboarding',
        messages: [],
        completed: false,
      })

    if (error) {
      console.error('Failed to create chat session:', error)
      // If table doesn't exist or there's a DB error, continue without persistence
      // The session will work in-memory for the frontend
      console.log('Continuing without database persistence...')
    }

    return NextResponse.json({
      session_id: sessionId,
      message: ONBOARDING_WELCOME,
    })
  } catch (error) {
    console.error('Start onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
