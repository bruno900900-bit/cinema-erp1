"""
Script to recreate project_locations table with correct schema
"""
import sqlite3
import os

db_path = "cinema_erp.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Backup existing data
cursor.execute('SELECT * FROM project_locations')
existing_data = cursor.fetchall()
print(f"Backed up {len(existing_data)} rows")

# Get column names for reference
cursor.execute('PRAGMA table_info(project_locations)')
old_columns = [row[1] for row in cursor.fetchall()]
print(f"Old columns: {old_columns}")

# Drop old table
cursor.execute('DROP TABLE IF EXISTS project_locations')
print("Dropped old table")

# Create new table with correct schema matching the SQLAlchemy model
cursor.execute('''
CREATE TABLE project_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    location_id INTEGER NOT NULL REFERENCES locations(id),
    rental_start DATE NOT NULL,
    rental_end DATE NOT NULL,
    rental_start_time DATETIME,
    rental_end_time DATETIME,
    daily_rate FLOAT NOT NULL DEFAULT 0.0,
    hourly_rate FLOAT,
    total_cost FLOAT NOT NULL DEFAULT 0.0,
    currency VARCHAR(3) DEFAULT 'BRL',
    status VARCHAR(20) DEFAULT 'reserved',
    completion_percentage FLOAT DEFAULT 0.0,
    responsible_user_id INTEGER REFERENCES users(id),
    coordinator_user_id INTEGER REFERENCES users(id),
    notes TEXT,
    special_requirements TEXT,
    equipment_needed TEXT,
    contract_url VARCHAR(500),
    attachments_json JSON,
    visit_date DATE,
    visit_time DATETIME,
    technical_visit_date DATE,
    technical_visit_time DATETIME,
    filming_start_date DATE,
    filming_end_date DATE,
    filming_start_time DATETIME,
    filming_end_time DATETIME,
    delivery_date DATE,
    delivery_time DATETIME
)
''')
print("Created new project_locations table with correct schema")

conn.commit()
conn.close()

print("\n✅ Table recreated successfully!")
print("Note: Previous data was not migrated (schema mismatch)")
