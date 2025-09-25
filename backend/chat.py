from openai import OpenAI
import json
import os
from typing import List, Dict, Any
from models import HouseholdProfile, HouseholdMember, CookingSkill, DietaryRestriction

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ONBOARDING_SYSTEM_PROMPT = """
You are a friendly assistant for a meal planning app. Conduct a personal 4-question onboarding to learn about the user and their household.

Start by introducing yourself warmly, then ask these questions in order:
1. "What's your name?"
2. "Tell me about your household. Is there anyone else living with you? Are any of them kids (and how old), and does anyone have dietary restrictions?"
3. "What's your cooking situation? What's your skill level (beginner, intermediate, or advanced), how much time do you usually have for cooking meals, and what kitchen equipment do you have available (like oven, stovetop, microwave, slow cooker, air fryer, etc.)?"
4. "What foods do you love and what do you avoid? Any favorite cuisines (like Italian if you love pasta, Mexican, Asian, etc.) or specific dislikes?"

Be warm and conversational. Ask one question at a time. Once you have all the essential information, respond with "PROFILE_COMPLETE" followed by a JSON summary.

When extracting data for the JSON:
- For kitchen_equipment: Extract mentioned appliances and infer from cooking preferences (e.g., "stocked kitchen" → ["oven", "stovetop", "microwave"], "basic setup" → ["stovetop", "oven"])
- For favorite_cuisines: Infer cuisines from food mentions (e.g., "love pasta" → ["Italian"], "tacos and burritos" → ["Mexican"], "stir-fries" → ["Asian"])

For the JSON structure:
{
  "members": [{"name": "string", "age": int, "is_adult": bool, "dietary_restrictions": []}],
  "cooking_skill": "beginner|intermediate|advanced",
  "max_cooking_time": int,
  "favorite_cuisines": [],
  "dislikes": [],
  "kitchen_equipment": []
}
"""

WEEKLY_PLANNING_SYSTEM_PROMPT = """
You are helping a user quickly describe their upcoming week for meal planning. Ask ONE focused question:

"Tell me about your upcoming week - any busy days, special events, or specific meal requests?"

If they say "nothing special" or "normal week", immediately respond with "CONTEXT_COMPLETE" and a simple JSON summary. Be efficient - don't ask follow-ups unless essential.

Once you have basic info, respond with "CONTEXT_COMPLETE" followed by a JSON summary:
{
  "week_description": "string summary",
  "special_events": ["event1", "event2"],
  "time_constraints": ["Monday: very busy", "Wednesday: quick meal needed"]
}
"""

async def process_chat_message(
    message: str,
    chat_history: List[Dict[str, str]],
    chat_type: str = "onboarding"
) -> Dict[str, Any]:
    """Process a chat message and return response with any extracted data"""

    system_prompt = ONBOARDING_SYSTEM_PROMPT if chat_type == "onboarding" else WEEKLY_PLANNING_SYSTEM_PROMPT

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(chat_history)
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # Using gpt-4o-mini as specified in tech stack
        messages=messages,
        max_tokens=500,
        temperature=0.7
    )

    assistant_message = response.choices[0].message.content

    result = {
        "message": assistant_message,
        "completed": False,
        "extracted_data": None
    }

    # Check if profile/context is complete
    if chat_type == "onboarding" and "PROFILE_COMPLETE" in assistant_message:
        print(f"PROFILE_COMPLETE detected in message: {assistant_message[:100]}...")
        try:
            # Look for JSON in code blocks first (```json ... ```)
            if "```json" in assistant_message:
                json_start = assistant_message.index("```json") + 7
                json_end = assistant_message.index("```", json_start)
                json_str = assistant_message[json_start:json_end].strip()
            else:
                # Fallback to looking for direct JSON
                json_start = assistant_message.index("{")
                # Find the matching closing brace
                brace_count = 0
                json_end = json_start
                for i, char in enumerate(assistant_message[json_start:], json_start):
                    if char == "{":
                        brace_count += 1
                    elif char == "}":
                        brace_count -= 1
                        if brace_count == 0:
                            json_end = i + 1
                            break
                json_str = assistant_message[json_start:json_end]

            extracted_data = json.loads(json_str)
            result["completed"] = True
            result["extracted_data"] = extracted_data
            # Remove JSON part from message
            if "```json" in assistant_message:
                result["message"] = assistant_message[:assistant_message.index("```json")].strip()
            else:
                result["message"] = assistant_message[:json_start].strip()
        except (ValueError, json.JSONDecodeError, IndexError) as e:
            print(f"JSON extraction failed: {e}")
            pass

    elif chat_type == "weekly_planning" and "CONTEXT_COMPLETE" in assistant_message:
        try:
            # Look for JSON in code blocks first (```json ... ```)
            if "```json" in assistant_message:
                json_start = assistant_message.index("```json") + 7
                json_end = assistant_message.index("```", json_start)
                json_str = assistant_message[json_start:json_end].strip()
            else:
                # Fallback to looking for direct JSON
                json_start = assistant_message.index("{")
                # Find the matching closing brace
                brace_count = 0
                json_end = json_start
                for i, char in enumerate(assistant_message[json_start:], json_start):
                    if char == "{":
                        brace_count += 1
                    elif char == "}":
                        brace_count -= 1
                        if brace_count == 0:
                            json_end = i + 1
                            break
                json_str = assistant_message[json_start:json_end]

            extracted_data = json.loads(json_str)
            result["completed"] = True
            result["extracted_data"] = extracted_data
            # Remove JSON part from message
            if "```json" in assistant_message:
                result["message"] = assistant_message[:assistant_message.index("```json")].strip()
            else:
                result["message"] = assistant_message[:json_start].strip()
        except (ValueError, json.JSONDecodeError, IndexError) as e:
            print(f"JSON extraction failed: {e}")
            pass

    return result