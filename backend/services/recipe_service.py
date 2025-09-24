from openai import OpenAI
import json
import os
from typing import Dict, List, Any, Optional
import requests
from datetime import datetime
import uuid

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

RECIPE_DEVELOPMENT_PROMPT = """
You are a professional recipe developer and culinary expert. Your task is to find, adapt, or create a recipe based on the specific requirements provided.

Requirements:
{requirements}

Household Context:
{household_context}

Tasks:
1. If this is a common dish, find inspiration from trusted culinary sources
2. Adapt the recipe to fit the household's dietary restrictions, skill level, and available equipment
3. Scale the recipe for the specified number of servings
4. Ensure ingredients are commonly available and reasonably priced
5. Write instructions appropriate for the specified cooking skill level
6. Include helpful tips and substitution suggestions

Respond with a JSON object in this exact format:
{
  "name": "Recipe name",
  "description": "Brief description of the dish",
  "prep_time": 15,
  "cook_time": 30,
  "total_time": 45,
  "servings": 4,
  "difficulty": "beginner|intermediate|advanced",
  "cuisine": "Type of cuisine",
  "ingredients": [
    "1 lb chicken breast, boneless and skinless",
    "2 cups basmati rice",
    "1 medium onion, diced"
  ],
  "instructions": [
    "Detailed step 1 with timing and technique",
    "Detailed step 2 with visual cues",
    "Detailed step 3 with temperature if needed"
  ],
  "equipment_needed": ["Large skillet", "Medium saucepan", "Chef's knife"],
  "dietary_tags": ["gluten-free", "dairy-free", "high-protein"],
  "tips": [
    "Helpful cooking tip or substitution",
    "Storage or reheating advice"
  ],
  "nutrition_per_serving": {
    "calories": 350,
    "protein": "25g",
    "carbs": "40g",
    "fat": "10g"
  },
  "source_inspiration": "Inspired by traditional [cuisine] cooking techniques"
}
"""

RECIPE_ADAPTATION_PROMPT = """
You are a culinary expert specializing in recipe adaptation. Take the provided recipe and modify it according to the specific requirements.

Original Recipe:
{original_recipe}

Adaptation Requirements:
{adaptation_requirements}

Household Context:
{household_context}

Tasks:
1. Modify the recipe to meet the adaptation requirements
2. Ensure the adapted recipe maintains flavor integrity
3. Adjust cooking times and techniques as needed
4. Update ingredient quantities proportionally
5. Provide notes about changes made

Respond with the adapted recipe in the same JSON format as the original, plus an "adaptation_notes" field explaining the changes made.
"""

RECIPE_SOURCING_PROMPT = """
You are a recipe research specialist. Based on the meal requirements, suggest and develop a recipe that would be perfect for this household.

Meal Requirements:
- Meal Type: {meal_type}
- Cuisine Preference: {cuisine}
- Dietary Restrictions: {dietary_restrictions}
- Cooking Time Available: {max_cooking_time} minutes
- Skill Level: {skill_level}
- Number of Servings: {servings}
- Special Requests: {special_requests}

Household Profile:
{household_profile}

Consider:
1. What would work well for this family's schedule and preferences?
2. What ingredients do they likely have access to?
3. What cooking methods match their equipment and skill level?
4. How can we make this nutritious and satisfying?

Create an original recipe that perfectly fits these requirements. Focus on practical, delicious meals that real families will actually cook and enjoy.

Use the same JSON format as specified in the recipe development prompt.
"""

