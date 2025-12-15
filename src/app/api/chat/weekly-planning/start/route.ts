import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { WEEKLY_PLANNING_WELCOME } from '@/lib/chat-prompts'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const { household_id } = await req.json()

    if (!household_id) {
      return NextResponse.json(
        { error: 'household_id is required' },
        { status: 400 }
      )
    }

    const sessionId = uuidv4()

    // Create new chat session in Supabase
    const { error } = await supabaseServer
      .from('chat_sessions')
      .insert({
        id: sessionId,
        session_type: 'weekly_planning',
        messages: [],
        completed: false,
        household_id,
      })

    if (error) {
      console.error('Failed to create weekly planning session:', error)
      // Continue without persistence
      console.log('Continuing without database persistence...')
    }

    return NextResponse.json({
      session_id: sessionId,
      message: WEEKLY_PLANNING_WELCOME,
    })
  } catch (error) {
    console.error('Start weekly planning error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
