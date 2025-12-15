from typing import Dict, List, Any
from database import get_supabase_client
import uuid
import re

class GroceryService:
    def __init__(self):
        self.supabase = get_supabase_client()

        # Standard grocery store categories for organization
        self.categories = {
            "produce": ["onion", "garlic", "tomato", "lettuce", "carrot", "potato", "bell pepper", "mushroom", "spinach", "broccoli", "cucumber", "celery", "lemon", "lime", "avocado", "herbs", "parsley", "cilantro", "basil"],
            "meat": ["chicken", "beef", "pork", "turkey", "fish", "salmon", "shrimp", "ground beef", "ground turkey"],
            "dairy": ["milk", "cheese", "butter", "yogurt", "cream", "eggs", "sour cream"],
            "pantry": ["rice", "pasta", "flour", "sugar", "salt", "pepper", "oil", "vinegar", "soy sauce", "garlic powder", "onion powder", "paprika", "cumin", "oregano", "thyme", "bay leaves"],
            "canned_goods": ["tomatoes", "beans", "broth", "stock", "coconut milk", "tomato paste", "corn", "diced tomatoes"],
            "frozen": ["peas", "corn", "berries", "ice cream"],
            "bakery": ["bread", "tortillas", "bagels"],
            "other": []
        }

    def _categorize_ingredient(self, ingredient: str) -> str:
        """Categorize an ingredient based on common keywords"""
        ingredient_lower = ingredient.lower()

        for category, keywords in self.categories.items():
            if category == "other":
                continue
            for keyword in keywords:
                if keyword in ingredient_lower:
                    return category

        return "other"

    def _parse_ingredient(self, ingredient: str) -> Dict[str, str]:
        """Parse ingredient string to extract quantity, unit, and item"""
        # Simple regex to extract quantity and unit
        pattern = r'^(\d*\.?\d*)\s*([a-zA-Z]*)\s*(.+)$'
        match = re.match(pattern, ingredient.strip())

        if match:
            quantity = match.group(1) or "1"
            unit = match.group(2) or ""
            item = match.group(3).strip()
        else:
            quantity = "1"
            unit = ""
            item = ingredient.strip()

        return {
            "quantity": quantity,
            "unit": unit,
            "item": item,
            "original": ingredient
        }

    def _combine_ingredients(self, ingredients: List[Dict[str, str]]) -> Dict[str, str]:
        """Combine ingredients with same base item"""
        combined = {}

        for ing in ingredients:
            base_item = ing["item"].lower()

            if base_item in combined:
                # For now, just append quantities (simple approach)
                existing = combined[base_item]
                if ing["unit"] == existing["unit"]:
                    try:
                        total_qty = float(existing["quantity"]) + float(ing["quantity"])
                        combined[base_item]["quantity"] = str(total_qty)
                    except ValueError:
                        # If can't parse as numbers, just combine as text
                        combined[base_item]["original"] += f", {ing['original']}"
                else:
                    # Different units, just append
                    combined[base_item]["original"] += f", {ing['original']}"
            else:
                combined[base_item] = ing.copy()

        return combined

    async def generate_grocery_list(self, meal_plan_id: str) -> str:
        """Generate and save grocery list for a meal plan"""

        # Get meal plan
        meal_plan_result = self.supabase.table("meal_plans").select("*").eq("id", meal_plan_id).execute()

        if not meal_plan_result.data:
            raise ValueError("Meal plan not found")

        meal_plan = meal_plan_result.data[0]
        meals = meal_plan["meals"]

        # Extract all ingredients
        all_ingredients = []
        for day, recipe in meals.items():
            for ingredient in recipe.get("ingredients", []):
                all_ingredients.append(ingredient)

        # Parse ingredients
        parsed_ingredients = [self._parse_ingredient(ing) for ing in all_ingredients]

        # Combine duplicate ingredients
        combined = self._combine_ingredients(parsed_ingredients)

        # Categorize ingredients
        categorized_items = {}
        for item_key, item_data in combined.items():
            category = self._categorize_ingredient(item_data["item"])

            if category not in categorized_items:
                categorized_items[category] = []

            # Format the grocery list item
            if item_data["unit"]:
                formatted = f"{item_data['quantity']} {item_data['unit']} {item_data['item']}"
            else:
                qty_text = item_data['quantity'] if item_data['quantity'] != '1' else ''
                formatted = f"{qty_text} {item_data['item']}".strip()

            categorized_items[category].append(formatted)

        # Sort items within each category
        for category in categorized_items:
            categorized_items[category].sort()

        # Save grocery list to database
        grocery_list_data = {
            "id": str(uuid.uuid4()),
            "meal_plan_id": meal_plan_id,
            "items": categorized_items,
            "total_estimated_cost": None  # Could implement cost estimation later
        }

        result = self.supabase.table("grocery_lists").insert(grocery_list_data).execute()

        if result.data:
            return result.data[0]["id"]
        else:
            raise Exception("Failed to save grocery list")

    async def get_grocery_list(self, grocery_list_id: str) -> Dict[str, Any]:
        """Get grocery list by ID"""

        result = self.supabase.table("grocery_lists").select("*").eq("id", grocery_list_id).execute()

        if result.data:
            return result.data[0]
        return None

    async def get_grocery_list_by_meal_plan(self, meal_plan_id: str) -> Dict[str, Any]:
        """Get grocery list for a meal plan"""

        result = self.supabase.table("grocery_lists").select("*").eq("meal_plan_id", meal_plan_id).execute()

        if result.data:
            return result.data[0]
        return None

    async def delete_grocery_list(self, grocery_list_id: str) -> bool:
        """Delete grocery list"""

        result = self.supabase.table("grocery_lists").delete().eq("id", grocery_list_id).execute()

        return bool(result.data)