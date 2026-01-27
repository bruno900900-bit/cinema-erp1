"""Script to promote a user to admin role"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User, UserRole

def promote_to_admin(email: str = None):
    db = SessionLocal()
    try:
        # List all users
        users = db.query(User).all()
        print(f"\n=== Users in database ({len(users)}) ===")
        for u in users:
            role = u.role.value if u.role else "none"
            print(f"  ID: {u.id}, Email: {u.email}, Role: {role}")

        if not users:
            print("\nNo users found in database!")
            return

        # Find user to promote
        if email:
            user = db.query(User).filter(User.email == email).first()
        else:
            # Promote first user found
            user = users[0]
            print(f"\nNo email specified, using first user: {user.email}")

        if not user:
            print(f"\nUser with email '{email}' not found!")
            return

        # Promote to admin
        old_role = user.role.value if user.role else "none"
        user.role = UserRole.ADMIN
        db.commit()

        print(f"\n=== SUCCESS ===")
        print(f"User '{user.email}' promoted from '{old_role}' to 'admin'")
        print(f"\nYou can now login and access /users management page!")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else None
    promote_to_admin(email)
