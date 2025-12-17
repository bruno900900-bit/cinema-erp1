
import sys
import os
from sqlalchemy import text

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.app.core.database_postgres import engine
    print("Tentando conectar ao banco via SQLAlchemy/Postgres...")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        print(f"✅ Sucesso! Conectado a: {result.fetchone()[0]}")

        # Check if we are superuser or have enough privileges (optional, but good to know)
        try:
             # Try a simple safe operation or just query current user
             user_res = conn.execute(text("SELECT current_user"))
             print(f"👤 Usuário atual: {user_res.fetchone()[0]}")
        except Exception as e:
             print(f"⚠️  Conectado, mas erro ao verificar usuário: {e}")

except Exception as e:
    print(f"❌ Não foi possível conectar: {e}")
    print("Provavelmente as credenciais do banco (POSTGRES_USER, PASSWORD, etc) não estão no .env ou estão incorretas.")
