import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const { data, error } = await supabaseServer
      .from('household_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Household not found for user' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get household by user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
