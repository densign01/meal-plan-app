// Core types for the meal planning app

export interface HouseholdMember {
  name: string
  age?: number  // Optional for adults, required for children
  is_adult: boolean
  dietary_restrictions: string[]
}

// Validation helper for household members
export const validateMember = (member: HouseholdMember): boolean => {
  if (!member.is_adult && !member.age) {
    return false // Children must have age
  }
  return true
}

export interface HouseholdProfile {
  id?: string
  members: HouseholdMember[]
  cooking_skill: 'beginner' | 'intermediate' | 'advanced'
  max_cooking_time: number
  favorite_cuisines: string[]
  dislikes: string[]
  kitchen_equipment: string[]
}

export interface Recipe {
  name: string
  prep_time: number
  cook_time: number
  servings: number
  ingredients: string[]
  instructions: string[]
  dietary_tags: string[]
}

export interface MealPlan {
  id?: string
  household_id: string
  week_start_date: string
  meals: Record<string, Recipe>
  created_at?: string
}

export interface GroceryList {
  id?: string
  meal_plan_id: string
  items: Record<string, string[]>
  total_estimated_cost?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatSession {
  id: string
  session_type: 'onboarding' | 'weekly_planning'
  messages: ChatMessage[]
  completed: boolean
  household_id?: string
}

// Agent orchestrator types
export type AgentIntent =
  | 'start_onboarding'
  | 'continue_onboarding'
  | 'start_weekly_planning'
  | 'continue_weekly_planning'
  | 'generate_meal_plan'
  | 'view_meal_plan'
  | 'generate_grocery_list'
  | 'export_list'

export interface AgentRequest {
  intent: AgentIntent
  context: any
  message?: string
}

export interface AgentResponse {
  success: boolean
  data?: any
  message?: string
  next_action?: AgentIntent
}