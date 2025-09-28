from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from services.meal_planning_service import MealPlanningService
from chat import create_comprehensive_meal_plan

router = APIRouter(prefix="/meal-plans", tags=["meal-plans"])

meal_planning_service = MealPlanningService()

class MealPlanRequest(BaseModel):
    household_id: str
    weekly_context: Dict[str, Any]

class ComprehensiveMealPlanRequest(BaseModel):
    household_id: str
    chat_history: List[Dict[str, str]]
    household_profile: Dict[str, Any]

@router.post("/generate")
async def generate_meal_plan(request: MealPlanRequest):
    """Generate a new meal plan for a household"""
    try:
        meal_plan_id = await meal_planning_service.generate_meal_plan(
            request.household_id,
            request.weekly_context
        )
        return {"meal_plan_id": meal_plan_id, "message": "Meal plan generated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/generate-comprehensive")
async def generate_comprehensive_meal_plan(request: ComprehensiveMealPlanRequest):
    """Generate comprehensive meal plan using three-agent workflow"""
    try:
        meal_plan = await create_comprehensive_meal_plan(
            request.household_id,
            request.chat_history,
            request.household_profile
        )
        return meal_plan
    except Exception as e:
        print(f"❌ Error in comprehensive meal plan generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{meal_plan_id}")
async def get_meal_plan(meal_plan_id: str):
    """Get a specific meal plan"""
    meal_plan = await meal_planning_service.get_meal_plan(meal_plan_id)
    if not meal_plan:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    return meal_plan

@router.get("/household/{household_id}")
async def get_household_meal_plans(household_id: str):
    """Get all meal plans for a household"""
    meal_plans = await meal_planning_service.get_household_meal_plans(household_id)
    return {"meal_plans": meal_plans}

@router.delete("/{meal_plan_id}")
async def delete_meal_plan(meal_plan_id: str):
    """Delete a meal plan"""
    success = await meal_planning_service.delete_meal_plan(meal_plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    return {"message": "Meal plan deleted successfully"}