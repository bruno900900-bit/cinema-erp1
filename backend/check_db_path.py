
import sys
import os
# Adiciona o diretório atual ao path para importar
sys.path.append(os.getcwd())

try:
    from app.core.database import SQLALCHEMY_DATABASE_URL, DB_PATH
    print(f"SQLALCHEMY_DATABASE_URL: {SQLALCHEMY_DATABASE_URL}")
    print(f"DB_PATH resolved to: {DB_PATH}")

    if os.path.exists(DB_PATH):
        print(f"File exists: Yes")
        import sqlite3
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("PRAGMA table_info(project_locations)")
        cols = [r[1] for r in c.fetchall()]
        print(f"Columns in DB: {cols}")
        conn.close()
    else:
        print(f"File exists: No")

except Exception as e:
    print(f"Error: {e}")
