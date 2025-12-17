import sys
import os
import asyncio

# Add backend directory to python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from config.supabase import get_supabase_admin

async def fix_auth_ids():
    print("🚀 Iniciando correção de auth_id em public.users...")

    admin = get_supabase_admin()

    # 1. Fetch all Auth Users
    print("📥 Buscando usuários do Auth...")
    # admin.auth.admin.list_users() is the way to get users in supabase-py
    try:
        auth_response = admin.auth.admin.list_users()
        auth_users = auth_response.users
        print(f"✅ Encontrados {len(auth_users)} usuários no Auth.")
    except Exception as e:
        print(f"❌ Erro ao buscar usuários do Auth: {e}")
        return

    # 2. Fetch all Public Users
    print("📥 Buscando usuários da tabela public.users...")
    try:
        public_users_response = admin.from_('users').select('*').execute()
        public_users = public_users_response.data
        print(f"✅ Encontrados {len(public_users)} usuários na tabela 'users'.")
    except Exception as e:
        print(f"❌ Erro ao buscar usuários da tabela 'users': {e}")
        return

    # 3. Match and Update
    print("🔄 Sincronizando...")
    updates_count = 0

    for p_user in public_users:
        email = p_user.get('email')
        if not email:
            continue

        # Find matching auth user
        match = next((u for u in auth_users if u.email == email), None)

        if match:
            current_auth_id = p_user.get('auth_id')
            if current_auth_id != match.id:
                print(f"🛠️ Atualizando {email}: {current_auth_id} -> {match.id}")
                try:
                    admin.from_('users').update({'auth_id': match.id}).eq('id', p_user['id']).execute()
                    updates_count += 1
                except Exception as e:
                    print(f"❌ Falha ao atualizar {email}: {e}")
            else:
                print(f"✨ {email} já está sincronizado.")
        else:
            print(f"⚠️ Usuário {email} existe na tabela 'users' mas não no Auth.")

    print(f"\n✅ Concluído! {updates_count} usuários atualizados.")

if __name__ == "__main__":
    asyncio.run(fix_auth_ids())
