from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

print(f"Debug - SUPABASE_URL: {supabase_url}")
print(f"Debug - SUPABASE_URL length: {len(supabase_url) if supabase_url else 0}")
print(f"Debug - SUPABASE_KEY: {supabase_key[:50] if supabase_key else None}...")
print(f"Debug - SUPABASE_KEY length: {len(supabase_key) if supabase_key else 0}")
print(f"Debug - SUPABASE_KEY ends with: ...{supabase_key[-10:] if supabase_key and len(supabase_key) > 10 else 'N/A'}")

# Check for whitespace or invisible characters
if supabase_key:
    print(f"Debug - SUPABASE_KEY has leading/trailing whitespace: {repr(supabase_key) != repr(supabase_key.strip())}")
if supabase_url:
    print(f"Debug - SUPABASE_URL has leading/trailing whitespace: {repr(supabase_url) != repr(supabase_url.strip())}")

if not supabase_url or not supabase_key:
    print("Environment variables:")
    for key in os.environ:
        if 'SUPABASE' in key:
            print(f"  {key}={os.environ[key][:20]}...")
    raise ValueError("Missing Supabase credentials in environment variables")

try:
    print("Debug - Attempting to create Supabase client...")
    supabase: Client = create_client(supabase_url, supabase_key)
    print("Debug - Supabase client created successfully")

    # Test a basic operation to verify the client works
    try:
        print("Debug - Testing Supabase client with a simple query...")
        # This should fail gracefully if API key is invalid
        result = supabase.table('test').select('*').limit(1).execute()
        print("Debug - Supabase client test query successful")
    except Exception as test_error:
        print(f"Debug - Supabase client test query failed: {test_error}")
        print(f"Debug - Error type: {type(test_error).__name__}")

except Exception as client_error:
    print(f"Debug - Failed to create Supabase client: {client_error}")
    print(f"Debug - Client error type: {type(client_error).__name__}")
    raise

def get_supabase_client() -> Client:
    return supabase