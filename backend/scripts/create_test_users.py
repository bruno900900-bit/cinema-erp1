#!/usr/bin/env python3
"""
Script para criar usuários de teste com senhas funcionais
"""

import sys
import os
from datetime import datetime

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, create_tables
from app.models.user import User, UserRole
from app.core.auth import get_password_hash

def create_test_users():
    """Cria usuários de teste com senhas funcionais"""
    db = SessionLocal()

    try:
        print("🔐 Criando usuários de teste...")

        # Lista de usuários de teste
        test_users = [
            {
                "email": "admin@cinema.com",
                "full_name": "Administrador Sistema",
                "password": "admin123",
                "role": UserRole.ADMIN,
                "bio": "Administrador do sistema com acesso total"
            },
            {
                "email": "gerente@cinema.com",
                "full_name": "Maria Gerente",
                "password": "gerente123",
                "role": UserRole.MANAGER,
                "bio": "Gerente de projetos e equipes"
            },
            {
                "email": "joao.silva@cinema.com",
                "full_name": "João Silva",
                "password": "joao123",
                "role": UserRole.OPERATOR,
                "bio": "Diretor de Produção"
            },
            {
                "email": "maria.santos@cinema.com",
                "full_name": "Maria Santos",
                "password": "maria123",
                "role": UserRole.OPERATOR,
                "bio": "Produtora Executiva"
            },
            {
                "email": "pedro.oliveira@cinema.com",
                "full_name": "Pedro Oliveira",
                "password": "pedro123",
                "role": UserRole.OPERATOR,
                "bio": "Assistente de Produção"
            },
            {
                "email": "ana.costa@cinema.com",
                "full_name": "Ana Costa",
                "password": "ana123",
                "role": UserRole.COORDINATOR,
                "bio": "Coordenadora de Locação"
            },
            {
                "email": "cliente@nike.com",
                "full_name": "Cliente Nike",
                "password": "cliente123",
                "role": UserRole.CLIENT,
                "bio": "Cliente externo - Nike Brasil"
            }
        ]

        created_count = 0
        updated_count = 0

        for user_data in test_users:
            # Verificar se usuário já existe
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()

            if existing_user:
                # Atualizar senha do usuário existente
                existing_user.password_hash = get_password_hash(user_data["password"])
                existing_user.role = user_data["role"]
                existing_user.bio = user_data["bio"]
                existing_user.is_active = True
                updated_count += 1
                print(f"✅ Atualizado: {user_data['email']} (senha: {user_data['password']})")
            else:
                # Criar novo usuário
                new_user = User(
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    password_hash=get_password_hash(user_data["password"]),
                    role=user_data["role"],
                    bio=user_data["bio"],
                    is_active=True
                )
                db.add(new_user)
                created_count += 1
                print(f"🆕 Criado: {user_data['email']} (senha: {user_data['password']})")

        db.commit()

        print(f"\n🎉 Usuários de teste criados/atualizados com sucesso!")
        print(f"📊 Estatísticas:")
        print(f"   - Novos usuários: {created_count}")
        print(f"   - Usuários atualizados: {updated_count}")
        print(f"   - Total processados: {created_count + updated_count}")

        print(f"\n🔑 Credenciais de Login:")
        print("=" * 50)
        for user_data in test_users:
            print(f"Email: {user_data['email']}")
            print(f"Senha: {user_data['password']}")
            print(f"Role:  {user_data['role']}")
            print("-" * 30)

        print(f"\n💡 Dicas:")
        print("- Use 'admin@cinema.com' para acesso total")
        print("- Use 'gerente@cinema.com' para gerenciar projetos")
        print("- Use 'cliente@nike.com' para simular cliente externo")
        print("- Todas as senhas seguem o padrão: nome123")

    except Exception as e:
        print(f"❌ Erro ao criar usuários: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Iniciando criação de usuários de teste...")
    create_test_users()
    print("🎉 Concluído!")
