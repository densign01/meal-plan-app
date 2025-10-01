from openai import OpenAI
import json
import os
import math
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid
from database import supabase

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

RECIPE_DEVELOPMENT_PROMPT = """
You are a professional recipe developer and culinary expert. Create REAL, from-scratch recipes that home cooks actually want to make.

Requirements:
{requirements}

Household Context:
{household_context}

CRITICAL RECIPE QUALITY STANDARDS - FOLLOW THESE EXACTLY:
1. ❌ ABSOLUTELY NO jarred sauces (marinara, Alfredo, pesto), canned soups, pre-made mixes, or processed shortcuts
2. ✅ Build EVERYTHING from scratch using real ingredients (fresh/canned tomatoes, cream, butter, herbs, spices)
3. ✅ Use SPECIFIC measurements with prep details: "3 cloves garlic, minced" NOT "garlic"
4. ✅ Include 8-12 ingredients minimum (except for very simple dishes)
5. ✅ Write detailed instructions with timing, temperatures, and technique explanations
6. ✅ Make recipes that taste restaurant-quality but are achievable at home

Example of EXCELLENT Spaghetti Marinara (from scratch):
GOOD Ingredients:
- "12 oz dried spaghetti pasta"
- "3 tbsp extra virgin olive oil"
- "1 medium yellow onion, finely diced"
- "4 cloves garlic, minced"
- "1 can (28 oz) crushed San Marzano tomatoes"
- "2 tbsp tomato paste"
- "1 tsp dried oregano"
- "½ tsp dried basil"
- "¼ tsp red pepper flakes"
- "1 tsp sugar (to balance acidity)"
- "Kosher salt and freshly ground black pepper"
- "¼ cup fresh basil leaves, torn"
- "½ cup freshly grated Parmesan cheese"

BAD Ingredients (NEVER DO THIS):
- ❌ "1 jar marinara sauce"
- ❌ "Pasta"
- ❌ "Parmesan cheese"
- ❌ "Italian seasoning mix"

Instructions should include:
- Specific cooking times and temperatures (e.g., "sauté 4-5 minutes over medium heat")
- Visual/textural cues ("until golden brown", "until sauce has thickened and reduced by half")
- Technique explanations ("al dente means tender but still firm to the bite")
- Why certain steps matter ("reserve pasta water for adjusting sauce consistency")
- Pro tips ("add pasta water gradually; the starch helps sauce cling to pasta")

Respond with a JSON object in this exact format:
{{
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
  "nutrition_per_serving": {{
    "calories": 380,
    "protein": "12g",
    "carbs": "58g",
    "fat": "11g"
  }},
  "source_inspiration": "Classic Italian home cooking"
}}
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
        self.use_cache = True  # Enable recipe caching

    async def save_recipe_to_database(self, recipe: Dict[str, Any]) -> str:
        """
        Save a generated recipe to the database for future reuse
        Returns the recipe ID
        """
        try:
            # Extract key information for indexing
            recipe_data = {
                "name": recipe.get("name"),
                "description": recipe.get("description"),
                "cuisine": recipe.get("cuisine"),
                "meal_type": recipe.get("meal_type", "dinner"),
                "prep_time": recipe.get("prep_time"),
                "cook_time": recipe.get("cook_time"),
                "total_time": recipe.get("prep_time", 0) + recipe.get("cook_time", 0),
                "servings": recipe.get("servings", 4),
                "difficulty": recipe.get("difficulty", "intermediate"),
                "ingredients": recipe.get("ingredients", []),
                "instructions": recipe.get("instructions", []),
                "equipment_needed": recipe.get("equipment_needed", []),
                "tips": recipe.get("tips", []),
                "dietary_tags": recipe.get("dietary_tags", []),
                "nutrition_per_serving": recipe.get("nutrition_per_serving"),
                "full_recipe_json": recipe,

                # Extract searchable fields
                "keywords": self._extract_keywords(recipe),
                "primary_protein": self._extract_primary_protein(recipe),
                "main_ingredients": self._extract_main_ingredients(recipe),
            }

            result = supabase.table("recipes").insert(recipe_data).execute()

            if result.data and len(result.data) > 0:
                recipe_id = result.data[0]['id']
                print(f"✅ Saved recipe '{recipe['name']}' to database with ID: {recipe_id}")
                return recipe_id
            else:
                print(f"⚠️ Failed to save recipe to database")
                return None

        except Exception as e:
            print(f"❌ Error saving recipe to database: {e}")
            return None

    async def search_cached_recipes(
        self,
        cuisine: Optional[str] = None,
        meal_type: Optional[str] = None,
        max_time: Optional[int] = None,
        dietary_restrictions: Optional[List[str]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for existing recipes in the database that match criteria
        """
        try:
            query = supabase.table("recipes").select("*")

            # Apply filters
            if cuisine:
                query = query.ilike("cuisine", f"%{cuisine}%")
            if meal_type:
                query = query.eq("meal_type", meal_type)
            if max_time:
                query = query.lte("total_time", max_time)
            if dietary_restrictions:
                # Check if all dietary restrictions are in dietary_tags
                query = query.contains("dietary_tags", dietary_restrictions)

            # Order by popularity (times_used) and limit results
            query = query.order("times_used", desc=True).limit(limit)

            result = query.execute()

            if result.data:
                print(f"🔍 Found {len(result.data)} cached recipes matching criteria")
                return [r["full_recipe_json"] for r in result.data]
            else:
                print(f"🔍 No cached recipes found matching criteria")
                return []

        except Exception as e:
            print(f"❌ Error searching cached recipes: {e}")
            return []

    async def increment_recipe_usage(self, recipe_id: str):
        """
        Increment the times_used counter for a recipe
        """
        try:
            supabase.table("recipes").update({"times_used": supabase.rpc("increment", {"row_id": recipe_id})}).eq("id", recipe_id).execute()
            print(f"📊 Incremented usage count for recipe {recipe_id}")
        except Exception as e:
            print(f"⚠️ Failed to increment recipe usage: {e}")

    def _extract_keywords(self, recipe: Dict[str, Any]) -> List[str]:
        """Extract searchable keywords from recipe"""
        keywords = []
        name_words = recipe.get("name", "").lower().split()
        desc_words = recipe.get("description", "").lower().split()
        keywords.extend(name_words + desc_words)

        # Add dietary tags as keywords
        keywords.extend([tag.lower() for tag in recipe.get("dietary_tags", [])])

        # Remove common words and duplicates
        stop_words = {"a", "an", "the", "with", "and", "or", "for", "to", "in"}
        keywords = list(set([w for w in keywords if w not in stop_words and len(w) > 2]))

        return keywords[:20]  # Limit to 20 keywords

    def _extract_primary_protein(self, recipe: Dict[str, Any]) -> Optional[str]:
        """Extract the primary protein from ingredients"""
        proteins = ["chicken", "beef", "pork", "fish", "salmon", "shrimp", "turkey", "lamb", "tofu", "tempeh"]
        ingredients_text = " ".join(recipe.get("ingredients", [])).lower()

        for protein in proteins:
            if protein in ingredients_text:
                return protein

        # Check if vegetarian/vegan
        dietary_tags = [tag.lower() for tag in recipe.get("dietary_tags", [])]
        if "vegetarian" in dietary_tags or "vegan" in dietary_tags:
            return "vegetarian"

        return None

    def _extract_main_ingredients(self, recipe: Dict[str, Any]) -> List[str]:
        """Extract main ingredients (first 5-6 ingredients usually)"""
        ingredients = recipe.get("ingredients", [])
        main_ingredients = []

        # Extract ingredient names (before measurements/prep instructions)
        for ing in ingredients[:6]:
            # Simple extraction: look for common ingredient words
            words = ing.lower().split()
            # Filter out measurements and common words
            ingredient_words = [w for w in words if len(w) > 3 and not any(char.isdigit() for char in w)]
            if ingredient_words:
                main_ingredients.append(ingredient_words[0])

        return main_ingredients[:5]

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

        Strategy:
        1. First, try to find a cached recipe that matches criteria
        2. If found, return it (much faster!)
        3. If not found, generate a new recipe and save it for future use
        """

        # Calculate servings: 1.5x household size, rounded up
        household_size = len(household_profile.get('members', [])) or 4
        servings = math.ceil(household_size * 1.5)

        dietary_restrictions = household_profile.get('dislikes', []) + self._extract_dietary_restrictions(household_profile)
        max_cooking_time = household_profile.get('max_cooking_time', 30)

        # Try to find a cached recipe first (if caching is enabled)
        if self.use_cache:
            print(f"🔍 Searching cache for {cuisine} {meal_type}...")
            cached_recipes = await self.search_cached_recipes(
                cuisine=cuisine,
                meal_type=meal_type,
                max_time=max_cooking_time,
                dietary_restrictions=dietary_restrictions,
                limit=5  # Get top 5 matches
            )

            if cached_recipes:
                # Use the first matching recipe
                recipe = cached_recipes[0]
                print(f"✨ Using cached recipe: {recipe.get('name')}")

                # TODO: Increment usage counter
                # await self.increment_recipe_usage(recipe_id)

                return recipe

        # No cached recipe found, generate a new one
        print(f"🎨 Generating new {cuisine} {meal_type} recipe...")
        requirements = {
            "meal_type": meal_type,
            "cuisine": cuisine,
            "dietary_restrictions": dietary_restrictions,
            "max_cooking_time": max_cooking_time,
            "skill_level": household_profile.get('cooking_skill', 'intermediate'),
            "servings": servings,
            "available_equipment": household_profile.get('kitchen_equipment', []),
            "favorite_cuisines": household_profile.get('favorite_cuisines', []),
            "special_requests": special_requirements or {}
        }

        recipe = await self.develop_recipe(requirements, household_profile)

        # Save the generated recipe for future use
        if self.use_cache and recipe:
            await self.save_recipe_to_database(recipe)

        return recipe

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
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": "You are a professional recipe developer. CRITICAL: Never use jarred sauces or pre-made mixes. Always build recipes from scratch with real ingredients. Respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=2000,
            temperature=0.7
        )

        try:
            raw_content = response.choices[0].message.content
            print(f"📋 Raw AI response: {raw_content[:500]}...")  # Log first 500 chars

            # Strip markdown code blocks if present
            if raw_content.startswith('```'):
                # Remove ```json or ``` at start and ``` at end
                raw_content = raw_content.split('```')[1]
                if raw_content.startswith('json'):
                    raw_content = raw_content[4:]
                raw_content = raw_content.strip()

            recipe = json.loads(raw_content)

            print(f"✅ Successfully parsed recipe JSON with keys: {recipe.keys()}")

            # Add metadata
            recipe['id'] = str(uuid.uuid4())
            recipe['created_at'] = datetime.now().isoformat()
            recipe['source'] = 'recipe_agent_developed'

            return recipe

        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing failed: {e}")
            print(f"❌ Raw content that failed: {response.choices[0].message.content}")
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
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": "You are a culinary expert specializing in recipe adaptation. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=1500,
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
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": "You are a recipe research specialist. CRITICAL: Never use jarred sauces, canned soups, or pre-made mixes. Build everything from scratch with real ingredients. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=2000,
            temperature=0.7
        )

        try:
            raw_content = response.choices[0].message.content

            # Strip markdown code blocks if present
            if raw_content.startswith('```'):
                raw_content = raw_content.split('```')[1]
                if raw_content.startswith('json'):
                    raw_content = raw_content[4:]
                raw_content = raw_content.strip()

            recipe = json.loads(raw_content)

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