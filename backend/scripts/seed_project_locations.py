#!/usr/bin/env python3
"""
Script para popular dados de exemplo de locações de projetos
"""

import sys
import os
from datetime import date, datetime, timedelta
from decimal import Decimal

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_db
from app.models.project_location import ProjectLocation, ProjectLocationStatus
from app.models.project import Project
from app.models.location import Location
from app.models.user import User

def seed_project_locations():
    """Popular dados de exemplo de locações de projetos"""

    db = next(get_db())

    try:
        # Buscar projetos existentes
        projects = db.query(Project).limit(3).all()
        if not projects:
            print("❌ Nenhum projeto encontrado. Execute primeiro o script de seed de projetos.")
            return

        # Buscar locações existentes
        locations = db.query(Location).limit(5).all()
        if not locations:
            print("❌ Nenhuma locação encontrada. Execute primeiro o script de seed de locações.")
            return

        # Buscar usuários existentes
        users = db.query(User).limit(3).all()
        if not users:
            print("❌ Nenhum usuário encontrado. Execute primeiro o script de seed de usuários.")
            return

        print(f"📋 Encontrados {len(projects)} projetos, {len(locations)} locações e {len(users)} usuários")

        # Criar locações de projetos de exemplo
        project_locations_data = [
            {
                'project_id': projects[0].id,
                'location_id': locations[0].id,
                'status': ProjectLocationStatus.CONFIRMED,
                'rental_start_date': date.today() + timedelta(days=7),
                'rental_end_date': date.today() + timedelta(days=14),
                'rental_start_time': '08:00',
                'rental_end_time': '18:00',
                'daily_rate': 2500.0,
                'total_days': 7,
                'total_cost': 17500.0,
                'responsible_user_id': users[0].id,
                'coordinator_user_id': users[1].id,
                'notes': 'Gravação principal do filme de ação',
                'special_requirements': {
                    'lighting': 'Iluminação profissional',
                    'sound': 'Isolamento acústico',
                    'parking': '10 vagas para equipe'
                },
                'equipment_needed': {
                    'cameras': '3 câmeras 4K',
                    'lighting': 'Kit de iluminação completo',
                    'sound': 'Equipamento de som profissional'
                }
            },
            {
                'project_id': projects[0].id,
                'location_id': locations[1].id,
                'status': ProjectLocationStatus.PENDING,
                'rental_start_date': date.today() + timedelta(days=15),
                'rental_end_date': date.today() + timedelta(days=17),
                'rental_start_time': '09:00',
                'rental_end_time': '17:00',
                'daily_rate': 1800.0,
                'total_days': 3,
                'total_cost': 5400.0,
                'responsible_user_id': users[1].id,
                'notes': 'Cenas externas e perseguições',
                'special_requirements': {
                    'access': 'Acesso para veículos',
                    'permit': 'Permissão para filmagem'
                }
            },
            {
                'project_id': projects[1].id if len(projects) > 1 else projects[0].id,
                'location_id': locations[2].id if len(locations) > 2 else locations[0].id,
                'status': ProjectLocationStatus.CONFIRMED,
                'rental_start_date': date.today() + timedelta(days=10),
                'rental_end_date': date.today() + timedelta(days=12),
                'rental_start_time': '10:00',
                'rental_end_time': '16:00',
                'hourly_rate': 200.0,
                'total_hours': 18.0,  # 3 dias x 6 horas
                'total_cost': 3600.0,
                'responsible_user_id': users[2].id if len(users) > 2 else users[0].id,
                'notes': 'Campanha publicitária de moda',
                'special_requirements': {
                    'dressing_room': 'Camarim para modelos',
                    'makeup': 'Área para maquiagem'
                }
            },
            {
                'project_id': projects[2].id if len(projects) > 2 else projects[0].id,
                'location_id': locations[3].id if len(locations) > 3 else locations[1].id,
                'status': ProjectLocationStatus.IN_USE,
                'rental_start_date': date.today() - timedelta(days=2),
                'rental_end_date': date.today() + timedelta(days=3),
                'rental_start_time': '08:00',
                'rental_end_time': '20:00',
                'daily_rate': 3000.0,
                'total_days': 5,
                'total_cost': 15000.0,
                'responsible_user_id': users[0].id,
                'coordinator_user_id': users[1].id,
                'notes': 'Documentário sobre sustentabilidade - em produção',
                'special_requirements': {
                    'interview_setup': 'Configuração para entrevistas',
                    'green_screen': 'Fundo verde disponível'
                }
            },
            {
                'project_id': projects[0].id,
                'location_id': locations[4].id if len(locations) > 4 else locations[2].id,
                'status': ProjectLocationStatus.COMPLETED,
                'rental_start_date': date.today() - timedelta(days=10),
                'rental_end_date': date.today() - timedelta(days=8),
                'rental_start_time': '09:00',
                'rental_end_time': '17:00',
                'daily_rate': 2200.0,
                'total_days': 3,
                'total_cost': 6600.0,
                'responsible_user_id': users[1].id,
                'notes': 'Pré-produção e testes de equipamentos - concluído',
                'special_requirements': {
                    'testing': 'Área para testes de equipamentos'
                }
            }
        ]

        created_count = 0
        for data in project_locations_data:
            # Verificar se já existe
            existing = db.query(ProjectLocation).filter(
                ProjectLocation.project_id == data['project_id'],
                ProjectLocation.location_id == data['location_id']
            ).first()

            if existing:
                print(f"⚠️  Locação já existe para projeto {data['project_id']} e locação {data['location_id']}")
                continue

            project_location = ProjectLocation(**data)
            db.add(project_location)
            created_count += 1

        db.commit()
        print(f"✅ Criadas {created_count} locações de projetos")

        # Atualizar orçamentos dos projetos
        for project in projects:
            project_locations = db.query(ProjectLocation).filter(
                ProjectLocation.project_id == project.id,
                ProjectLocation.status == ProjectLocationStatus.CONFIRMED
            ).all()

            total_cost = sum(pl.total_cost or 0 for pl in project_locations)
            project.budget_spent = total_cost

            print(f"💰 Projeto '{project.name}': R$ {total_cost:,.2f} em locações confirmadas")

        db.commit()
        print("✅ Orçamentos dos projetos atualizados")

        # Mostrar resumo
        print("\n📊 Resumo das Locações de Projetos:")
        for project in projects:
            project_locations = db.query(ProjectLocation).filter(
                ProjectLocation.project_id == project.id
            ).all()

            if project_locations:
                print(f"\n🎬 Projeto: {project.name}")
                for pl in project_locations:
                    location = db.query(Location).filter(Location.id == pl.location_id).first()
                    location_name = location.title if location else f"Locacao {pl.location_id}"

                    print(f"  📍 {location_name}")
                    print(f"     Status: {pl.status.value}")
                    print(f"     Período: {pl.rental_start_date} a {pl.rental_end_date}")
                    print(f"     Custo: R$ {pl.total_cost:,.2f}")
                    if pl.notes:
                        print(f"     Observações: {pl.notes}")

    except Exception as e:
        print(f"❌ Erro ao popular dados: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Iniciando seed de locações de projetos...")
    seed_project_locations()
    print("✅ Seed de locações de projetos concluído!")
