import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { chatCompletion, parseJSONResponse, ChatMessage } from '../_shared/ai-gateway.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const INTERFACE_AGENT_PROMPT = `You are a warm, friendly meal planning assistant. Your job is to quickly understand the user's WEEKLY SCHEDULE only.

I already know their food preferences and household profile. Focus ONLY on this week's schedule:
- Any busy days or special events
- Nights they don't need food (eating out, traveling, etc.)
- Nights they need extra food (guests, larger portions)
- Any specific meal requests just for this particular week

DO NOT ask about general food preferences, dietary restrictions, or cooking preferences - I already have that information.

IMPORTANT COMPLETION RULES:
- If user says "normal week", "nothing special", "just give me a meal plan", or similar: IMMEDIATELY complete
- If user provides basic weekly info: IMMEDIATELY complete - don't ask follow-ups
- Be decisive - don't keep asking questions once you have basic schedule info

When ready to complete, say:
"Perfect! I have everything I need. Let me create your personalized meal plan now."

Then respond with "WEEK_UNDERSTOOD" to signal completion.`

const ADMIN_AGENT_PROMPT = `You are an administrative agent that parses weekly planning conversations into structured meal planning constraints.

Analyze the conversation and extract specific constraints for each day of the week. Focus on:
- Portion requirements (normal, extra, none, reduced)
- Special dietary needs for specific days
- Meal complexity constraints (busy days = simple meals)
- Specific meal requests or preferences mentioned

Return ONLY valid JSON in this exact format:
{
  "monday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"},
  "tuesday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"},
  "wednesday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"},
  "thursday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"},
  "friday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"},
  "saturday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"},
  "sunday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"}
}`

const MENU_GENERATION_AGENT_PROMPT = `You are a culinary expert specializing in creating balanced, varied weekly meal plans. Your job is to generate descriptive, appealing meal titles.

IMPORTANT: Follow the weekly constraints EXACTLY. If the constraints say "none" for portions or mention "dining out", use "Dining Out" for that day. Do NOT add details not mentioned in the constraints.

Given household profile and weekly constraints, create a balanced menu with:
- Variety in proteins, cooking methods, and cuisines
- No repetitive meals within the week
- Appropriate complexity based on constraints
- Descriptive, appetizing meal titles for COOKING days only
- "Dining Out" for days marked as none/dining out in constraints
- "No Cooking Planned" for days with no meal requirements

Use this format for meal titles:
- "Chicken Parmesan with Spaghetti and Side Salad"
- "Roasted Salmon with Steamed Broccoli and Rice Pilaf"
- "Beef Stir-Fry with Mixed Vegetables and Jasmine Rice"
- "Turkey Meatballs in Marinara with Garlic Bread"

For non-cooking days, use EXACTLY:
- "Dining Out" (when going to restaurants)
- "No Cooking Planned" (when no meal needed)

Consider:
- Cooking skill level (beginner = simpler techniques)
- Dietary restrictions and preferences
- Number of people (portion scaling)
- Children present (kid-friendly options)
- Weekly constraints (busy days = quicker meals)

Return ONLY valid JSON:
{
  "monday": "Descriptive Meal Title or Dining Out",
  "tuesday": "Descriptive Meal Title or Dining Out",
  "wednesday": "Descriptive Meal Title or Dining Out",
  "thursday": "Descriptive Meal Title or Dining Out",
  "friday": "Descriptive Meal Title or Dining Out",
  "saturday": "Descriptive Meal Title or Dining Out",
  "sunday": "Descriptive Meal Title or Dining Out"
}`

interface WeeklyPlanningRequest {
  action: 'start' | 'continue' | 'generate'
  household_id: string
  session_id?: string
  message?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body: WeeklyPlanningRequest = await req.json()

    if (!body.household_id) {
      throw new Error('household_id is required')
    }

    // Verify household exists
    const { data: household, error: householdError } = await supabaseClient
      .from('household_profiles')
      .select('*')
      .eq('id', body.household_id)
      .single()

    if (householdError || !household) {
      throw new Error('Household profile not found')
    }

    // START: Create new weekly planning session
    if (body.action === 'start') {
      const welcomeMessage = `Great! Let's plan your meals for this week.

