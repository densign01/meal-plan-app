from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase credentials in environment variables. Please set SUPABASE_URL and SUPABASE_KEY.")

try:
    supabase: Client = create_client(supabase_url, supabase_key)
except Exception as client_error:
    raise ValueError(f"Failed to create Supabase client: {client_error}")

def get_supabase_client() -> Client:
    return supabase