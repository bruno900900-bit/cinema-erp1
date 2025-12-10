#!/usr/bin/env python3
"""
Script para configurar o banco de dados
"""

import sys
import os
from datetime import date, datetime, timezone

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import create_tables, SessionLocal
from app.core.auth import get_password_hash
from app.models.location import Location, LocationStatus, SpaceType, SectorType
from app.models.supplier import Supplier
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole
from app.models.project_location import ProjectLocation, RentalStatus
from app.models.project_location_stage import ProjectLocationStage, StageStatus, LocationStageType

def setup_database():
    """Configurar banco de dados e criar dados de exemplo"""
    try:
        print("🔄 Criando tabelas...")
        create_tables()
        print("✅ Tabelas criadas com sucesso!")

        with SessionLocal() as db:
            users = ensure_default_users(db)
            create_sample_data(db, users)

    except Exception as e:
        print(f"❌ Erro ao configurar banco: {e}")
        raise


def ensure_default_users(db):
    """Garante que existam usuários mínimos para os dados de exemplo"""
    existing_users = db.query(User).order_by(User.id).all()
    if len(existing_users) >= 3:
        print(f"✅ Usando {len(existing_users)} usuários existentes")
        return existing_users

    print("👥 Criando usuários padrão para desenvolvimento...")
    default_users = [
        {
            "email": "admin@cinema.com",
            "full_name": "Administrador do Sistema",
            "role": UserRole.ADMIN,
            "password": "admin123",
        },
        {
            "email": "manager@cinema.com",
            "full_name": "Gerente de Projetos",
            "role": UserRole.MANAGER,
            "password": "manager123",
        },
        {
            "email": "coordenador@cinema.com",
            "full_name": "Coordenador de Locações",
            "role": UserRole.COORDINATOR,
            "password": "coordenador123",
        },
    ]

    created_users = []
    for data in default_users:
        if db.query(User).filter(User.email == data["email"]).first():
            continue

        user = User(
            email=data["email"],
            full_name=data["full_name"],
            role=data["role"],
            password_hash=get_password_hash(data["password"]),
            is_active=True,
            timezone="America/Sao_Paulo",
            locale="pt-BR",
        )
        db.add(user)
        created_users.append(
            {
                "email": data["email"],
                "password": data["password"],
                "role": data["role"].value,
            }
        )

    if created_users:
        db.commit()
        print(f"✅ {len(created_users)} usuário(s) padrão criado(s)")
        for info in created_users:
            print(
                f"   - {info['email']} (senha: {info['password']}, papel: {info['role']})"
            )

    users = db.query(User).order_by(User.id).all()
    if len(users) < 3:
        raise RuntimeError(
            "Não foi possível garantir usuários padrões suficientes para os dados de exemplo."
        )

    return users


