from openai import OpenAI
import json
import os
from typing import Dict, List, Any
from datetime import datetime, timedelta
from database import get_supabase_client
import uuid

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MEAL_PLANNING_PROMPT = """
You are an expert meal planner. Create a 7-day dinner meal plan based on the household profile and weekly context provided.

Household Profile:
{household_profile}

Weekly Context:
{weekly_context}

Requirements:
1. Create exactly 7 dinner recipes (Monday through Sunday)
2. Each recipe should match the household's dietary restrictions and preferences
3. Consider the cooking skill level and max cooking time
4. Account for the weekly schedule (busy days = quick meals, special events = appropriate meals)
5. Ensure variety in cuisines and cooking methods
6. Scale recipes for the number of people in household

For each recipe, provide:
- name: Recipe name
- prep_time: Preparation time in minutes
- cook_time: Cooking time in minutes
- servings: Number of servings
- ingredients: List of ingredients with quantities
- instructions: Step-by-step cooking instructions
- dietary_tags: List of applicable dietary tags

Respond with a JSON object in this exact format:
{
  "monday": {"name": "...", "prep_time": 15, "cook_time": 30, "servings": 4, "ingredients": [...], "instructions": [...], "dietary_tags": [...]},
  "tuesday": {"name": "...", "prep_time": 10, "cook_time": 20, "servings": 4, "ingredients": [...], "instructions": [...], "dietary_tags": [...]},
  "wednesday": {"name": "...", "prep_time": 20, "cook_time": 25, "servings": 4, "ingredients": [...], "instructions": [...], "dietary_tags": [...]},
  "thursday": {"name": "...", "prep_time": 15, "cook_time": 35, "servings": 4, "ingredients": [...], "instructions": [...], "dietary_tags": [...]},
  "friday": {"name": "...", "prep_time": 25, "cook_time": 40, "servings": 4, "ingredients": [...], "instructions": [...], "dietary_tags": [...]},
  "saturday": {"name": "...", "prep_time": 30, "cook_time": 45, "servings": 4, "ingredients": [...], "instructions": [...], "dietary_tags": [...]},
  "sunday": {"name": "...", "prep_time": 20, "cook_time": 35, "servings": 4, "ingredients": [...], "instructions": [...], "dietary_tags": [...]}
}
"""

class MealPlanningService:
    def __init__(self):
        self.supabase = get_supabase_client()

    async def generate_meal_plan(self, household_id: str, weekly_context: Dict[str, Any]) -> str:
        """Generate a meal plan for a household and save it to the database"""

        # Get household profile
        household_result = self.supabase.table("household_profiles").select("*").eq("id", household_id).execute()

        if not household_result.data:
            raise ValueError("Household profile not found")

        household_profile = household_result.data[0]

        # Generate meal plan using AI
        prompt = MEAL_PLANNING_PROMPT.format(
            household_profile=json.dumps(household_profile, indent=2),
            weekly_context=json.dumps(weekly_context, indent=2)
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert meal planner. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )

        try:
            meals_json = json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            raise ValueError("Failed to parse AI response as JSON")

        # Calculate week start date (next Monday)
        today = datetime.now().date()
        days_ahead = 0 - today.weekday()  # Monday is 0
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        week_start = today + timedelta(days=days_ahead)

        # Save meal plan to database
        meal_plan_data = {
            "id": str(uuid.uuid4()),
            "household_id": household_id,
            "week_start_date": week_start.isoformat(),
            "meals": meals_json,
            "weekly_context": json.dumps(weekly_context)
        }

        result = self.supabase.table("meal_plans").insert(meal_plan_data).execute()

        if result.data:
            return result.data[0]["id"]
        else:
            raise Exception("Failed to save meal plan")

    async def get_meal_plan(self, meal_plan_id: str) -> Dict[str, Any]:
        """Get meal plan by ID"""

        result = self.supabase.table("meal_plans").select("*").eq("id", meal_plan_id).execute()

        if result.data:
            return result.data[0]
        return None

    async def get_household_meal_plans(self, household_id: str) -> List[Dict[str, Any]]:
        """Get all meal plans for a household"""

        result = self.supabase.table("meal_plans").select("*").eq("household_id", household_id).order("created_at", desc=True).execute()

        return result.data or []

    async def delete_meal_plan(self, meal_plan_id: str) -> bool:
        """Delete meal plan"""

        result = self.supabase.table("meal_plans").delete().eq("id", meal_plan_id).execute()

        return bool(result.data)