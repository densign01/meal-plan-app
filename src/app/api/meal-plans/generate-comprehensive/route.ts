import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const MEAL_PLAN_GENERATOR_PROMPT = `You are a meal planning expert. Generate a 7-day dinner meal plan based on the household profile and weekly context.

For each day (monday through sunday), create a dinner that:
1. Matches the household's cooking skill and time constraints
2. Respects dietary restrictions
3. Incorporates favorite cuisines when possible
4. Avoids disliked foods
5. Provides variety throughout the week
6. Is appropriate for the number of people

Return ONLY valid JSON in this exact format:
{
  "meals": {
    "monday": {
      "name": "Meal Name",
      "type": "cooked_meal",
      "recipe": {
        "name": "Meal Name",
        "description": "Brief description",
        "prep_time": 15,
        "cook_time": 25,
        "total_time": 40,
        "servings": 4,
        "ingredients": ["ingredient 1", "ingredient 2"],
        "instructions": ["Step 1", "Step 2"],
        "dietary_tags": ["vegetarian"],
        "cuisine": "Italian"
      }
    },
    "tuesday": { ... },
    ...
  }
}

For days that should be skipped (eating out, etc.), use:
{
  "name": "No dinner needed",
  "type": "skip",
  "reason": "Eating out"
}`

export async function POST(req: NextRequest) {
  try {
    const { household_id, chat_history, household_profile } = await req.json()

    if (!household_id || !household_profile) {
      return NextResponse.json(
        { error: 'household_id and household_profile are required' },
        { status: 400 }
      )
    }

    // Format the context for the AI
    const profileContext = `
Household Profile:
- Members: ${JSON.stringify(household_profile.members)}
- Cooking skill: ${household_profile.cooking_skill}
- Max cooking time: ${household_profile.max_cooking_time} minutes
- Favorite cuisines: ${household_profile.favorite_cuisines?.join(', ') || 'any'}
- Dislikes: ${household_profile.dislikes?.join(', ') || 'none'}
- Dietary restrictions: ${household_profile.members?.flatMap((m: { dietary_restrictions: string[] }) => m.dietary_restrictions).join(', ') || 'none'}
`

    const weeklyContext = chat_history
      ? `Weekly Context from conversation:\n${chat_history.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}`
      : 'No specific weekly constraints.'

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        { role: 'system', content: MEAL_PLAN_GENERATOR_PROMPT },
        { role: 'user', content: `${profileContext}\n\n${weeklyContext}\n\nGenerate a complete 7-day meal plan.` }
      ],
    })

    // Parse the generated meal plan
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse meal plan response')
    }

    const mealPlanData = JSON.parse(jsonMatch[0])

    // Save meal plan to Supabase
    const { data: savedPlan, error: saveError } = await supabaseServer
      .from('meal_plans')
      .insert({
        household_id,
        week_start_date: getNextMonday(),
        meals: mealPlanData.meals,
        constraints: { chat_history: chat_history?.length || 0 },
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save meal plan:', saveError)
      // Return the plan anyway, just without persistence
      return NextResponse.json({
        id: 'temp-' + Date.now(),
        household_id,
        week_start_date: getNextMonday(),
        meals: mealPlanData.meals,
      })
    }

    return NextResponse.json(savedPlan)
  } catch (error) {
    console.error('Generate meal plan error:', error)
    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    )
  }
}

function getNextMonday(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + daysUntilMonday)
  return nextMonday.toISOString().split('T')[0]
}
