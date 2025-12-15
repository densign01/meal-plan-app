import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { chatCompletion, parseJSONResponse, ChatMessage } from '../_shared/ai-gateway.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ONBOARDING_SYSTEM_PROMPT = `You are a friendly assistant for a meal planning app. Conduct a personal 4-question onboarding to learn about the user and their household.

IMPORTANT: Review the conversation history to see what questions have been asked and what information has been provided. DO NOT repeat questions or ask for information already given.

The key areas to cover (ask only if not already answered):
1. Name: "What's your name?"
2. Household: "Tell me about your household - how many people, their names, ages for any children (we only need ages for kids), and any dietary restrictions?"
3. Cooking: "What's your cooking skill level (beginner, intermediate, or advanced)?"
4. Food preferences: "What foods do you love and what do you avoid? Any favorite cuisines or specific dislikes?"

CONVERSATION FLOW RULES:
- If the user provides information for multiple areas at once, acknowledge ALL the information and only ask for what's still missing
- If they say something like "I just told you" or "Didn't I tell you?", apologize and acknowledge the information they provided earlier
- Never ask the same question twice
- If you have all essential info (name, household members, cooking skill, food preferences), immediately respond with "PROFILE_COMPLETE"

Be warm and conversational. Ask one question at a time. Once you have all the essential information (name, household members, cooking skill, food preferences), simply respond with "PROFILE_COMPLETE" and a friendly completion message.`

const DATA_EXTRACTION_SYSTEM_PROMPT = `You are a precise data extraction agent. Your job is to analyze a completed onboarding conversation and extract structured data for database storage.

Review the entire conversation and extract the following information:

REQUIRED FIELDS:
- members: Array of household members with name, age (null for adults), is_adult boolean, dietary_restrictions array
- cooking_skill: "beginner", "intermediate", or "advanced"

OPTIONAL FIELDS:
- favorite_cuisines: Array inferred from food preferences (e.g., "love pasta" → ["Italian"])
- dislikes: Array of specific foods or ingredients to avoid

EXTRACTION RULES:
- Ages: Extract exact ages for children. Adults get age: null
- is_adult: true if no age given or age >= 18, false for children
- dietary_restrictions: Extract allergies, dietary preferences (vegetarian, vegan, etc.)
- favorite_cuisines: Infer from food mentions ("pasta" → "Italian", "tacos" → "Mexican", etc.)
- dislikes: Extract specific foods/ingredients mentioned as dislikes

Return ONLY valid JSON with no additional text:

{
  "members": [{"name": "string", "age": int|null, "is_adult": bool, "dietary_restrictions": []}],
  "cooking_skill": "beginner|intermediate|advanced",
  "favorite_cuisines": [],
  "dislikes": []
}`

interface OnboardingRequest {
  action: 'start' | 'continue' | 'complete'
  session_id?: string
  message?: string
  user_id?: string
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

    const body: OnboardingRequest = await req.json()

    // START: Create new onboarding session
    if (body.action === 'start') {
      const welcomeMessage = `Hi! I'm here to help you set up your meal planning profile quickly.

I'll ask you just 4 key questions to get started - this should take less than 2 minutes.

First question: Tell me about your household - how many people, their names, ages for any children (we only need ages for kids), and any dietary restrictions?`

      const { data: session, error: sessionError } = await supabaseClient
        .from('chat_sessions')
        .insert({
          session_type: 'onboarding',
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
        { role: 'system', content: ONBOARDING_SYSTEM_PROMPT },
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

      const isCompleted = assistantMessage.includes('PROFILE_COMPLETE')
      const cleanMessage = assistantMessage.replace('PROFILE_COMPLETE', '').trim()

      // Update session
      const updateData: any = {
        messages: chatHistory,
        completed: isCompleted,
        updated_at: new Date().toISOString()
      }

      let extractedData: any = null

      // If completed, extract data and create household profile
      if (isCompleted) {
        console.log('Onboarding completed. Extracting data...')

        const conversationText = chatHistory
          .map(msg => `${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}: ${msg.content}`)
          .join('\n')

        const extractionResponse = await chatCompletion({
          model: 'GPT-5-mini',
          messages: [
            { role: 'system', content: DATA_EXTRACTION_SYSTEM_PROMPT },
            { role: 'user', content: `Extract data from this conversation:\n\n${conversationText}` }
          ],
          temperature: 0.1,
          max_tokens: 500
        })

        extractedData = parseJSONResponse(extractionResponse.message.content)

        // Add user_id if provided
        if (body.user_id) {
          extractedData.user_id = body.user_id
        }

        // Ensure arrays exist
        if (!extractedData.favorite_cuisines) extractedData.favorite_cuisines = []
        if (!extractedData.dislikes) extractedData.dislikes = []

        // Save household profile to database
        const { data: household, error: householdError } = await supabaseClient
          .from('household_profiles')
          .insert(extractedData)
          .select()
          .single()

        if (householdError) {
          console.error('Failed to create household profile:', householdError)
          throw new Error(`Failed to save profile: ${householdError.message}`)
        }

        console.log('Household profile created:', household.id)

        updateData.household_id = household.id
        extractedData.id = household.id
      }

      // Update session
      await supabaseClient
        .from('chat_sessions')
        .update(updateData)
        .eq('id', body.session_id)

      return new Response(
        JSON.stringify({
          message: cleanMessage,
          session_id: body.session_id,
          completed: isCompleted,
          extracted_data: extractedData
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    throw new Error('Invalid action. Must be "start" or "continue"')

  } catch (error) {
    console.error('Error in chat-onboarding:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
