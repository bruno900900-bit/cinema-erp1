"""
Migration script to convert sector_type to sector_types array
"""
import sqlite3
from pathlib import Path

# Database path
DB_PATH = Path(__file__).parent / "cinema_erp.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Migrando sector_type para sector_types...")

        # Adicionar nova coluna sector_types
        try:
            cursor.execute("""
                ALTER TABLE locations
                ADD COLUMN sector_types TEXT
            """)
            print("✅ Coluna sector_types adicionada")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print("ℹ️  Coluna sector_types já existe")
            else:
                raise

        # Migrar dados existentes: sector_type → sector_types
        cursor.execute("""
            SELECT id, sector_type FROM locations WHERE sector_type IS NOT NULL
        """)
        locations_to_migrate = cursor.fetchall()

        for location_id, sector_type in locations_to_migrate:
            # Converter string para array JSON
            sector_array = f'["{sector_type}"]'
            cursor.execute("""
                UPDATE locations
                SET sector_types = ?
                WHERE id = ?
            """, (sector_array, location_id))

        print(f"✅ Migrados {len(locations_to_migrate)} registros")

        conn.commit()
        print("✅ Migration concluída com sucesso!")

    except Exception as e:
        print(f"❌ Erro: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
