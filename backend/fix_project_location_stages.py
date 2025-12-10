
import sqlite3
import os

db_path = "cinema_erp.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Dropping project_location_stages...")
cursor.execute('DROP TABLE IF EXISTS project_location_stages')

print("Creating project_location_stages with correct schema...")
# Schema aligned with model and error log parameters
cursor.execute('''
CREATE TABLE project_location_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    project_location_id INTEGER NOT NULL REFERENCES project_locations(id),
    stage_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    completion_percentage FLOAT DEFAULT 0.0,
    planned_start_date DATETIME,
    planned_end_date DATETIME,
    actual_start_date DATETIME,
    actual_end_date DATETIME,
    responsible_user_id INTEGER REFERENCES users(id),
    coordinator_user_id INTEGER REFERENCES users(id),
    weight FLOAT DEFAULT 1.0,
    is_milestone BOOLEAN DEFAULT 0,
    is_critical BOOLEAN DEFAULT 0,
    notes TEXT,
    attachments_json JSON,
    dependencies_json JSON
)
''')

conn.commit()
conn.close()
print("✅ Table project_location_stages recreated successfully!")
