import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ householdId: string }> }
) {
  try {
    const { householdId } = await params

    const { data, error } = await supabaseServer
      .from('household_profiles')
      .select('*')
      .eq('id', householdId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Household not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get household error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ householdId: string }> }
) {
  try {
    const { householdId } = await params
    const updates = await req.json()

    const { data, error } = await supabaseServer
      .from('household_profiles')
      .update(updates)
      .eq('id', householdId)
      .select()
      .single()

    if (error) {
      console.error('Update household error:', error)
      return NextResponse.json(
        { error: 'Failed to update household' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update household error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
