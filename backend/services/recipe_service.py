from openai import OpenAI
import json
import os
import math
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

RECIPE_DEVELOPMENT_PROMPT = """
You are a professional recipe developer and culinary expert. Create REAL, from-scratch recipes that home cooks actually want to make.

Requirements:
{requirements}

Household Context:
{household_context}

CRITICAL RECIPE QUALITY STANDARDS:
1. NO jarred sauces, pre-made mixes, or processed shortcuts (e.g., "jar of marinara", "packet of seasoning")
2. Cook from REAL ingredients - make sauces, seasonings, and components from scratch
3. Use specific measurements (1 tbsp, 2 cups, 3 cloves) - NEVER vague amounts
4. Include preparation details (minced, diced, sliced thin, etc.)
5. Write detailed, technique-focused instructions with timing and visual cues
6. Provide practical tips for flavor enhancement, substitutions, and storage

Example of GOOD ingredient list:
- "2 tbsp olive oil"
- "3 cloves garlic, minced"
- "1 can (28 oz) crushed tomatoes"
- "1 tsp dried oregano"
- "8 oz dried spaghetti pasta"

Example of BAD ingredient list (DO NOT DO THIS):
- "1 jar marinara sauce"
- "Pasta"
- "Grated Parmesan cheese"

Instructions should include:
- Specific cooking times and temperatures
- Visual/textural cues (golden brown, softened, bubbling)
- Technique explanations (sauté, simmer, al dente)
- Why certain steps matter

Respond with a JSON object in this exact format:
{
  "name": "Recipe name (descriptive but concise)",
  "description": "One sentence describing what makes this dish appealing",
  "prep_time": 15,
  "cook_time": 30,
  "total_time": 45,
  "servings": 4,
  "difficulty": "beginner|intermediate|advanced",
  "cuisine": "Type of cuisine",
  "ingredients": [
    "8 oz dried spaghetti pasta",
    "2 tbsp olive oil",
    "3 cloves garlic, minced",
    "1 small onion, finely chopped",
    "1 can (28 oz) crushed tomatoes",
    "1 tsp dried oregano",
    "¼ tsp red pepper flakes (optional)",
    "Kosher salt and black pepper, to taste",
    "¼ cup grated Parmesan cheese",
    "Fresh basil for garnish"
  ],
  "instructions": [
    "Bring a large pot of salted water to a boil. Add spaghetti and cook until al dente, about 9-11 minutes. Reserve ½ cup pasta water before draining.",
    "Heat olive oil in a large skillet over medium heat. Add onion and sauté 4-5 minutes until softened and translucent.",
    "Stir in garlic and red pepper flakes; cook 30 seconds until fragrant but not browned.",
    "Add crushed tomatoes, oregano, ½ tsp salt, and black pepper. Simmer uncovered 12-15 minutes, stirring occasionally, until sauce thickens slightly. Taste and adjust seasoning.",
    "Toss drained pasta with sauce in the skillet. Add reserved pasta water if needed for consistency.",
    "Serve immediately, topped with Parmesan and fresh basil."
  ],
  "equipment_needed": ["Large pot", "Large skillet", "Colander", "Wooden spoon"],
  "dietary_tags": ["vegetarian"],
  "tips": [
    "For smoother sauce, use an immersion blender before tossing with pasta",
    "Add 1 tbsp tomato paste with the onions for deeper flavor",
    "Sauce keeps 3-4 days refrigerated or freeze up to 2 months"
  ],
  "nutrition_per_serving": {
    "calories": 380,
    "protein": "12g",
    "carbs": "58g",
    "fat": "11g"
  },
  "source_inspiration": "Classic Italian home cooking"
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
You are a recipe research specialist. Create a high-quality, from-scratch recipe that fits this household's needs.

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

CRITICAL QUALITY STANDARDS:
1. NO jarred sauces, soup mixes, or processed shortcuts - cook from REAL ingredients
2. Use specific measurements (2 tbsp, 1 cup, 3 cloves) with prep details (minced, diced, sliced)
3. Write detailed instructions with timing, temperatures, and visual cues
4. Include practical tips for flavor, substitutions, and storage
5. Make it something a home cook would be proud to serve

Consider:
- What would work well for this family's schedule and preferences?
- What ingredients do they likely have access to?
- What cooking methods match their equipment and skill level?
- How can we make this nutritious, flavorful, and satisfying?

Example of what to create:
Instead of "1 jar Alfredo sauce", create a real Alfredo with "2 tbsp butter, 1 cup heavy cream, 1 cup Parmesan, 2 cloves garlic"

Instead of "Cook pasta and add sauce", write "Bring salted water to boil. Cook fettuccine 9-11 minutes until al dente. Meanwhile, melt butter over medium heat, add garlic and cook 30 seconds, then add cream and simmer 5 minutes until slightly thickened."

Use the same JSON format with name, description, prep_time, cook_time, servings, difficulty, cuisine, ingredients (detailed list), instructions (step-by-step with timing), equipment_needed, dietary_tags, tips, and nutrition_per_serving.
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

        # Calculate servings: 1.5x household size, rounded up
        household_size = len(household_profile.get('members', [])) or 4
        servings = math.ceil(household_size * 1.5)

        requirements = {
            "meal_type": meal_type,
            "cuisine": cuisine,
            "dietary_restrictions": household_profile.get('dislikes', []) +
                                   self._extract_dietary_restrictions(household_profile),
            "max_cooking_time": household_profile.get('max_cooking_time', 30),
            "skill_level": household_profile.get('cooking_skill', 'intermediate'),
            "servings": servings,
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
            model="gpt-4o-mini",  # Using available OpenAI model
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
            model="gpt-4o-mini",
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
            model="gpt-4o-mini",
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