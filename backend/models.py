from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class DietaryRestriction(str, Enum):
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    GLUTEN_FREE = "gluten_free"
    DAIRY_FREE = "dairy_free"
    NUT_FREE = "nut_free"
    KOSHER = "kosher"
    HALAL = "halal"

class CookingSkill(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class HouseholdMember(BaseModel):
    name: str
    age: int
    is_adult: bool
    dietary_restrictions: List[DietaryRestriction] = []

class HouseholdProfile(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None  # Link to authenticated user
    members: List[HouseholdMember]
    cooking_skill: CookingSkill
    max_cooking_time: int  # minutes
    budget_per_week: Optional[float] = None
    favorite_cuisines: List[str] = []
    dislikes: List[str] = []
    kitchen_equipment: List[str] = []

class WeeklyContext(BaseModel):
    week_description: str
    special_events: List[str] = []
    time_constraints: List[str] = []

class Recipe(BaseModel):
    name: str
    prep_time: int
    cook_time: int
    servings: int
    ingredients: List[str]
    instructions: List[str]
    dietary_tags: List[DietaryRestriction] = []

class MealPlan(BaseModel):
    id: Optional[str] = None
    household_id: str
    week_start_date: str
    meals: dict  # day -> {"dinner": Recipe}
    created_at: Optional[str] = None

class GroceryList(BaseModel):
    id: Optional[str] = None
    meal_plan_id: str
    items: dict  # category -> [items]
    total_estimated_cost: Optional[float] = None