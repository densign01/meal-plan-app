#!/usr/bin/env python3
"""
Quick script to verify recipes table was created successfully
"""

from database import supabase

def verify_table():
    """Check if recipes table exists and is queryable"""
    try:
        print("🔍 Checking recipes table...")

        # Try to query the table
        result = supabase.table("recipes").select("id, name").limit(1).execute()

        print("✅ Recipes table exists and is queryable!")
        print(f"   Current recipe count: {len(result.data)}")

        if result.data:
            print(f"   Sample recipe: {result.data[0]}")
        else:
            print("   Table is empty (ready for new recipes)")

        return True

    except Exception as e:
        print(f"❌ Error accessing recipes table: {e}")
        print("\n💡 Make sure you ran the SQL migration in Supabase SQL Editor")
        return False

if __name__ == "__main__":
    success = verify_table()
    exit(0 if success else 1)
