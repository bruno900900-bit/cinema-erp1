
import sys
import os
from sqlalchemy import text, inspect

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.app.core.database_postgres import engine

    inspector = inspect(engine)

    print("--- TABLE: agenda_events ---")
    if inspector.has_table("agenda_events"):
        for col in inspector.get_columns("agenda_events"):
            print(f"  {col['name']} ({col['type']})")
    else:
        print("  Table not found!")

    print("\n--- TABLE: locations ---")
    if inspector.has_table("locations"):
        for col in inspector.get_columns("locations"):
            print(f"  {col['name']} ({col['type']})")
    else:
        print("  Table not found!")

    print("\n--- TABLE: projects ---")
    if inspector.has_table("projects"):
        for col in inspector.get_columns("projects"):
            print(f"  {col['name']} ({col['type']})")
    else:
        print("  Table not found!")

except Exception as e:
    print(f"❌ Error inspecting DB: {e}")
