from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from routes.chat import router as chat_router
from routes.household import router as household_router
from routes.meal_plans import router as meal_plans_router
from routes.grocery import router as grocery_router

load_dotenv()

app = FastAPI(title="Meal Plan API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)
app.include_router(household_router)
app.include_router(meal_plans_router)
app.include_router(grocery_router)

@app.get("/")
async def root():
    return {"message": "Meal Plan API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)