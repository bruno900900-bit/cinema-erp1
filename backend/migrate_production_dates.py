"""
Migration script to add production date columns to project_locations table
"""
import sqlite3
import os

# Path to database
db_path = "cinema_erp.db"

if not os.path.exists(db_path):
    print(f"Error: Database {db_path} not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get existing columns
cursor.execute('PRAGMA table_info(project_locations)')
existing_columns = [row[1] for row in cursor.fetchall()]
print(f"Existing columns ({len(existing_columns)}): {existing_columns}")

# Columns to add
columns_to_add = [
    ('visit_date', 'DATE'),
    ('visit_time', 'DATETIME'),
    ('technical_visit_date', 'DATE'),
    ('technical_visit_time', 'DATETIME'),
    ('filming_start_date', 'DATE'),
    ('filming_end_date', 'DATE'),
    ('filming_start_time', 'DATETIME'),
    ('filming_end_time', 'DATETIME'),
    ('delivery_date', 'DATE'),
    ('delivery_time', 'DATETIME')
]

added = 0
for col_name, col_type in columns_to_add:
    if col_name not in existing_columns:
        try:
            sql = f'ALTER TABLE project_locations ADD COLUMN {col_name} {col_type}'
            cursor.execute(sql)
            print(f"✅ Added column: {col_name}")
            added += 1
        except Exception as e:
            print(f"❌ Error adding {col_name}: {e}")
    else:
        print(f"⏭️  Column {col_name} already exists")

conn.commit()
conn.close()

print(f"\n✅ Migration complete! Added {added} new columns.")
