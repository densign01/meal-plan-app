from typing import Optional, List
from database import get_supabase_client
from models import HouseholdProfile
import uuid
from datetime import datetime

class HouseholdService:
    def __init__(self):
        self.supabase = get_supabase_client()

    async def create_household_profile(self, profile_data: dict) -> str:
        """Create a new household profile and return the ID"""

        profile_data["id"] = str(uuid.uuid4())
        profile_data["created_at"] = datetime.now().isoformat()
        profile_data["updated_at"] = datetime.now().isoformat()

        result = self.supabase.table("household_profiles").insert(profile_data).execute()

        if result.data:
            return result.data[0]["id"]
        else:
            raise Exception("Failed to create household profile")

    async def get_household_profile(self, household_id: str) -> Optional[dict]:
        """Get household profile by ID"""

        result = self.supabase.table("household_profiles").select("*").eq("id", household_id).execute()

        if result.data:
            return result.data[0]
        return None

    async def update_household_profile(self, household_id: str, updates: dict) -> bool:
        """Update household profile"""

        updates["updated_at"] = datetime.now().isoformat()

        result = self.supabase.table("household_profiles").update(updates).eq("id", household_id).execute()

        return bool(result.data)

    async def list_household_profiles(self) -> List[dict]:
        """List all household profiles (for admin/debug purposes)"""

        result = self.supabase.table("household_profiles").select("*").execute()

        return result.data or []

    async def delete_household_profile(self, household_id: str) -> bool:
        """Delete household profile and all related data"""

        result = self.supabase.table("household_profiles").delete().eq("id", household_id).execute()

        return bool(result.data)