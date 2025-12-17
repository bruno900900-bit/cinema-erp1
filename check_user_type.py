
import os
from supabase import create_client

SUPABASE_URL = "https://rwpmtuohcvnciemtsjge.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_user_id_type():
    print("\n--- 👥 Checking User ID Type ---")
    try:
        # Get one user
        res = supabase.table("users").select("id, auth_id").limit(1).execute()
        if len(res.data) > 0:
            user = res.data[0]
            uid = user['id']
            auth_id = user.get('auth_id')

            print(f"User ID from DB: {uid} (Type: {type(uid)})")
            print(f"Auth ID from DB: {auth_id}")

            if isinstance(uid, int):
                print("✅ users.id is INTEGER.")
            elif isinstance(uid, str) and len(uid) > 10:
                print("✅ users.id is UUID/STRING.")
            else:
                print(f"❓ User ID is {type(uid)}")

        else:
            print("⚠️ No users found in public.users")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_user_id_type()
