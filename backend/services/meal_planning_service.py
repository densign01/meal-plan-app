from openai import OpenAI
import json
import os
from typing import Dict, List, Any
from datetime import datetime, timedelta
from database import get_supabase_client
from services.recipe_service import RecipeService
import uuid
import asyncio

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
        self.recipe_service = RecipeService()

    async def generate_meal_plan(self, household_id: str, weekly_context: Dict[str, Any]) -> str:
        """Generate a meal plan for a household using RecipeAgent and save it to the database"""

        # Get household profile
        household_result = self.supabase.table("household_profiles").select("*").eq("id", household_id).execute()

        if not household_result.data:
            raise ValueError("Household profile not found")

        household_profile = household_result.data[0]

        # Define days and plan variety
        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        favorite_cuisines = household_profile.get('favorite_cuisines', [])

        # Create cuisine plan with variety
        cuisine_plan = self._plan_cuisine_variety(favorite_cuisines, weekly_context)

        # Generate recipes for each day using RecipeAgent
        meals = {}
        recipe_tasks = []

        for i, day in enumerate(days):
            cuisine = cuisine_plan[i] if i < len(cuisine_plan) else "comfort"
            special_requirements = self._get_day_requirements(day, weekly_context)

            recipe_task = self.recipe_service.get_recipe_for_meal_slot(
                meal_type="dinner",
                cuisine=cuisine,
                household_profile=household_profile,
                special_requirements=special_requirements
            )
            recipe_tasks.append((day, recipe_task))

        # Execute all recipe generation tasks concurrently
        for day, recipe_task in recipe_tasks:
            try:
                recipe = await recipe_task
                meals[day] = recipe
            except Exception as e:
                print(f"Failed to generate recipe for {day}: {e}")
                # Fallback to a simple recipe if RecipeAgent fails
                meals[day] = self._create_fallback_recipe(day, household_profile)

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
            "meals": meals,
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

    def _plan_cuisine_variety(self, favorite_cuisines: List[str], weekly_context: Dict[str, Any]) -> List[str]:
        """Plan cuisine variety across the week based on preferences and context"""

        # Default cuisines if none specified
        if not favorite_cuisines:
            favorite_cuisines = ["American", "Italian", "Mexican", "Asian", "Mediterranean"]

        # Ensure we have enough cuisines for variety
        base_cuisines = favorite_cuisines * 2  # Double to ensure we have enough

        # Create balanced week with variety
        cuisine_plan = []
        for i in range(7):
            # Use modulo to cycle through cuisines with variation
            cuisine_index = (i * 2) % len(favorite_cuisines)  # *2 for more variety
            cuisine_plan.append(base_cuisines[cuisine_index])

        return cuisine_plan

    def _get_day_requirements(self, day: str, weekly_context: Dict[str, Any]) -> Dict[str, Any]:
        """Get special requirements for a specific day based on weekly context"""

        requirements = {}

        # Check for busy days - shorter cooking times
        time_constraints = weekly_context.get('time_constraints', [])
        for constraint in time_constraints:
            if day.lower() in constraint.lower():
                if 'busy' in constraint.lower() or 'quick' in constraint.lower():
                    requirements['max_cooking_time'] = 20
                    requirements['quick_meal'] = True

        # Check for special events
        special_events = weekly_context.get('special_events', [])
        for event in special_events:
            if day.lower() in event.lower():
                if 'celebration' in event.lower() or 'party' in event.lower():
                    requirements['special_occasion'] = True
                elif 'workout' in event.lower() or 'gym' in event.lower():
                    requirements['high_protein'] = True

        return requirements

    def _create_fallback_recipe(self, day: str, household_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Create a simple fallback recipe if RecipeAgent fails"""

        servings = len(household_profile.get('members', [])) or 4

        # Simple, reliable recipes for fallback
        fallback_recipes = {
            "monday": {
                "name": "Simple Spaghetti with Marinara",
                "prep_time": 5,
                "cook_time": 15,
                "servings": servings,
                "ingredients": [
                    f"{servings} servings spaghetti pasta",
                    "1 jar marinara sauce",
                    "Grated Parmesan cheese",
                    "2 tbsp olive oil"
                ],
                "instructions": [
                    "Cook pasta according to package directions",
                    "Heat marinara sauce in a separate pan",
                    "Drain pasta and serve with sauce and cheese"
                ],
                "dietary_tags": ["vegetarian"]
            },
            "tuesday": {
                "name": "Quick Chicken and Rice",
                "prep_time": 10,
                "cook_time": 20,
                "servings": servings,
                "ingredients": [
                    f"{servings} chicken breasts",
                    f"{servings/2:.0f} cups rice",
                    "1 packet onion soup mix",
                    "Salt and pepper"
                ],
                "instructions": [
                    "Season chicken and cook in skillet",
                    "Cook rice separately",
                    "Serve chicken over rice"
                ],
                "dietary_tags": ["gluten-free"]
            }
        }

        return fallback_recipes.get(day, fallback_recipes["monday"])