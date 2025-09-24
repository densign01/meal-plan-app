from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

print(f"Debug - SUPABASE_URL exists: {bool(supabase_url)}")
print(f"Debug - SUPABASE_KEY exists: {bool(supabase_key)}")

if not supabase_url or not supabase_key:
    print("Environment variables:")
    for key in os.environ:
        if 'SUPABASE' in key:
            print(f"  {key}={os.environ[key][:20]}...")
    raise ValueError("Missing Supabase credentials in environment variables")

supabase: Client = create_client(supabase_url, supabase_key)

def get_supabase_client() -> Client:
    return supabase