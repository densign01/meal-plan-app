#!/usr/bin/env python3
"""
Run SQL migration to create recipes table in Supabase.
This script executes the SQL from migrations/create_recipes_table.sql
"""

from database import supabase
import os

def run_migration():
    """Execute the recipes table migration"""

    # Read the SQL file
    sql_file_path = os.path.join(os.path.dirname(__file__), 'migrations', 'create_recipes_table.sql')

    with open(sql_file_path, 'r') as f:
        sql_content = f.read()

    print("📝 Running recipes table migration...")
    print(f"📄 SQL file: {sql_file_path}")
    print("-" * 60)

    try:
        # Execute the SQL using Supabase's RPC or direct SQL execution
        # Note: Supabase Python client doesn't support direct SQL execution
        # We'll use the rpc method if available, or postgrest query

        # Split SQL into individual statements
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]

        print(f"Found {len(statements)} SQL statements to execute\n")

        # Execute each statement
        for i, statement in enumerate(statements, 1):
            if not statement:
                continue

            # Get first few words for logging
            preview = ' '.join(statement.split()[:5]) + "..."
            print(f"[{i}/{len(statements)}] Executing: {preview}")

            try:
                # Use rpc to execute SQL
                result = supabase.rpc('exec_sql', {'query': statement}).execute()
                print(f"  ✅ Success")
            except Exception as e:
                error_msg = str(e)

                # Check if it's a "already exists" error - these are okay
                if 'already exists' in error_msg.lower():
                    print(f"  ⚠️  Already exists (skipping)")
                else:
                    print(f"  ❌ Error: {error_msg}")
                    raise

        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)

    except Exception as e:
        print("\n" + "=" * 60)
        print(f"❌ Migration failed: {str(e)}")
        print("=" * 60)
        print("\n💡 Note: You may need to run this SQL directly in the Supabase SQL Editor")
        print(f"   SQL file location: {sql_file_path}")
        raise

if __name__ == "__main__":
    run_migration()
