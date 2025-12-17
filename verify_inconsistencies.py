
import os
import asyncio
from supabase import create_client

# Credentials (hardcoded for reliability in this script since I know them)
SUPABASE_URL = "https://rwpmtuohcvnciemtsjge.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_agenda():
    print("\n--- 📅 Checking Agenda Events ---")
    try:
        # Try to select one row
        res = supabase.table("agenda_events").select("*").limit(1).execute()
        if len(res.data) > 0:
            row = res.data[0]
            print(f"✅ Agenda Columns found in a row: {list(row.keys())}")

            # Check specific conflicts
            has_start_date = 'start_date' in row
            has_event_date = 'event_date' in row

            if has_start_date and not has_event_date:
                print("👉 Frontend is CORRECT (start_date exists, event_date missing)")
            elif has_event_date and not has_start_date:
                print("👉 Backend Model is CORRECT (event_date exists, start_date missing)")
            else:
                print(f"👉 Mixed/Both? start_date={has_start_date}, event_date={has_event_date}")
        else:
            print("⚠️ Table exists but empty. Can't infer columns from data.")
            # Try to insert dummy data to see what fails
            print("Attempting dry-run insert to check columns...")
            try:
                # Try frontend style
                supabase.table("agenda_events").insert({
                    "title": "Test Frontend",
                    "start_date": "2024-01-01",
                    "event_type": "meeting"
                }).execute()
                print("✅ Insert with 'start_date' Worked!")
            except Exception as e:
                print(f"❌ Insert with 'start_date' Failed: {e}")

            try:
                # Try backend style
                supabase.table("agenda_events").insert({
                    "title": "Test Backend",
                    "event_date": "2024-01-01",
                    "event_type": "meeting"
                }).execute()
                print("✅ Insert with 'event_date' Worked!")
            except Exception as e:
                print(f"❌ Insert with 'event_date' Failed: {e}")

    except Exception as e:
        print(f"❌ Error accessing agenda_events: {e}")

def check_locations():
    print("\n--- 📍 Checking Locations ---")
    try:
        res = supabase.table("locations").select("*").limit(1).execute()
        if len(res.data) > 0:
            row = res.data[0]
            print(f"✅ Location Columns found: {list(row.keys())}")

            has_sector_type = 'sector_type' in row
            has_sector_types = 'sector_types' in row

            if has_sector_type: print("👉 Backend Model is CORRECT (sector_type exists)")
            if has_sector_types: print("👉 Frontend Request is CORRECT (sector_types exists)")
            if not has_sector_type and not has_sector_types: print("👉 Neither found!")
        else:
             print("⚠️ Locations table empty.")
    except Exception as e:
        print(f"❌ Error accessing locations: {e}")

def check_projects():
    print("\n--- 📋 Checking Projects ---")
    try:
        res = supabase.table("projects").select("*").limit(1).execute()
        if len(res.data) > 0:
            row = res.data[0]
            print(f"✅ Project Columns found: {list(row.keys())}")

            has_name = 'name' in row
            has_title = 'title' in row

            if has_name: print("👉 'name' column exists")
            if has_title: print("👉 'title' column exists")

            has_budget = 'budget' in row
            has_total = 'budget_total' in row

            if has_budget: print("👉 'budget' column exists")
            if has_total: print("👉 'budget_total' column exists")

    except Exception as e:
        print(f"❌ Error accessing projects: {e}")

if __name__ == "__main__":
    check_agenda()
    check_locations()
    check_projects()
