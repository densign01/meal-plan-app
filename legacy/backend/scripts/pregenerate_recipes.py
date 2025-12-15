#!/usr/bin/env python3
"""
Pre-generate 50-100 recipes to populate the recipe cache database.
This will significantly improve initial user experience by having recipes ready.
"""

import sys
import os
import asyncio
from pathlib import Path

# Add parent directory to path to import services
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.recipe_service import RecipeService
from database import supabase

# Recipe generation templates
RECIPE_TEMPLATES = [
    # Italian
    {"cuisine": "Italian", "meal_type": "dinner", "protein": "chicken", "difficulty": "intermediate"},
    {"cuisine": "Italian", "meal_type": "dinner", "protein": "beef", "difficulty": "intermediate"},
    {"cuisine": "Italian", "meal_type": "dinner", "protein": "vegetarian", "difficulty": "beginner"},
    {"cuisine": "Italian", "meal_type": "lunch", "protein": "vegetarian", "difficulty": "beginner"},
    {"cuisine": "Italian", "meal_type": "dinner", "protein": "seafood", "difficulty": "advanced"},

    # Mexican
    {"cuisine": "Mexican", "meal_type": "dinner", "protein": "chicken", "difficulty": "beginner"},
    {"cuisine": "Mexican", "meal_type": "dinner", "protein": "beef", "difficulty": "intermediate"},
    {"cuisine": "Mexican", "meal_type": "lunch", "protein": "vegetarian", "difficulty": "beginner"},
    {"cuisine": "Mexican", "meal_type": "breakfast", "protein": "vegetarian", "difficulty": "beginner"},
    {"cuisine": "Mexican", "meal_type": "dinner", "protein": "pork", "difficulty": "intermediate"},

    # Asian (General)
    {"cuisine": "Asian", "meal_type": "dinner", "protein": "chicken", "difficulty": "intermediate"},
    {"cuisine": "Asian", "meal_type": "dinner", "protein": "beef", "difficulty": "intermediate"},
    {"cuisine": "Asian", "meal_type": "dinner", "protein": "tofu", "difficulty": "beginner"},
    {"cuisine": "Asian", "meal_type": "lunch", "protein": "vegetarian", "difficulty": "beginner"},
    {"cuisine": "Asian", "meal_type": "dinner", "protein": "seafood", "difficulty": "intermediate"},

    # Chinese
    {"cuisine": "Chinese", "meal_type": "dinner", "protein": "chicken", "difficulty": "intermediate"},
    {"cuisine": "Chinese", "meal_type": "dinner", "protein": "pork", "difficulty": "intermediate"},
    {"cuisine": "Chinese", "meal_type": "dinner", "protein": "vegetarian", "difficulty": "beginner"},
    {"cuisine": "Chinese", "meal_type": "lunch", "protein": "tofu", "difficulty": "beginner"},

    # Japanese
    {"cuisine": "Japanese", "meal_type": "dinner", "protein": "salmon", "difficulty": "intermediate"},
    {"cuisine": "Japanese", "meal_type": "dinner", "protein": "chicken", "difficulty": "intermediate"},
    {"cuisine": "Japanese", "meal_type": "lunch", "protein": "vegetarian", "difficulty": "beginner"},

    # Thai
    {"cuisine": "Thai", "meal_type": "dinner", "protein": "chicken", "difficulty": "intermediate"},
    {"cuisine": "Thai", "meal_type": "dinner", "protein": "shrimp", "difficulty": "intermediate"},
    {"cuisine": "Thai", "meal_type": "dinner", "protein": "vegetarian", "difficulty": "beginner"},

    # American
    {"cuisine": "American", "meal_type": "dinner", "protein": "beef", "difficulty": "beginner"},
    {"cuisine": "American", "meal_type": "dinner", "protein": "chicken", "difficulty": "beginner"},
    {"cuisine": "American", "meal_type": "breakfast", "protein": "vegetarian", "difficulty": "beginner"},
    {"cuisine": "American", "meal_type": "lunch", "protein": "chicken", "difficulty": "beginner"},
    {"cuisine": "American", "meal_type": "dinner", "protein": "pork", "difficulty": "intermediate"},

    # Mediterranean
    {"cuisine": "Mediterranean", "meal_type": "dinner", "protein": "chicken", "difficulty": "intermediate"},
    {"cuisine": "Mediterranean", "meal_type": "dinner", "protein": "lamb", "difficulty": "intermediate"},
    {"cuisine": "Mediterranean", "meal_type": "lunch", "protein": "vegetarian", "difficulty": "beginner"},
    {"cuisine": "Mediterranean", "meal_type": "dinner", "protein": "fish", "difficulty": "intermediate"},

    # Indian
    {"cuisine": "Indian", "meal_type": "dinner", "protein": "chicken", "difficulty": "intermediate"},
    {"cuisine": "Indian", "meal_type": "dinner", "protein": "vegetarian", "difficulty": "intermediate"},
    {"cuisine": "Indian", "meal_type": "lunch", "protein": "vegetarian", "difficulty": "beginner"},

    # French
    {"cuisine": "French", "meal_type": "dinner", "protein": "chicken", "difficulty": "advanced"},
    {"cuisine": "French", "meal_type": "dinner", "protein": "beef", "difficulty": "advanced"},

    # Greek
    {"cuisine": "Greek", "meal_type": "dinner", "protein": "lamb", "difficulty": "intermediate"},
    {"cuisine": "Greek", "meal_type": "lunch", "protein": "vegetarian", "difficulty": "beginner"},

    # Middle Eastern
    {"cuisine": "Middle Eastern", "meal_type": "dinner", "protein": "chicken", "difficulty": "intermediate"},
    {"cuisine": "Middle Eastern", "meal_type": "lunch", "protein": "vegetarian", "difficulty": "beginner"},

    # Vegetarian/Vegan Focused
    {"cuisine": "Italian", "meal_type": "dinner", "dietary": ["vegetarian"], "difficulty": "beginner"},
    {"cuisine": "Asian", "meal_type": "dinner", "dietary": ["vegan"], "difficulty": "beginner"},
    {"cuisine": "Mexican", "meal_type": "lunch", "dietary": ["vegetarian"], "difficulty": "beginner"},
    {"cuisine": "Mediterranean", "meal_type": "dinner", "dietary": ["vegetarian"], "difficulty": "intermediate"},

    # Quick meals (under 30 min)
    {"cuisine": "Italian", "meal_type": "dinner", "protein": "chicken", "max_time": 25, "difficulty": "beginner"},
    {"cuisine": "Asian", "meal_type": "dinner", "protein": "chicken", "max_time": 25, "difficulty": "beginner"},
    {"cuisine": "American", "meal_type": "lunch", "protein": "chicken", "max_time": 20, "difficulty": "beginner"},
    {"cuisine": "Mexican", "meal_type": "dinner", "protein": "beef", "max_time": 25, "difficulty": "beginner"},

    # Breakfast options
    {"cuisine": "American", "meal_type": "breakfast", "protein": "eggs", "difficulty": "beginner"},
    {"cuisine": "French", "meal_type": "breakfast", "protein": "vegetarian", "difficulty": "intermediate"},
    {"cuisine": "Mexican", "meal_type": "breakfast", "protein": "eggs", "difficulty": "beginner"},
]


