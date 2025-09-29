from openai import OpenAI
import json
import os
from typing import List, Dict, Any
from models import HouseholdProfile, HouseholdMember, CookingSkill, DietaryRestriction
from services.recipe_service import RecipeService

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
recipe_service = RecipeService()

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

# ========== THREE-AGENT MEAL PLANNING ARCHITECTURE ==========

INTERFACE_AGENT_PROMPT = """
You are a warm, friendly meal planning assistant. Your job is to quickly understand the user's WEEKLY SCHEDULE only.

I already know their food preferences and household profile. Focus ONLY on this week's schedule:
- Any busy days or special events
- Nights they don't need food (eating out, traveling, etc.)
- Nights they need extra food (guests, larger portions)
- Any specific meal requests just for this particular week

DO NOT ask about general food preferences, dietary restrictions, or cooking preferences - I already have that information.

IMPORTANT COMPLETION RULES:
- If user says "normal week", "nothing special", "just give me a meal plan", or similar: IMMEDIATELY complete
- If user provides basic weekly info: IMMEDIATELY complete - don't ask follow-ups
- Be decisive - don't keep asking questions once you have basic schedule info

When ready to complete, say:
"Perfect! I have everything I need. Let me create your personalized meal plan now."

Then respond with "WEEK_UNDERSTOOD" to signal completion.
"""

ADMIN_AGENT_PROMPT = """
You are an administrative agent that parses weekly planning conversations into structured meal planning constraints.

Analyze the conversation and extract specific constraints for each day of the week. Focus on:
- Portion requirements (normal, extra, none, reduced)
- Special dietary needs for specific days
- Meal complexity constraints (busy days = simple meals)
- Specific meal requests or preferences mentioned

Return ONLY valid JSON in this exact format:
{
  "monday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"},
  "tuesday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"},
  "wednesday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"},
  "thursday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"},
  "friday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"},
  "saturday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"},
  "sunday": {"portions": "normal|extra|none|reduced", "complexity": "simple|normal|complex", "notes": "any specific requests"}
}
"""

MENU_GENERATION_AGENT_PROMPT = """
You are a culinary expert specializing in creating balanced, varied weekly meal plans. Your job is to generate descriptive, appealing meal titles.

IMPORTANT: Follow the weekly constraints EXACTLY. If the constraints say "none" for portions or mention "dining out", use "Dining Out" for that day. Do NOT add details not mentioned in the constraints.

Given household profile and weekly constraints, create a balanced menu with:
- Variety in proteins, cooking methods, and cuisines
- No repetitive meals within the week
- Appropriate complexity based on constraints
- Descriptive, appetizing meal titles for COOKING days only
- "Dining Out" for days marked as none/dining out in constraints
- "No Cooking Planned" for days with no meal requirements

Use this format for meal titles:
- "Chicken Parmesan with Spaghetti and Side Salad"
- "Roasted Salmon with Steamed Broccoli and Rice Pilaf"
- "Beef Stir-Fry with Mixed Vegetables and Jasmine Rice"
- "Turkey Meatballs in Marinara with Garlic Bread"

For non-cooking days, use EXACTLY:
- "Dining Out" (when going to restaurants)
- "No Cooking Planned" (when no meal needed)

Consider:
- Cooking skill level (beginner = simpler techniques)
- Dietary restrictions and preferences
- Number of people (portion scaling)
- Children present (kid-friendly options)
- Weekly constraints (busy days = quicker meals)

Return ONLY valid JSON:
{
  "monday": "Descriptive Meal Title or Dining Out",
  "tuesday": "Descriptive Meal Title or Dining Out",
  "wednesday": "Descriptive Meal Title or Dining Out",
  "thursday": "Descriptive Meal Title or Dining Out",
  "friday": "Descriptive Meal Title or Dining Out",
  "saturday": "Descriptive Meal Title or Dining Out",
  "sunday": "Descriptive Meal Title or Dining Out"
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

async def parse_weekly_constraints(chat_history: List[Dict[str, str]]) -> Dict[str, Any]:
    """Parse weekly planning conversation into structured constraints"""

    conversation_text = "\n".join([
        f"{msg['role'].title()}: {msg['content']}"
        for msg in chat_history
    ])

    messages = [
        {"role": "system", "content": ADMIN_AGENT_PROMPT},
        {"role": "user", "content": f"Parse this weekly planning conversation:\n\n{conversation_text}"}
    ]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=800,
        temperature=0.1
    )

    try:
        constraints = json.loads(response.choices[0].message.content.strip())
        return constraints
    except json.JSONDecodeError as e:
        print(f"Constraint parsing failed: {e}")
        print(f"Raw response: {response.choices[0].message.content}")
        raise ValueError("Failed to extract valid JSON from weekly conversation")

async def generate_weekly_menu(household_profile: Dict[str, Any], weekly_constraints: Dict[str, Any]) -> Dict[str, Any]:
    """Generate balanced weekly menu using household profile and constraints with detailed recipes"""

    # Step 1: Generate meal titles using Menu Generation Agent
    prompt = f"""
HOUSEHOLD PROFILE:
{json.dumps(household_profile, indent=2)}

WEEKLY CONSTRAINTS:
{json.dumps(weekly_constraints, indent=2)}

