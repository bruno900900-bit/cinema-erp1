import sqlite3

conn = sqlite3.connect('cinema_erp.db')
cursor = conn.cursor()

try:
    cursor.execute('ALTER TABLE users ADD COLUMN permissions_json TEXT')
    conn.commit()
    print('✅ Column permissions_json added successfully')
except Exception as e:
    print(f'Error: {e}')
finally:
    conn.close()
