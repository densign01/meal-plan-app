from fastapi import APIRouter, HTTPException
from services.grocery_service import GroceryService

router = APIRouter(prefix="/grocery", tags=["grocery"])

grocery_service = GroceryService()

@router.post("/generate/{meal_plan_id}")
async def generate_grocery_list(meal_plan_id: str):
    """Generate grocery list for a meal plan"""
    try:
        grocery_list_id = await grocery_service.generate_grocery_list(meal_plan_id)
        return {"grocery_list_id": grocery_list_id, "message": "Grocery list generated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{grocery_list_id}")
async def get_grocery_list(grocery_list_id: str):
    """Get grocery list by ID"""
    grocery_list = await grocery_service.get_grocery_list(grocery_list_id)
    if not grocery_list:
        raise HTTPException(status_code=404, detail="Grocery list not found")
    return grocery_list

@router.get("/meal-plan/{meal_plan_id}")
async def get_grocery_list_by_meal_plan(meal_plan_id: str):
    """Get grocery list for a meal plan"""
    grocery_list = await grocery_service.get_grocery_list_by_meal_plan(meal_plan_id)
    if not grocery_list:
        raise HTTPException(status_code=404, detail="Grocery list not found for this meal plan")
    return grocery_list

@router.delete("/{grocery_list_id}")
async def delete_grocery_list(grocery_list_id: str):
    """Delete grocery list"""
    success = await grocery_service.delete_grocery_list(grocery_list_id)
    if not success:
        raise HTTPException(status_code=404, detail="Grocery list not found")
    return {"message": "Grocery list deleted successfully"}