class RecipeService:
    """
    Recipe Agent - Handles recipe sourcing, development, and adaptation
    """

    def __init__(self):
        self.api_sources = {
            'spoonacular': os.getenv('SPOONACULAR_API_KEY'),
            'edamam': os.getenv('EDAMAM_API_KEY')
        }

    async def get_recipe_for_meal_slot(
        self,
        meal_type: str,
        cuisine: str,
        household_profile: Dict[str, Any],
        special_requirements: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get a recipe for a specific meal slot in a meal plan
        This is called by the MealPlanningService
        """

        requirements = {
            "meal_type": meal_type,
            "cuisine": cuisine,
            "dietary_restrictions": household_profile.get('dislikes', []) +
                                   self._extract_dietary_restrictions(household_profile),
            "max_cooking_time": household_profile.get('max_cooking_time', 30),
            "skill_level": household_profile.get('cooking_skill', 'intermediate'),
            "servings": len(household_profile.get('members', [])) or 4,
            "available_equipment": household_profile.get('kitchen_equipment', []),
            "favorite_cuisines": household_profile.get('favorite_cuisines', []),
            "special_requests": special_requirements or {}
        }

        return await self.develop_recipe(requirements, household_profile)

    async def develop_recipe(
        self,
        requirements: Dict[str, Any],
        household_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Develop a new recipe based on requirements
        """

        prompt = RECIPE_DEVELOPMENT_PROMPT.format(
            requirements=json.dumps(requirements, indent=2),
            household_context=json.dumps(household_context, indent=2)
        )

        response = client.chat.completions.create(
            model="gpt-4o",  # Use more powerful model for recipe development
            messages=[
                {"role": "system", "content": "You are a professional recipe developer. Always respond with valid JSON only. Focus on practical, achievable recipes that real families will cook."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.7
        )

        try:
            recipe = json.loads(response.choices[0].message.content)

            # Add metadata
            recipe['id'] = str(uuid.uuid4())
            recipe['created_at'] = datetime.now().isoformat()
            recipe['source'] = 'recipe_agent_developed'

            return recipe

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse recipe JSON: {e}")

    async def adapt_recipe(
        self,
        original_recipe: Dict[str, Any],
        adaptation_requirements: Dict[str, Any],
        household_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Adapt an existing recipe based on new requirements
        """

        prompt = RECIPE_ADAPTATION_PROMPT.format(
            original_recipe=json.dumps(original_recipe, indent=2),
            adaptation_requirements=json.dumps(adaptation_requirements, indent=2),
            household_context=json.dumps(household_context, indent=2)
        )

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a culinary expert specializing in recipe adaptation. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.5  # Lower temperature for adaptations to maintain consistency
        )

        try:
            adapted_recipe = json.loads(response.choices[0].message.content)

            # Add metadata
            adapted_recipe['id'] = str(uuid.uuid4())
            adapted_recipe['adapted_from'] = original_recipe.get('id', 'unknown')
            adapted_recipe['adapted_at'] = datetime.now().isoformat()
            adapted_recipe['source'] = 'recipe_agent_adapted'

            return adapted_recipe

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse adapted recipe JSON: {e}")

    async def find_recipe_by_criteria(
        self,
        meal_type: str,
        cuisine: str,
        dietary_restrictions: List[str],
        max_cooking_time: int,
        skill_level: str,
        servings: int,
        special_requests: str,
        household_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Find/create a recipe based on specific criteria
        """

        prompt = RECIPE_SOURCING_PROMPT.format(
            meal_type=meal_type,
            cuisine=cuisine,
            dietary_restrictions=", ".join(dietary_restrictions) if dietary_restrictions else "None",
            max_cooking_time=max_cooking_time,
            skill_level=skill_level,
            servings=servings,
            special_requests=special_requests or "None",
            household_profile=json.dumps(household_profile, indent=2)
        )

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a recipe research specialist. Always respond with valid JSON only. Focus on recipes that families actually want to cook."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.7
        )

        try:
            recipe = json.loads(response.choices[0].message.content)

            # Add metadata
            recipe['id'] = str(uuid.uuid4())
            recipe['created_at'] = datetime.now().isoformat()
            recipe['source'] = 'recipe_agent_sourced'

            return recipe

        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse sourced recipe JSON: {e}")

    async def search_external_recipes(self, query: str, dietary_filters: List[str] = None) -> List[Dict[str, Any]]:
        """
        Search external recipe APIs (future enhancement)
        Currently returns empty list, but framework is in place
        """
        # TODO: Implement Spoonacular, Edamam, or other recipe API integration
        return []

    def _extract_dietary_restrictions(self, household_profile: Dict[str, Any]) -> List[str]:
        """
        Extract dietary restrictions from household members
        """
        restrictions = []
        members = household_profile.get('members', [])

        for member in members:
            member_restrictions = member.get('dietary_restrictions', [])
            restrictions.extend(member_restrictions)

        # Remove duplicates
        return list(set(restrictions))

    def _calculate_nutrition_estimate(self, ingredients: List[str]) -> Dict[str, Any]:
        """
        Simple nutrition estimation (future enhancement)
        Currently returns placeholder values
        """
        return {
            "calories": 350,
            "protein": "25g",
            "carbs": "40g",
            "fat": "12g"
        }