Generate a balanced, varied weekly menu following the guidelines in your system prompt.
"""

    messages = [
        {"role": "system", "content": MENU_GENERATION_AGENT_PROMPT},
        {"role": "user", "content": prompt}
    ]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=1000,
        temperature=0.3
    )

    try:
        menu_titles = json.loads(response.choices[0].message.content.strip())

        # Step 2: Use RecipeAgent to generate detailed recipes for each meal
        detailed_menu = {}
        for day, meal_title in menu_titles.items():
            # Skip days with no cooking
            if meal_title in ["Dining Out", "No Cooking Planned"]:
                detailed_menu[day] = {"name": meal_title, "type": "no_cooking"}
                continue

            # Get constraints for this day
            day_constraints = weekly_constraints.get(day, {})

            # Infer cuisine and meal type from title
            cuisine_hint = household_profile.get('favorite_cuisines', ['American'])[0] if household_profile.get('favorite_cuisines') else 'American'

            # Prepare requirements for RecipeAgent
            requirements = {
                "meal_type": "dinner",
                "cuisine": cuisine_hint,
                "dietary_restrictions": household_profile.get('dislikes', []),
                "max_cooking_time": 30 if day_constraints.get('complexity') == 'simple' else 45,
                "skill_level": household_profile.get('cooking_skill', 'intermediate'),
                "servings": len(household_profile.get('members', [])) or 4,
                "special_requests": f"Create a recipe for: {meal_title}. Constraints: {day_constraints.get('notes', 'None')}"
            }

            try:
                print(f"🍳 Generating detailed recipe for {day}: {meal_title}")
                recipe = await recipe_service.develop_recipe(requirements, household_profile)
                detailed_menu[day] = {
                    "name": meal_title,
                    "recipe": recipe,
                    "type": "cooked_meal"
                }
                print(f"✅ Recipe generated for {day}")
            except Exception as e:
                print(f"⚠️ Failed to generate recipe for {day}, using simple title")
                print(f"❌ Full error: {type(e).__name__}: {str(e)}")
                import traceback
                print(f"❌ Traceback: {traceback.format_exc()}")
                # Fallback to simple title if recipe generation fails
                detailed_menu[day] = {"name": meal_title, "type": "simple_title"}

        return detailed_menu

    except json.JSONDecodeError as e:
        print(f"Menu generation failed: {e}")
        print(f"Raw response: {response.choices[0].message.content}")
        raise ValueError("Failed to generate valid menu JSON")

async def process_chat_message(
    message: str,
    chat_history: List[Dict[str, str]],
    chat_type: str = "onboarding"
) -> Dict[str, Any]:
    """Process a chat message and return response with any extracted data"""

    system_prompt = ONBOARDING_SYSTEM_PROMPT if chat_type == "onboarding" else INTERFACE_AGENT_PROMPT

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(chat_history)
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # Using available OpenAI model
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

    elif chat_type == "weekly_planning" and "WEEK_UNDERSTOOD" in assistant_message:
        result["completed"] = True
        # Remove WEEK_UNDERSTOOD from the message
        result["message"] = assistant_message.replace("WEEK_UNDERSTOOD", "").strip()

    return result

async def create_comprehensive_meal_plan(
    household_id: str,
    chat_history: List[Dict[str, str]],
    household_profile: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Complete three-agent meal plan generation workflow:
    1. Parse weekly conversation into constraints (Admin Agent)
    2. Generate balanced menu (Menu Generation Agent)
    3. Return comprehensive meal plan
    """
    from datetime import datetime, timedelta

    try:
        # Step 1: Parse weekly constraints using Admin Agent
        print("🔍 Step 1: Parsing weekly constraints...")
        weekly_constraints = await parse_weekly_constraints(chat_history)
        print(f"✅ Constraints parsed: {weekly_constraints}")

        # Step 2: Generate menu using Menu Generation Agent
        print("🍽️ Step 2: Generating balanced menu...")
        weekly_menu = await generate_weekly_menu(household_profile, weekly_constraints)
        print(f"✅ Menu generated: {weekly_menu}")

        # Step 3: Calculate week start date (next Monday)
        today = datetime.now()
        days_until_monday = (7 - today.weekday()) % 7  # 0 = Monday
        if days_until_monday == 0:  # If today is Monday, use today
            week_start = today
        else:
            week_start = today + timedelta(days=days_until_monday)

        week_start_date = week_start.strftime("%Y-%m-%d")

        # Step 4: Assign dates to each day
        day_order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        meals_with_dates = {}

        for i, day in enumerate(day_order):
            if day in weekly_menu:
                meal_date = (week_start + timedelta(days=i)).strftime("%Y-%m-%d")
                meal_data = weekly_menu[day]
                if isinstance(meal_data, dict):
                    meal_data['date'] = meal_date
                else:
                    meal_data = {'name': meal_data, 'date': meal_date}
                meals_with_dates[day] = meal_data

        # Step 5: Create comprehensive meal plan structure
        meal_plan = {
            "household_id": household_id,
            "meals": meals_with_dates,
            "constraints": weekly_constraints,
            "week_start_date": week_start_date,
            "generated_at": datetime.now().isoformat(),
            "status": "active"
        }

        return meal_plan

    except Exception as e:
        print(f"❌ Error in comprehensive meal plan generation: {e}")
        raise e