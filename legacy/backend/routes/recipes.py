from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from services.recipe_service import RecipeService
import logging

router = APIRouter(prefix="/recipes", tags=["recipes"])

# Request models
class RecipeRequirements(BaseModel):
    meal_type: str  # dinner, lunch, breakfast
    cuisine: Optional[str] = None
    dietary_restrictions: List[str] = []
    max_cooking_time: int = 30
    skill_level: str = "intermediate"
    servings: int = 4
    special_requests: Optional[str] = None
    household_context: Dict[str, Any] = {}

class RecipeAdaptation(BaseModel):
    original_recipe: Dict[str, Any]
    adaptation_requirements: Dict[str, Any]
    household_context: Dict[str, Any] = {}

class MealSlotRequest(BaseModel):
    meal_type: str
    cuisine: str
    household_profile: Dict[str, Any]
    special_requirements: Optional[Dict[str, Any]] = None

# Initialize service
recipe_service = RecipeService()

@router.post("/develop")
async def develop_recipe(requirements: RecipeRequirements):
    """
    Develop a new recipe based on specific requirements
    """
    try:
        recipe = await recipe_service.develop_recipe(
            requirements=requirements.dict(exclude={'household_context'}),
            household_context=requirements.household_context
        )
        return {"success": True, "recipe": recipe}

    except Exception as e:
        logging.error(f"Recipe development failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to develop recipe: {str(e)}")

@router.post("/adapt")
async def adapt_recipe(adaptation: RecipeAdaptation):
    """
    Adapt an existing recipe based on new requirements
    """
    try:
        adapted_recipe = await recipe_service.adapt_recipe(
            original_recipe=adaptation.original_recipe,
            adaptation_requirements=adaptation.adaptation_requirements,
            household_context=adaptation.household_context
        )
        return {"success": True, "recipe": adapted_recipe}

    except Exception as e:
        logging.error(f"Recipe adaptation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to adapt recipe: {str(e)}")

@router.post("/for-meal-slot")
async def get_recipe_for_meal_slot(request: MealSlotRequest):
    """
    Get a recipe for a specific meal slot (used by MealPlanningService)
    """
    try:
        recipe = await recipe_service.get_recipe_for_meal_slot(
            meal_type=request.meal_type,
            cuisine=request.cuisine,
            household_profile=request.household_profile,
            special_requirements=request.special_requirements
        )
        return {"success": True, "recipe": recipe}

    except Exception as e:
        logging.error(f"Meal slot recipe generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recipe for meal slot: {str(e)}")

@router.get("/search")
async def search_recipes(
    query: str,
    dietary_filters: Optional[str] = None,
    cuisine: Optional[str] = None,
    max_time: Optional[int] = None
):
    """
    Search for recipes based on query and filters
    Future enhancement: integrate with external APIs
    """
    try:
        filters = dietary_filters.split(",") if dietary_filters else []
        recipes = await recipe_service.search_external_recipes(query, filters)

        return {
            "success": True,
            "query": query,
            "filters": filters,
            "recipes": recipes,
            "note": "External API integration coming soon"
        }

    except Exception as e:
        logging.error(f"Recipe search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to search recipes: {str(e)}")

@router.post("/find-by-criteria")
async def find_recipe_by_criteria(
    meal_type: str,
    cuisine: str,
    household_id: str,
    dietary_restrictions: Optional[str] = None,
    max_cooking_time: int = 30,
    skill_level: str = "intermediate",
    servings: int = 4,
    special_requests: Optional[str] = None
):
    """
    Find/create a recipe based on specific criteria
    """
    try:
        # For now, using empty household profile - in future, fetch from database
        household_profile = {"max_cooking_time": max_cooking_time, "cooking_skill": skill_level}

        dietary_list = dietary_restrictions.split(",") if dietary_restrictions else []

        recipe = await recipe_service.find_recipe_by_criteria(
            meal_type=meal_type,
            cuisine=cuisine,
            dietary_restrictions=dietary_list,
            max_cooking_time=max_cooking_time,
            skill_level=skill_level,
            servings=servings,
            special_requests=special_requests,
            household_profile=household_profile
        )

        return {"success": True, "recipe": recipe}

    except Exception as e:
        logging.error(f"Recipe criteria search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to find recipe: {str(e)}")

# Health check endpoint
@router.get("/health")
async def recipe_service_health():
    """
    Health check for recipe service
    """
    return {
        "service": "recipe_agent",
        "status": "healthy",
        "capabilities": [
            "recipe_development",
            "recipe_adaptation",
            "meal_slot_generation",
            "criteria_based_search"
        ],
        "external_apis": {
            "spoonacular": "not_configured",
            "edamam": "not_configured"
        }
    }