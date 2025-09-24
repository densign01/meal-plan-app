from fastapi import APIRouter, HTTPException, Body, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from database import get_supabase_client
from chat import process_chat_message
import uuid
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str

class WeeklyPlanningStartRequest(BaseModel):
    household_id: str

class ChatResponse(BaseModel):
    message: str
    session_id: str
    completed: bool
    extracted_data: Optional[Dict[str, Any]] = None

@router.post("/onboarding/start")
async def start_onboarding():
    """Start a new onboarding chat session"""
    supabase = get_supabase_client()

    session_id = str(uuid.uuid4())

    # Create new chat session
    result = supabase.table("chat_sessions").insert({
        "id": session_id,
        "session_type": "onboarding",
        "messages": [],
        "completed": False
    }).execute()

    welcome_message = """Hi! I'm here to help you set up your meal planning profile quickly.

I'll ask you just 4 key questions to get started - this should take less than 2 minutes.

First question: Tell me about your household - how many people, their names, ages for any children (we only need ages for kids), and any dietary restrictions?"""

    return ChatResponse(
        message=welcome_message,
        session_id=session_id,
        completed=False
    )

@router.post("/onboarding/{session_id}")
async def continue_onboarding(session_id: str, chat_message: ChatMessage):
    """Continue an onboarding conversation"""
    supabase = get_supabase_client()

    # Get existing session
    session_result = supabase.table("chat_sessions").select("*").eq("id", session_id).execute()

    if not session_result.data:
        raise HTTPException(status_code=404, detail="Chat session not found")

    session = session_result.data[0]
    chat_history = session["messages"]

    # Add user message to history
    chat_history.append({"role": "user", "content": chat_message.message})

    # Process with AI
    result = await process_chat_message(
        chat_message.message,
        chat_history,
        chat_type="onboarding"
    )

    # Add assistant response to history
    chat_history.append({"role": "assistant", "content": result["message"]})

    # Update session
    update_data = {
        "messages": chat_history,
        "completed": result["completed"],
        "updated_at": datetime.now().isoformat()
    }

    if result["completed"] and result["extracted_data"]:
        # Create household profile
        try:
            profile_result = supabase.table("household_profiles").insert(
                result["extracted_data"]
            ).execute()

            if not profile_result.data:
                raise Exception("Failed to create household profile")

            household_id = profile_result.data[0]["id"]
            update_data["household_id"] = household_id

            # Add household_id to extracted_data for frontend
            result["extracted_data"]["id"] = household_id

        except Exception as e:
            print(f"Household creation failed: {e}")
            # Continue without household creation - frontend will use fallback

    supabase.table("chat_sessions").update(update_data).eq("id", session_id).execute()

    return ChatResponse(
        message=result["message"],
        session_id=session_id,
        completed=result["completed"],
        extracted_data=result["extracted_data"]
    )

@router.post("/weekly-planning/start")
async def start_weekly_planning(
    request: Optional[WeeklyPlanningStartRequest] = Body(default=None),
    household_id: Optional[str] = Query(default=None)
):
    """Start a new weekly planning chat session"""
    supabase = get_supabase_client()

    resolved_household_id = household_id or (request.household_id if request else None)

    if household_id and request and request.household_id and household_id != request.household_id:
        raise HTTPException(status_code=400, detail="Conflicting household_id provided in query and body")

    if not resolved_household_id:
        raise HTTPException(status_code=422, detail="household_id is required")

    # Verify household exists
    household_result = supabase.table("household_profiles").select("*").eq("id", resolved_household_id).execute()
    if not household_result.data:
        raise HTTPException(status_code=404, detail="Household profile not found")

    session_id = str(uuid.uuid4())

    # Create new chat session
    result = supabase.table("chat_sessions").insert({
        "id": session_id,
        "session_type": "weekly_planning",
        "household_id": resolved_household_id,
        "messages": [],
        "completed": False
    }).execute()

    welcome_message = """Great! Let's plan your meals for this week.

Tell me about your upcoming week - any busy days, special events, or family schedule changes I should know about?"""

    return ChatResponse(
        message=welcome_message,
        session_id=session_id,
        completed=False
    )

@router.post("/weekly-planning/{session_id}")
async def continue_weekly_planning(session_id: str, chat_message: ChatMessage):
    """Continue a weekly planning conversation"""
    supabase = get_supabase_client()

    # Get existing session
    session_result = supabase.table("chat_sessions").select("*").eq("id", session_id).execute()

    if not session_result.data:
        raise HTTPException(status_code=404, detail="Chat session not found")

    session = session_result.data[0]
    chat_history = session["messages"]

    # Add user message to history
    chat_history.append({"role": "user", "content": chat_message.message})

    # Process with AI
    result = await process_chat_message(
        chat_message.message,
        chat_history,
        chat_type="weekly_planning"
    )

    # Add assistant response to history
    chat_history.append({"role": "assistant", "content": result["message"]})

    # Update session
    update_data = {
        "messages": chat_history,
        "completed": result["completed"],
        "updated_at": datetime.now().isoformat()
    }

    supabase.table("chat_sessions").update(update_data).eq("id", session_id).execute()

    return ChatResponse(
        message=result["message"],
        session_id=session_id,
        completed=result["completed"],
        extracted_data=result["extracted_data"]
    )
