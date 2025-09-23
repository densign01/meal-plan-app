from fastapi import APIRouter, HTTPException
from models import HouseholdProfile
from services.household_service import HouseholdService
from typing import List

router = APIRouter(prefix="/household", tags=["household"])

household_service = HouseholdService()

@router.post("/", response_model=dict)
async def create_household_profile(profile: HouseholdProfile):
    """Create a new household profile"""
    try:
        household_id = await household_service.create_household_profile(profile.dict())
        return {"id": household_id, "message": "Household profile created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{household_id}")
async def get_household_profile(household_id: str):
    """Get household profile by ID"""
    profile = await household_service.get_household_profile(household_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Household profile not found")
    return profile

@router.put("/{household_id}")
async def update_household_profile(household_id: str, updates: dict):
    """Update household profile"""
    success = await household_service.update_household_profile(household_id, updates)
    if not success:
        raise HTTPException(status_code=404, detail="Household profile not found")
    return {"message": "Household profile updated successfully"}

@router.delete("/{household_id}")
async def delete_household_profile(household_id: str):
    """Delete household profile"""
    success = await household_service.delete_household_profile(household_id)
    if not success:
        raise HTTPException(status_code=404, detail="Household profile not found")
    return {"message": "Household profile deleted successfully"}

@router.get("/")
async def list_household_profiles():
    """List all household profiles"""
    profiles = await household_service.list_household_profiles()
    return {"profiles": profiles}