async def generate_recipe(recipe_service: RecipeService, template: dict, index: int, total: int):
    """Generate a single recipe from a template"""
    try:
        print(f"\n[{index + 1}/{total}] Generating {template['cuisine']} {template['meal_type']}...")

        # Build requirements string
        requirements = f"A {template['difficulty']} {template['cuisine']} {template['meal_type']} recipe"

        if "protein" in template:
            requirements += f" featuring {template['protein']}"

        if "max_time" in template:
            requirements += f" that can be made in under {template['max_time']} minutes"

        if "dietary" in template:
            requirements += f" that is {', '.join(template['dietary'])}"

        # Create a simple household profile
        household_profile = {
            "members": [{"name": "User", "dietary_restrictions": template.get("dietary", [])}],
            "preferences": {
                "cuisines": [template["cuisine"]],
                "dietary_restrictions": template.get("dietary", [])
            }
        }

        # Generate the recipe
        recipe = await recipe_service.develop_recipe(requirements, household_profile)

        if recipe:
            # Save to database
            recipe_id = await recipe_service.save_recipe_to_database(recipe)

            if recipe_id:
                print(f"   ✅ {recipe.get('name', 'Unknown')} (ID: {recipe_id})")
                return True
            else:
                print(f"   ⚠️ Generated but failed to save: {recipe.get('name', 'Unknown')}")
                return False
        else:
            print(f"   ❌ Failed to generate recipe")
            return False

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


async def main():
    """Main function to pre-generate recipes"""
    print("=" * 60)
    print("🍳 Recipe Pre-Generation Script")
    print("=" * 60)
    print(f"\nTarget: Generate {len(RECIPE_TEMPLATES)} recipes\n")

    recipe_service = RecipeService()
    successful = 0
    failed = 0

    # Check current recipe count
    result = supabase.table("recipes").select("id").execute()
    current_count = len(result.data) if result.data else 0
    print(f"📊 Current database has {current_count} recipes\n")

    # Generate recipes
    for i, template in enumerate(RECIPE_TEMPLATES):
        success = await generate_recipe(recipe_service, template, i, len(RECIPE_TEMPLATES))
        if success:
            successful += 1
        else:
            failed += 1

        # Small delay to avoid rate limiting
        await asyncio.sleep(2)

    # Final report
    print("\n" + "=" * 60)
    print("📊 Generation Complete!")
    print("=" * 60)
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Total recipes in database: {current_count + successful}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
