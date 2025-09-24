from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from routes.chat import router as chat_router
from routes.household import router as household_router
from routes.meal_plans import router as meal_plans_router
from routes.grocery import router as grocery_router
from routes.recipes import router as recipes_router

load_dotenv()

app = FastAPI(title="Meal Plan API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=False,  # Must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)
app.include_router(household_router)
app.include_router(meal_plans_router)
app.include_router(grocery_router)
app.include_router(recipes_router)

@app.get("/")
async def root():
    return {"message": "Meal Plan API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/debug/supabase")
async def debug_supabase():
    """Debug endpoint to check Supabase configuration"""
    import os
    from supabase import create_client

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    debug_info = {
        "environment_check": {
            "supabase_url_exists": bool(supabase_url),
            "supabase_key_exists": bool(supabase_key),
            "supabase_url_length": len(supabase_url) if supabase_url else 0,
            "supabase_key_length": len(supabase_key) if supabase_key else 0,
        }
    }

    if supabase_url:
        debug_info["supabase_url"] = supabase_url
        debug_info["url_has_whitespace"] = repr(supabase_url) != repr(supabase_url.strip())

    if supabase_key:
        debug_info["supabase_key_preview"] = f"{supabase_key[:50]}..."
        debug_info["supabase_key_ending"] = f"...{supabase_key[-10:]}"
        debug_info["key_has_whitespace"] = repr(supabase_key) != repr(supabase_key.strip())

    # Test client creation
    try:
        client = create_client(supabase_url, supabase_key)
        debug_info["client_creation"] = "SUCCESS"

        # Test a basic query
        try:
            result = client.table('test').select('*').limit(1).execute()
            debug_info["test_query"] = "SUCCESS - No table error (expected)"
        except Exception as query_error:
            debug_info["test_query"] = f"ERROR: {str(query_error)}"
            debug_info["query_error_type"] = type(query_error).__name__

    except Exception as client_error:
        debug_info["client_creation"] = f"ERROR: {str(client_error)}"
        debug_info["client_error_type"] = type(client_error).__name__

    return debug_info

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)