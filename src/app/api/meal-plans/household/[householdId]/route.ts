import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ householdId: string }> }
) {
  try {
    const { householdId } = await params

    const { data, error } = await supabaseServer
      .from('meal_plans')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Get meal plans error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch meal plans' },
        { status: 500 }
      )
    }

    return NextResponse.json({ meal_plans: data || [] })
  } catch (error) {
    console.error('Get meal plans error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
