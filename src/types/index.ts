export type DietaryRestriction =
    | "vegetarian"
    | "vegan"
    | "gluten_free"
    | "dairy_free"
    | "nut_free"
    | "kosher"
    | "halal"

export type CookingSkill = "beginner" | "intermediate" | "advanced"

export interface HouseholdMember {
    name: string
    age?: number | null
    is_adult: boolean
    dietary_restrictions: DietaryRestriction[]
}

export interface HouseholdProfile {
    id?: string
    user_id?: string
    members: HouseholdMember[]
    cooking_skill: CookingSkill
    max_cooking_time: number
    budget_per_week?: number
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
    description?: string
    difficulty?: CookingSkill
    cuisine?: string
    equipment_needed?: string[]
    tips?: string[]
    nutrition_per_serving?: {
        calories: number
        protein: string
        carbs: string
        fat: string
    }
    total_time?: number
    source_inspiration?: string
}

export interface MealPlan {
    id?: string
    household_id: string
    week_start_date: string
    meals: Record<string, Recipe | { name: string; type: string; date?: string }>
    created_at?: string
    constraints?: any
}

export interface GroceryList {
    id?: string
    meal_plan_id: string
    items: Record<string, string[]>
    total_estimated_cost?: number
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export interface ChatSession {
    id: string
    session_type: 'onboarding' | 'weekly_planning'
    messages: ChatMessage[]
    completed: boolean
    household_id?: string
}

// API Response Types
export interface OnboardingResponse {
    message: string
    completed?: boolean
    extracted_data?: HouseholdProfile
}

export interface WeeklyPlanningResponse {
    message: string
    completed?: boolean
    ready_for_generation?: boolean
    weekly_context?: Record<string, unknown>
    meal_plan?: MealPlan
}
