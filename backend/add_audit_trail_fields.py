"""
Migration script to add audit trail fields to project_location_stages table
"""
import sqlite3
from pathlib import Path

# Database path
DB_PATH = Path(__file__).parent / "cinema_erp.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Adding audit trail fields to project_location_stages...")

        # Add status tracking fields
        cursor.execute("""
            ALTER TABLE project_location_stages
            ADD COLUMN status_changed_at TIMESTAMP
        """)

        cursor.execute("""
            ALTER TABLE project_location_stages
            ADD COLUMN status_changed_by_user_id INTEGER
            REFERENCES users(id)
        """)

        # Add completion tracking fields
        cursor.execute("""
            ALTER TABLE project_location_stages
            ADD COLUMN completion_changed_at TIMESTAMP
        """)

        cursor.execute("""
            ALTER TABLE project_location_stages
            ADD COLUMN completion_changed_by_user_id INTEGER
            REFERENCES users(id)
        """)

        conn.commit()
        print("✅ Migration completed successfully!")

    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("ℹ️  Columns already exist, skipping migration.")
        else:
            print(f"❌ Error: {e}")
            conn.rollback()
            raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
