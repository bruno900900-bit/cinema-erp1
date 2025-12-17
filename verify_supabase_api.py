
import sys
import os
import traceback

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    print("Tentando importar cliente Supabase...")
    from backend.config.supabase import get_supabase_admin
    admin = get_supabase_admin()
    print("✅ Cliente Admin criado com sucesso.")

    # Try a simple fetch
    print("Testando acesso aos usuários...")
    res = admin.auth.admin.list_users()
    print(f"✅ Sucesso! {len(res.users)} usuários encontrados via API.")

except Exception:
    print("❌ Falha no cliente Supabase API.")
    traceback.print_exc()