def create_sample_data(db, users):
    """Criar dados de exemplo"""
    try:
        # Verificar se já existem dados
        if db.query(Location).count() > 0:
            print("⚠️  Locações já existem no banco. Pulando criação.")
            return

        print("🌱 Criando dados de exemplo...")

        # Criar fornecedores
        suppliers_data = [
            {
                'name': 'Estúdios SP Ltda',
                'email': 'contato@estudiosp.com',
                'phone': '(11) 99999-9999',
                'tax_id': '12.345.678/0001-90',
                'address_json': {
                    'street': 'Rua das Artes',
                    'number': '123',
                    'neighborhood': 'Centro',
                    'city': 'São Paulo',
                    'state': 'SP',
                    'postal_code': '01000-000'
                },
                'is_active': True
            },
            {
                'name': 'Patrimônio Cultural RJ',
                'email': 'locacao@patrimonio-rj.com',
                'phone': '(21) 88888-8888',
                'tax_id': '98.765.432/0001-10',
                'address_json': {
                    'street': 'Av. Histórica',
                    'number': '456',
                    'neighborhood': 'Centro',
                    'city': 'Rio de Janeiro',
                    'state': 'RJ',
                    'postal_code': '20000-000'
                },
                'is_active': True
            }
        ]

        suppliers = []
        for supplier_data in suppliers_data:
            supplier = Supplier(**supplier_data)
            db.add(supplier)
            suppliers.append(supplier)

        db.commit()
        print(f"✅ Criados {len(suppliers)} fornecedores")

        # Criar locações
        locations_data = [
            {
                'title': 'Estúdio Central - São Paulo',
                'slug': 'estudio-central-sp',
                'summary': 'Estúdio moderno no centro de São Paulo',
                'description': 'Estúdio de 200m² com equipamentos profissionais, ideal para gravações de cinema e publicidade.',
                'status': LocationStatus.APPROVED,
                'supplier_id': suppliers[0].id,
                'sector_type': SectorType.CINEMA,
                'price_day_cinema': 2500.0,
                'price_hour_cinema': 350.0,
                'price_day_publicidade': 1800.0,
                'price_hour_publicidade': 250.0,
                'currency': 'BRL',
                'street': 'Rua das Artes',
                'number': '123',
                'neighborhood': 'Centro',
                'city': 'São Paulo',
                'state': 'SP',
                'country': 'Brasil',
                'postal_code': '01000-000',
                'space_type': SpaceType.STUDIO,
                'capacity': 50,
                'area_size': 200.0,
                'power_specs': '220V, 100A, 3 fases',
                'noise_level': 'Baixo (isolamento acústico)',
                'parking_spots': 20
            },
            {
                'title': 'Casa Histórica - Rio de Janeiro',
                'slug': 'casa-historica-rj',
                'summary': 'Casa histórica do século XIX no Rio de Janeiro',
                'description': 'Casa colonial preservada, perfeita para produções de época e publicidade premium.',
                'status': LocationStatus.APPROVED,
                'supplier_id': suppliers[1].id,
                'sector_type': SectorType.CINEMA,
                'price_day_cinema': 3200.0,
                'price_hour_cinema': 450.0,
                'price_day_publicidade': 2400.0,
                'price_hour_publicidade': 320.0,
                'currency': 'BRL',
                'street': 'Av. Histórica',
                'number': '456',
                'neighborhood': 'Centro',
                'city': 'Rio de Janeiro',
                'state': 'RJ',
                'country': 'Brasil',
                'postal_code': '20000-000',
                'space_type': SpaceType.HOUSE,
                'capacity': 30,
                'area_size': 150.0,
                'power_specs': '220V, 60A, 2 fases',
                'noise_level': 'Médio',
                'parking_spots': 8
            },
            {
                'title': 'Galpão Industrial - Belo Horizonte',
                'slug': 'galpao-industrial-bh',
                'summary': 'Galpão industrial adaptado para produções',
                'description': 'Galpão de 500m² com pé-direito alto, ideal para produções que precisam de muito espaço.',
                'status': LocationStatus.APPROVED,
                'supplier_id': suppliers[0].id,
                'sector_type': SectorType.CINEMA,
                'price_day_cinema': 1800.0,
                'price_hour_cinema': 250.0,
                'price_day_publicidade': 1200.0,
                'price_hour_publicidade': 180.0,
                'currency': 'BRL',
                'street': 'Rua Industrial',
                'number': '789',
                'neighborhood': 'Industrial',
                'city': 'Belo Horizonte',
                'state': 'MG',
                'country': 'Brasil',
                'postal_code': '30000-000',
                'space_type': SpaceType.WAREHOUSE,
                'capacity': 100,
                'area_size': 500.0,
                'power_specs': '380V, 200A, 3 fases',
                'noise_level': 'Alto (área industrial)',
                'parking_spots': 30
            }
        ]

        locations = []
        for location_data in locations_data:
            location = Location(**location_data)
            db.add(location)
            locations.append(location)

        db.commit()
        print(f"✅ Criadas {len(locations)} locações")

        # Criar projetos
        projects_data = [
            {
                'name': 'Filme de Ação - Verão 2024',
                'description': 'Produção de um filme de ação com cenas de perseguição e explosões',
                'status': ProjectStatus.ACTIVE,
                'client_name': 'Produtora ABC',
                'budget_total': 500000.0,
                'budget_spent': 0.0,
                'budget_currency': 'BRL',
                'created_by': users[0].id,
                'manager_id': users[1].id
            },
            {
                'name': 'Campanha Publicitária - Moda',
                'description': 'Campanha publicitária para marca de moda com locações externas',
                'status': ProjectStatus.ACTIVE,
                'client_name': 'Fashion Brand',
                'budget_total': 200000.0,
                'budget_spent': 0.0,
                'budget_currency': 'BRL',
                'created_by': users[1].id,
                'manager_id': users[2].id
            },
            {
                'name': 'Documentário - Sustentabilidade',
                'description': 'Documentário sobre práticas sustentáveis na indústria',
                'status': ProjectStatus.ACTIVE,
                'client_name': 'Green Productions',
                'budget_total': 300000.0,
                'budget_spent': 0.0,
                'budget_currency': 'BRL',
                'created_by': users[2].id,
                'manager_id': users[0].id
            }
        ]

        projects = []
        for project_data in projects_data:
            project = Project(**project_data)
            db.add(project)
            projects.append(project)

        db.commit()
        print(f"✅ Criados {len(projects)} projetos")

        # Criar locações dos projetos
        project_locations_payload = [
            {
                'project_id': projects[0].id,
                'location_id': locations[0].id,
                'status': RentalStatus.CONFIRMED,
                'rental_start': date(2024, 2, 1),
                'rental_end': date(2024, 2, 15),
                'daily_rate': 2500.0,
                'hourly_rate': None,
                'total_cost': 37500.0,
                'currency': 'BRL',
                'responsible_user_id': users[1].id,
                'coordinator_user_id': users[2].id,
                'notes': 'Gravação principal do filme de ação'
            },
            {
                'project_id': projects[0].id,
                'location_id': locations[1].id,
                'status': RentalStatus.RESERVED,
                'rental_start': date(2024, 2, 16),
                'rental_end': date(2024, 2, 20),
                'daily_rate': 3200.0,
                'hourly_rate': None,
                'total_cost': 16000.0,
                'currency': 'BRL',
                'responsible_user_id': users[2].id,
                'coordinator_user_id': None,
                'notes': 'Cenas externas e perseguições'
            },
            {
                'project_id': projects[1].id,
                'location_id': locations[2].id,
                'status': RentalStatus.CONFIRMED,
                'rental_start': date(2024, 2, 10),
                'rental_end': date(2024, 2, 12),
                'daily_rate': 0.0,
                'hourly_rate': 180.0,
                'total_cost': 3240.0,
                'currency': 'BRL',
                'responsible_user_id': users[2].id,
                'coordinator_user_id': None,
                'notes': 'Campanha publicitária de moda'
            },
            {
                'project_id': projects[2].id,
                'location_id': locations[0].id,
                'status': RentalStatus.IN_USE,
                'rental_start': date(2024, 1, 25),
                'rental_end': date(2024, 1, 30),
                'daily_rate': 2500.0,
                'hourly_rate': None,
                'total_cost': 15000.0,
                'currency': 'BRL',
                'responsible_user_id': users[0].id,
                'coordinator_user_id': users[1].id,
                'notes': 'Documentário sobre sustentabilidade - em produção'
            }
        ]

        project_locations = []
        for payload in project_locations_payload:
            project_location = ProjectLocation(
                project_id=payload['project_id'],
                location_id=payload['location_id'],
                status=payload['status'],
                rental_start=payload['rental_start'],
                rental_end=payload['rental_end'],
                rental_start_time=None,
                rental_end_time=None,
                daily_rate=payload['daily_rate'],
                hourly_rate=payload['hourly_rate'],
                total_cost=payload['total_cost'],
                currency=payload['currency'],
                responsible_user_id=payload['responsible_user_id'],
                coordinator_user_id=payload['coordinator_user_id'],
                notes=payload['notes']
            )
            db.add(project_location)
            project_locations.append(project_location)

        db.commit()
        print(f"✅ Criadas {len(project_locations)} locações de projetos")

        def make_dt(year, month, day, hour=0, minute=0):
            return datetime(year, month, day, hour, minute, tzinfo=timezone.utc)

        # Criar etapas das locações
        stages_payload = {
            project_locations[0]: [
                {
                    'stage_type': LocationStageType.VISITACAO,
                    'status': StageStatus.COMPLETED,
                    'title': 'Prospecção Inicial',
                    'description': 'Primeira visita e avaliação da locação',
                    'planned_start_date': make_dt(2024, 1, 15),
                    'planned_end_date': make_dt(2024, 1, 20),
                    'actual_start_date': make_dt(2024, 1, 15),
                    'actual_end_date': make_dt(2024, 1, 18),
                    'completion_percentage': 100.0,
                    'weight': 1.0,
                    'responsible_user_id': users[1].id
                },
                {
                    'stage_type': LocationStageType.AVALIACAO_TECNICA,
                    'status': StageStatus.COMPLETED,
                    'title': 'Visita Técnica',
                    'description': 'Avaliação técnica dos equipamentos e infraestrutura',
                    'planned_start_date': make_dt(2024, 1, 22),
                    'planned_end_date': make_dt(2024, 1, 25),
                    'actual_start_date': make_dt(2024, 1, 22),
                    'actual_end_date': make_dt(2024, 1, 24),
                    'completion_percentage': 100.0,
                    'weight': 1.0,
                    'responsible_user_id': users[2].id
                },
                {
                    'stage_type': LocationStageType.NEGOCIACAO,
                    'status': StageStatus.IN_PROGRESS,
                    'title': 'Negociação de Contrato',
                    'description': 'Finalização dos termos do contrato de locação',
                    'planned_start_date': make_dt(2024, 1, 26),
                    'planned_end_date': make_dt(2024, 1, 30),
                    'actual_start_date': make_dt(2024, 1, 26),
                    'actual_end_date': None,
                    'completion_percentage': 60.0,
                    'weight': 1.0,
                    'responsible_user_id': users[1].id
                },
                {
                    'stage_type': LocationStageType.GRAVACAO,
                    'status': StageStatus.PENDING,
                    'title': 'Produção',
                    'description': 'Período de gravação na locação',
                    'planned_start_date': make_dt(2024, 2, 1),
                    'planned_end_date': make_dt(2024, 2, 15),
                    'actual_start_date': None,
                    'actual_end_date': None,
                    'completion_percentage': 0.0,
                    'weight': 1.0,
                    'responsible_user_id': users[1].id
                }
            ],
            project_locations[1]: [
                {
                    'stage_type': LocationStageType.VISITACAO,
                    'status': StageStatus.COMPLETED,
                    'title': 'Prospecção Casa Histórica',
                    'description': 'Avaliação da casa histórica para cenas de época',
                    'planned_start_date': make_dt(2024, 1, 20),
                    'planned_end_date': make_dt(2024, 1, 25),
                    'actual_start_date': make_dt(2024, 1, 20),
                    'actual_end_date': make_dt(2024, 1, 23),
                    'completion_percentage': 100.0,
                    'weight': 1.0,
                    'responsible_user_id': users[2].id
                },
                {
                    'stage_type': LocationStageType.AVALIACAO_TECNICA,
                    'status': StageStatus.PENDING,
                    'title': 'Visita Técnica Casa Histórica',
                    'description': 'Avaliação técnica da infraestrutura da casa',
                    'planned_start_date': make_dt(2024, 2, 1),
                    'planned_end_date': make_dt(2024, 2, 5),
                    'actual_start_date': None,
                    'actual_end_date': None,
                    'completion_percentage': 0.0,
                    'weight': 1.0,
                    'responsible_user_id': users[2].id
                }
            ]
        }

        stages = []
        for project_location, stage_items in stages_payload.items():
            for stage_data in stage_items:
                stage = ProjectLocationStage(
                    project_location_id=project_location.id,
                    stage_type=stage_data['stage_type'],
                    status=stage_data['status'],
                    title=stage_data['title'],
                    description=stage_data['description'],
                    planned_start_date=stage_data['planned_start_date'],
                    planned_end_date=stage_data['planned_end_date'],
                    actual_start_date=stage_data['actual_start_date'],
                    actual_end_date=stage_data['actual_end_date'],
                    completion_percentage=stage_data['completion_percentage'],
                    weight=stage_data['weight'],
                    responsible_user_id=stage_data['responsible_user_id']
                )
                db.add(stage)
                stages.append(stage)

        db.commit()
        print(f"✅ Criadas {len(stages)} etapas de locações")

        # Atualizar orçamentos dos projetos
        for project in projects:
            confirmed_locations = db.query(ProjectLocation).filter(
                ProjectLocation.project_id == project.id,
                ProjectLocation.status == RentalStatus.CONFIRMED
            ).all()

            total_cost = sum(pl.total_cost or 0 for pl in confirmed_locations)
            project.budget_spent = total_cost

        db.commit()
        print("✅ Orçamentos dos projetos atualizados")

        # Mostrar resumo
        print("\n📊 Resumo dos Dados Criados:")
        print(f"👥 Usuários: {len(users)}")
        print(f"🏢 Fornecedores: {len(suppliers)}")
        print(f"📍 Locações: {len(locations)}")
        print(f"🎬 Projetos: {len(projects)}")
        print(f"🔗 Locações de Projetos: {len(project_locations)}")
        print(f"📋 Etapas: {len(stages)}")

        print("\n🎬 Projetos com Locações:")
        for project in projects:
            project_locations_for_project = db.query(ProjectLocation).filter(
                ProjectLocation.project_id == project.id
            ).all()

            if project_locations_for_project:
                print(f"\n📽️ {project.name}")
                for pl in project_locations_for_project:
                    location = db.query(Location).filter(Location.id == pl.location_id).first()
                    print(f"  📍 {location.title if location else 'Locação não encontrada'}")
                    print(f"     Status: {pl.status.value}")
                    print(f"     Período: {pl.rental_start} a {pl.rental_end}")
                    print(f"     Custo: R$ {pl.total_cost:,.2f}")

    except Exception as e:
        print(f"❌ Erro ao criar dados: {e}")
        db.rollback()
        raise

if __name__ == "__main__":
    setup_database()
