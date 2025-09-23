import axios from 'axios'
import type { HouseholdProfile, MealPlan, GroceryList } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

export class MealPlanAPI {

  // Chat endpoints
  static async startOnboarding(): Promise<{ session_id: string; message: string }> {
    const response = await api.post('/chat/onboarding/start')
    return response.data
  }

  static async continueOnboarding(sessionId: string, message: string) {
    const response = await api.post(`/chat/onboarding/${sessionId}`, { message })
    return response.data
  }

  static async startWeeklyPlanning(householdId: string): Promise<{ session_id: string; message: string }> {
    const response = await api.post('/chat/weekly-planning/start', { household_id: householdId })
    return response.data
  }

  static async continueWeeklyPlanning(sessionId: string, message: string) {
    const response = await api.post(`/chat/weekly-planning/${sessionId}`, { message })
    return response.data
  }

  // Household endpoints
  static async getHouseholdProfile(householdId: string): Promise<HouseholdProfile> {
    const response = await api.get(`/household/${householdId}`)
    return response.data
  }

  static async updateHouseholdProfile(householdId: string, updates: Partial<HouseholdProfile>) {
    const response = await api.put(`/household/${householdId}`, updates)
    return response.data
  }

  // Meal plan endpoints
  static async generateMealPlan(householdId: string, weeklyContext: any): Promise<{ meal_plan_id: string }> {
    const response = await api.post('/meal-plans/generate', {
      household_id: householdId,
      weekly_context: weeklyContext
    })
    return response.data
  }

  static async getMealPlan(mealPlanId: string): Promise<MealPlan> {
    const response = await api.get(`/meal-plans/${mealPlanId}`)
    return response.data
  }

  static async getHouseholdMealPlans(householdId: string): Promise<{ meal_plans: MealPlan[] }> {
    const response = await api.get(`/meal-plans/household/${householdId}`)
    return response.data
  }

  // Grocery list endpoints
  static async generateGroceryList(mealPlanId: string): Promise<{ grocery_list_id: string }> {
    const response = await api.post(`/grocery/generate/${mealPlanId}`)
    return response.data
  }

  static async getGroceryList(groceryListId: string): Promise<GroceryList> {
    const response = await api.get(`/grocery/${groceryListId}`)
    return response.data
  }

  static async getGroceryListByMealPlan(mealPlanId: string): Promise<GroceryList> {
    const response = await api.get(`/grocery/meal-plan/${mealPlanId}`)
    return response.data
  }
}
