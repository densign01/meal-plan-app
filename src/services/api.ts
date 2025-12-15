import type { HouseholdProfile, MealPlan, GroceryList, OnboardingResponse, WeeklyPlanningResponse } from '../types'

const API_BASE = '/api'

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export class MealPlanAPI {

  // Chat endpoints
  static async startOnboarding(): Promise<{ session_id: string; message: string }> {
    return fetchAPI('/chat/onboarding/start', { method: 'POST' })
  }

  static async continueOnboarding(sessionId: string, message: string, userId?: string, history?: { role: string; content: string }[]): Promise<OnboardingResponse> {
    const url = userId
      ? `/chat/onboarding/${sessionId}?user_id=${encodeURIComponent(userId)}`
      : `/chat/onboarding/${sessionId}`
    return fetchAPI<OnboardingResponse>(url, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    })
  }

  static async startWeeklyPlanning(householdId: string): Promise<{ session_id: string; message: string }> {
    return fetchAPI('/chat/weekly-planning/start', {
      method: 'POST',
      body: JSON.stringify({ household_id: householdId }),
    })
  }

  static async continueWeeklyPlanning(sessionId: string, message: string, history?: { role: string; content: string }[]): Promise<WeeklyPlanningResponse> {
    return fetchAPI<WeeklyPlanningResponse>(`/chat/weekly-planning/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    })
  }

  // Household endpoints
  static async getHouseholdProfile(householdId: string): Promise<HouseholdProfile> {
    return fetchAPI(`/household/${householdId}`)
  }

  static async getHouseholdProfileByUserId(userId: string): Promise<HouseholdProfile> {
    return fetchAPI(`/household/by-user/${userId}`)
  }

  static async updateHouseholdProfile(householdId: string, updates: Partial<HouseholdProfile>) {
    return fetchAPI(`/household/${householdId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // Meal plan endpoints
  static async generateMealPlan(householdId: string, weeklyContext: unknown): Promise<{ meal_plan_id: string }> {
    return fetchAPI('/meal-plans/generate', {
      method: 'POST',
      body: JSON.stringify({
        household_id: householdId,
        weekly_context: weeklyContext,
      }),
    })
  }

  static async generateComprehensiveMealPlan(householdId: string, chatHistory: unknown[], householdProfile: unknown): Promise<MealPlan> {
    return fetchAPI<MealPlan>('/meal-plans/generate-comprehensive', {
      method: 'POST',
      body: JSON.stringify({
        household_id: householdId,
        chat_history: chatHistory,
        household_profile: householdProfile,
      }),
    })
  }

  static async getMealPlan(mealPlanId: string): Promise<MealPlan> {
    return fetchAPI(`/meal-plans/${mealPlanId}`)
  }

  static async getHouseholdMealPlans(householdId: string): Promise<{ meal_plans: MealPlan[] }> {
    return fetchAPI(`/meal-plans/household/${householdId}`)
  }

  // Grocery list endpoints
  static async generateGroceryList(mealPlanId: string): Promise<{ grocery_list_id: string }> {
    return fetchAPI(`/grocery/generate/${mealPlanId}`, { method: 'POST' })
  }

  static async getGroceryList(groceryListId: string): Promise<GroceryList> {
    return fetchAPI(`/grocery/${groceryListId}`)
  }

  static async getGroceryListByMealPlan(mealPlanId: string): Promise<GroceryList> {
    return fetchAPI(`/grocery/meal-plan/${mealPlanId}`)
  }

  // Recipe Agent endpoints
  static async developRecipe(requirements: {
    meal_type: string
    cuisine?: string
    dietary_restrictions?: string[]
    max_cooking_time?: number
    skill_level?: string
    servings?: number
    special_requests?: string
    household_context?: unknown
  }) {
    return fetchAPI('/recipes/develop', {
      method: 'POST',
      body: JSON.stringify(requirements),
    })
  }

  static async adaptRecipe(adaptationData: {
    original_recipe: unknown
    adaptation_requirements: unknown
    household_context?: unknown
  }) {
    return fetchAPI('/recipes/adapt', {
      method: 'POST',
      body: JSON.stringify(adaptationData),
    })
  }

  static async getRecipeForMealSlot(data: {
    meal_type: string
    cuisine: string
    household_profile: unknown
    special_requirements?: unknown
  }) {
    return fetchAPI('/recipes/for-meal-slot', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async findRecipeByCriteria(criteria: {
    meal_type: string
    cuisine: string
    household_id: string
    dietary_restrictions?: string
    max_cooking_time?: number
    skill_level?: string
    servings?: number
    special_requests?: string
  }) {
    const params = new URLSearchParams()
    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value))
      }
    })
    return fetchAPI(`/recipes/find-by-criteria?${params.toString()}`, { method: 'POST' })
  }

  static async searchRecipes(query: string, filters?: {
    dietary_filters?: string
    cuisine?: string
    max_time?: number
  }) {
    const params = new URLSearchParams({ query })
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }
    return fetchAPI(`/recipes/search?${params.toString()}`)
  }

  static async getRecipeServiceHealth() {
    return fetchAPI('/recipes/health')
  }
}