Tell me about your upcoming week - any busy days, special events, or family schedule changes I should know about?`

      const { data: session, error: sessionError } = await supabaseClient
        .from('chat_sessions')
        .insert({
          session_type: 'weekly_planning',
          household_id: body.household_id,
          messages: [],
          completed: false
        })
        .select()
        .single()

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`)
      }

      return new Response(
        JSON.stringify({
          message: welcomeMessage,
          session_id: session.id,
          completed: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // CONTINUE: Process user message and continue conversation
    if (body.action === 'continue') {
      if (!body.session_id || !body.message) {
        throw new Error('session_id and message are required for continue action')
      }

      // Get existing session
      const { data: session, error: sessionError } = await supabaseClient
        .from('chat_sessions')
        .select('*')
        .eq('id', body.session_id)
        .single()

      if (sessionError || !session) {
        throw new Error('Chat session not found')
      }

      const chatHistory: ChatMessage[] = session.messages || []

      // Add user message to history
      chatHistory.push({ role: 'user', content: body.message })

      // Call AI Gateway
      const messages: ChatMessage[] = [
        { role: 'system', content: INTERFACE_AGENT_PROMPT },
        ...chatHistory
      ]

      const aiResponse = await chatCompletion({
        model: 'GPT-5-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500
      })

      const assistantMessage = aiResponse.message.content

      // Add assistant response to history
      chatHistory.push({ role: 'assistant', content: assistantMessage })

      const isCompleted = assistantMessage.includes('WEEK_UNDERSTOOD')
      const cleanMessage = assistantMessage.replace('WEEK_UNDERSTOOD', '').trim()

      // Update session
      await supabaseClient
        .from('chat_sessions')
        .update({
          messages: chatHistory,
          completed: isCompleted,
          updated_at: new Date().toISOString()
        })
        .eq('id', body.session_id)

      return new Response(
        JSON.stringify({
          message: cleanMessage,
          session_id: body.session_id,
          completed: isCompleted
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // GENERATE: Run 3-agent workflow to generate comprehensive meal plan
    if (body.action === 'generate') {
      if (!body.session_id) {
        throw new Error('session_id is required for generate action')
      }

      // Get session with chat history
      const { data: session, error: sessionError } = await supabaseClient
        .from('chat_sessions')
        .select('*')
        .eq('id', body.session_id)
        .single()

      if (sessionError || !session) {
        throw new Error('Chat session not found')
      }

      const chatHistory: ChatMessage[] = session.messages || []

      // STEP 1: Parse weekly constraints (Admin Agent)
      console.log('Step 1: Parsing weekly constraints...')

      const conversationText = chatHistory
        .map(msg => `${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}: ${msg.content}`)
        .join('\n')

      const adminResponse = await chatCompletion({
        model: 'GPT-5-mini',
        messages: [
          { role: 'system', content: ADMIN_AGENT_PROMPT },
          { role: 'user', content: `Parse this weekly planning conversation:\n\n${conversationText}` }
        ],
        temperature: 0.1,
        max_tokens: 800
      })

      const weeklyConstraints = parseJSONResponse(adminResponse.message.content)
      console.log('Constraints parsed:', weeklyConstraints)

      // STEP 2: Generate menu titles (Menu Generation Agent)
      console.log('Step 2: Generating balanced menu...')

      const menuPrompt = `
HOUSEHOLD PROFILE:
${JSON.stringify(household, null, 2)}

WEEKLY CONSTRAINTS:
${JSON.stringify(weeklyConstraints, null, 2)}

Generate a balanced, varied weekly menu following the guidelines in your system prompt.`

      const menuResponse = await chatCompletion({
        model: 'GPT-5-mini',
        messages: [
          { role: 'system', content: MENU_GENERATION_AGENT_PROMPT },
          { role: 'user', content: menuPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })

      const menuTitles = parseJSONResponse(menuResponse.message.content)
      console.log('Menu titles generated:', menuTitles)

      // STEP 3: Create simplified meal plan (detailed recipes skipped for MVP)
      // Note: Full recipe generation would be done here in production
      const mealsWithDates: any = {}
      const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

      // Calculate week start date (most recent Sunday)
      const today = new Date()
      const currentWeekday = today.getDay() // 0 = Sunday, 6 = Saturday
      const daysToSubtract = currentWeekday // If today is Sunday, subtract 0 days
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - daysToSubtract)
      const weekStartDate = weekStart.toISOString().split('T')[0]

      for (let i = 0; i < dayOrder.length; i++) {
        const day = dayOrder[i]
        if (menuTitles[day]) {
          const mealDate = new Date(weekStart)
          mealDate.setDate(mealDate.getDate() + i)
          const dateStr = mealDate.toISOString().split('T')[0]

          mealsWithDates[day] = {
            name: menuTitles[day],
            date: dateStr,
            type: menuTitles[day] === 'Dining Out' || menuTitles[day] === 'No Cooking Planned'
              ? 'no_cooking'
              : 'simple_title'
          }
        }
      }

      // Save meal plan to database
      const { data: mealPlan, error: mealPlanError } = await supabaseClient
        .from('meal_plans')
        .insert({
          household_id: body.household_id,
          week_start_date: weekStartDate,
          meals: mealsWithDates,
          weekly_context: conversationText
        })
        .select()
        .single()

      if (mealPlanError) {
        console.error('Failed to save meal plan:', mealPlanError)
        throw new Error(`Failed to save meal plan: ${mealPlanError.message}`)
      }

      console.log('Meal plan created:', mealPlan.id)

      return new Response(
        JSON.stringify({
          meal_plan_id: mealPlan.id,
          meals: mealsWithDates,
          week_start_date: weekStartDate,
          message: 'Meal plan generated successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    throw new Error('Invalid action. Must be "start", "continue", or "generate"')

  } catch (error) {
    console.error('Error in chat-weekly-planning:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
