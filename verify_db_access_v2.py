
import sys
import os
import traceback
from sqlalchemy import text

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.app.core.database_postgres import engine
    print("Trying to connect to DB...")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        print(f"Success! Connected to: {result.fetchone()[0]}")

        try:
             user_res = conn.execute(text("SELECT current_user"))
             print(f"Current user: {user_res.fetchone()[0]}")
        except Exception as e:
             print(f"Connected, but error checking user: {e}")

except Exception:
    print("Failed to connect.")
    traceback.print_exc()
