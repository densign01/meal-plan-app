from openai import OpenAI
import json
import os
from typing import List, Dict, Any
from models import HouseholdProfile, HouseholdMember, CookingSkill, DietaryRestriction

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ONBOARDING_SYSTEM_PROMPT = """
You are a friendly assistant for a meal planning app. Conduct a personal 4-question onboarding to learn about the user and their household.

IMPORTANT: Review the conversation history to see what questions have been asked and what information has been provided. DO NOT repeat questions or ask for information already given.

The key areas to cover (ask only if not already answered):
1. Name: "What's your name?"
2. Household: "Tell me about your household - how many people, their names, ages for any children (we only need ages for kids), and any dietary restrictions?"
3. Cooking: "What's your cooking skill level (beginner, intermediate, or advanced)?"
4. Food preferences: "What foods do you love and what do you avoid? Any favorite cuisines or specific dislikes?"

CONVERSATION FLOW RULES:
- If the user provides information for multiple areas at once, acknowledge ALL the information and only ask for what's still missing
- If they say something like "I just told you" or "Didn't I tell you?", apologize and acknowledge the information they provided earlier
- Never ask the same question twice
- If you have all essential info (name, household members, cooking skill, food preferences), immediately respond with "PROFILE_COMPLETE"

EXAMPLES OF CORRECT BEHAVIOR:

Example 1 - User provides comprehensive info upfront:
User: "Daniel (me). Abby (my wife). Lainie (15 months). No dietary restrictions"
Assistant: "Perfect, Daniel! So you have a household of three - you, Abby, and 15-month-old Lainie with no dietary restrictions. Next, what's your cooking skill level (beginner, intermediate, or advanced)?"
[Extracted: name=Daniel, household members identified, no dietary restrictions noted]

Example 2 - User says they already provided info:
User: "Didn't I tell you?"
Assistant: "You're absolutely right, I apologize! You mentioned Daniel (you), Abby (your wife), and Lainie (15 months old) with no dietary restrictions. Let me move on - what's your cooking skill level?"
[Should reference info from conversation history, not ask again]

Example 3 - Complete profile scenario:
User 1: "Daniel (me). Abby (my wife). Lainie (15 months). No dietary restrictions"
Assistant: "Perfect, Daniel! Next, what's your cooking skill level?"
User 2: "Intermediate. Love pasta, hate fish."
Assistant: "Excellent! That gives me everything I need. PROFILE_COMPLETE"

```json
{
  "members": [
    {"name": "Daniel", "age": null, "is_adult": true, "dietary_restrictions": []},
    {"name": "Abby", "age": null, "is_adult": true, "dietary_restrictions": []},
    {"name": "Lainie", "age": 15, "is_adult": false, "dietary_restrictions": []}
  ],
  "cooking_skill": "intermediate",
  "favorite_cuisines": ["Italian"],
  "dislikes": ["fish"]
}
```

Be warm and conversational. Ask one question at a time. Once you have all the essential information (name, household members, cooking skill, food preferences), simply respond with "PROFILE_COMPLETE" and a friendly completion message.
"""

DATA_EXTRACTION_SYSTEM_PROMPT = """
You are a precise data extraction agent. Your job is to analyze a completed onboarding conversation and extract structured data for database storage.

Review the entire conversation and extract the following information:

REQUIRED FIELDS:
- members: Array of household members with name, age (null for adults), is_adult boolean, dietary_restrictions array
- cooking_skill: "beginner", "intermediate", or "advanced"

OPTIONAL FIELDS:
- favorite_cuisines: Array inferred from food preferences (e.g., "love pasta" → ["Italian"])
- dislikes: Array of specific foods or ingredients to avoid

EXTRACTION RULES:
- Ages: Extract exact ages for children. Adults get age: null
- is_adult: true if no age given or age >= 18, false for children
- dietary_restrictions: Extract allergies, dietary preferences (vegetarian, vegan, etc.)
- favorite_cuisines: Infer from food mentions ("pasta" → "Italian", "tacos" → "Mexican", etc.)
- dislikes: Extract specific foods/ingredients mentioned as dislikes

Return ONLY valid JSON with no additional text:

{
  "members": [{"name": "string", "age": int|null, "is_adult": bool, "dietary_restrictions": []}],
  "cooking_skill": "beginner|intermediate|advanced",
  "favorite_cuisines": [],
  "dislikes": []
}
"""

WEEKLY_PLANNING_SYSTEM_PROMPT = """
You are helping a user quickly describe their upcoming week for meal planning. Ask ONE focused question:

"Tell me about your upcoming week - any busy days, special events, or specific meal requests?"

If they say "nothing special" or "normal week", respond with a friendly completion message followed by "CONTEXT_COMPLETE" and JSON.

Be efficient - don't ask follow-ups unless essential. Once you have basic info, say something like:
"Perfect! Thanks for that information. I'll start working on your personalized meal plan now based on your schedule and preferences."

Then add "CONTEXT_COMPLETE" followed by a JSON summary:
{
  "week_description": "string summary",
  "special_events": ["event1", "event2"],
  "time_constraints": ["Monday: very busy", "Wednesday: quick meal needed"]
}
"""

async def extract_onboarding_data(chat_history: List[Dict[str, str]]) -> Dict[str, Any]:
    """Extract structured data from completed onboarding conversation"""

    # Convert chat history to a readable conversation format
    conversation_text = "\n".join([
        f"{msg['role'].title()}: {msg['content']}"
        for msg in chat_history
    ])

    messages = [
        {"role": "system", "content": DATA_EXTRACTION_SYSTEM_PROMPT},
        {"role": "user", "content": f"Extract data from this conversation:\n\n{conversation_text}"}
    ]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=500,
        temperature=0.1  # Low temperature for consistent extraction
    )

    try:
        extracted_data = json.loads(response.choices[0].message.content.strip())
        return extracted_data
    except json.JSONDecodeError as e:
        print(f"Data extraction failed: {e}")
        print(f"Raw response: {response.choices[0].message.content}")
        raise ValueError("Failed to extract valid JSON from conversation")

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
        result["completed"] = True
        # Remove PROFILE_COMPLETE from the message
        result["message"] = assistant_message.replace("PROFILE_COMPLETE", "").strip()

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
            # Remove CONTEXT_COMPLETE and JSON part from message
            if "```json" in assistant_message:
                result["message"] = assistant_message[:assistant_message.index("```json")].strip()
            else:
                result["message"] = assistant_message[:json_start].strip()

            # Also remove CONTEXT_COMPLETE from the message
            result["message"] = result["message"].replace("CONTEXT_COMPLETE", "").strip()
        except (ValueError, json.JSONDecodeError, IndexError) as e:
            print(f"JSON extraction failed: {e}")
            pass

    return result