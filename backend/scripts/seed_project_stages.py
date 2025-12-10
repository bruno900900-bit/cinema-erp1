#!/usr/bin/env python3
"""
Script para popular o banco de dados com etapas de locações para projetos
"""

import sys
import os
from datetime import datetime, timedelta, date

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.project import Project
from app.models.location import Location
from app.models.user import User
from app.models.project_location_stage import (
    ProjectLocationStage,
    ProjectLocationStageStatus,
    ProjectLocationStageType
)

def seed_project_stages():
    """Popula o banco de dados com etapas de locações para projetos"""
    db = SessionLocal()

    try:
        print("🌱 Iniciando população de etapas de locações...")

        # Buscar projetos existentes
        projects = db.query(Project).all()
        if not projects:
            print("❌ Nenhum projeto encontrado. Execute primeiro o seed_data.py")
            return

        # Buscar locações existentes
        locations = db.query(Location).all()
        if not locations:
            print("❌ Nenhuma locação encontrada. Execute primeiro o seed_data.py")
            return

        # Buscar usuários existentes
        users = db.query(User).all()
        if not users:
            print("❌ Nenhum usuário encontrado. Execute primeiro o seed_data.py")
            return

        print(f"📋 Encontrados {len(projects)} projetos, {len(locations)} locações, {len(users)} usuários")

        # Criar etapas para cada projeto
        stages_created = 0

        for project in projects:
            print(f"📝 Criando etapas para o projeto: {project.name}")

            # Para cada projeto, criar etapas para algumas locações
            project_locations = locations[:3]  # Usar as primeiras 3 locações

            for i, location in enumerate(project_locations):
                print(f"  🏢 Criando etapas para locação: {location.title}")

                # Definir datas baseadas no projeto
                start_date = project.start_date or date.today()
                end_date = project.end_date or (date.today() + timedelta(days=90))

                # Criar etapas padrão para esta locação
                stages_data = [
                    {
                        "name": "Prospecção",
                        "description": f"Primeira avaliação da locação {location.title}",
                        "stage_type": ProjectLocationStageType.PROSPECTION,
                        "status": ProjectLocationStageStatus.COMPLETED if i == 0 else ProjectLocationStageStatus.IN_PROGRESS if i == 1 else ProjectLocationStageStatus.PENDING,
                        "order_index": 1,
                        "planned_start_date": start_date,
                        "planned_end_date": start_date + timedelta(days=7),
                        "actual_start_date": start_date if i <= 1 else None,
                        "actual_end_date": start_date + timedelta(days=5) if i == 0 else None,
                        "completed_at": datetime.now() - timedelta(days=2) if i == 0 else None,
                        "budget_allocated": 5000.0,
                        "budget_spent": 4500.0 if i == 0 else 0.0,
                        "responsible_user_id": users[0].id,
                        "notes": "Prospecção inicial concluída com sucesso" if i == 0 else None
                    },
                    {
                        "name": "Visita Técnica",
                        "description": f"Visita técnica para avaliação detalhada de {location.title}",
                        "stage_type": ProjectLocationStageType.TECHNICAL_VISIT,
                        "status": ProjectLocationStageStatus.COMPLETED if i == 0 else ProjectLocationStageStatus.IN_PROGRESS if i == 1 else ProjectLocationStageStatus.PENDING,
                        "order_index": 2,
                        "planned_start_date": start_date + timedelta(days=8),
                        "planned_end_date": start_date + timedelta(days=15),
                        "actual_start_date": start_date + timedelta(days=8) if i <= 1 else None,
                        "actual_end_date": start_date + timedelta(days=12) if i == 0 else None,
                        "completed_at": datetime.now() - timedelta(days=1) if i == 0 else None,
                        "budget_allocated": 8000.0,
                        "budget_spent": 7500.0 if i == 0 else 2000.0 if i == 1 else 0.0,
                        "responsible_user_id": users[1].id if len(users) > 1 else users[0].id,
                        "notes": "Visita técnica realizada, local aprovado" if i == 0 else "Visita em andamento" if i == 1 else None
                    },
                    {
                        "name": "Aprovação do Cliente",
                        "description": f"Aprovação da locação {location.title} pelo cliente",
                        "stage_type": ProjectLocationStageType.CLIENT_APPROVAL,
                        "status": ProjectLocationStageStatus.APPROVED if i == 0 else ProjectLocationStageStatus.PENDING,
                        "order_index": 3,
                        "planned_start_date": start_date + timedelta(days=16),
                        "planned_end_date": start_date + timedelta(days=20),
                        "actual_start_date": start_date + timedelta(days=16) if i == 0 else None,
                        "actual_end_date": start_date + timedelta(days=18) if i == 0 else None,
                        "completed_at": datetime.now() if i == 0 else None,
                        "budget_allocated": 0.0,
                        "budget_spent": 0.0,
                        "responsible_user_id": users[2].id if len(users) > 2 else users[0].id,
                        "notes": "Cliente aprovou a locação" if i == 0 else None
                    },
                    {
                        "name": "Negociação",
                        "description": f"Negociação de preços e condições para {location.title}",
                        "stage_type": ProjectLocationStageType.NEGOTIATION,
                        "status": ProjectLocationStageStatus.IN_PROGRESS if i == 0 else ProjectLocationStageStatus.PENDING,
                        "order_index": 4,
                        "planned_start_date": start_date + timedelta(days=21),
                        "planned_end_date": start_date + timedelta(days=28),
                        "actual_start_date": start_date + timedelta(days=21) if i == 0 else None,
                        "budget_allocated": 0.0,
                        "budget_spent": 0.0,
                        "responsible_user_id": users[0].id,
                        "notes": "Negociação em andamento" if i == 0 else None
                    },
                    {
                        "name": "Assinatura de Contrato",
                        "description": f"Assinatura do contrato de locação para {location.title}",
                        "stage_type": ProjectLocationStageType.CONTRACT_SIGNING,
                        "status": ProjectLocationStageStatus.PENDING,
                        "order_index": 5,
                        "planned_start_date": start_date + timedelta(days=29),
                        "planned_end_date": start_date + timedelta(days=35),
                        "budget_allocated": 0.0,
                        "budget_spent": 0.0,
                        "responsible_user_id": users[1].id if len(users) > 1 else users[0].id,
                        "notes": None
                    },
                    {
                        "name": "Pré-produção",
                        "description": f"Preparação para a produção em {location.title}",
                        "stage_type": ProjectLocationStageType.PRE_PRODUCTION,
                        "status": ProjectLocationStageStatus.PENDING,
                        "order_index": 6,
                        "planned_start_date": start_date + timedelta(days=36),
                        "planned_end_date": start_date + timedelta(days=45),
                        "budget_allocated": 15000.0,
                        "budget_spent": 0.0,
                        "responsible_user_id": users[2].id if len(users) > 2 else users[0].id,
                        "notes": None
                    },
                    {
                        "name": "Produção",
                        "description": f"Período de produção em {location.title}",
                        "stage_type": ProjectLocationStageType.PRODUCTION,
                        "status": ProjectLocationStageStatus.PENDING,
                        "order_index": 7,
                        "planned_start_date": start_date + timedelta(days=46),
                        "planned_end_date": start_date + timedelta(days=60),
                        "budget_allocated": 50000.0,
                        "budget_spent": 0.0,
                        "responsible_user_id": users[0].id,
                        "notes": None
                    },
                    {
                        "name": "Pós-produção",
                        "description": f"Finalização e limpeza de {location.title}",
                        "stage_type": ProjectLocationStageType.POST_PRODUCTION,
                        "status": ProjectLocationStageStatus.PENDING,
                        "order_index": 8,
                        "planned_start_date": start_date + timedelta(days=61),
                        "planned_end_date": start_date + timedelta(days=65),
                        "budget_allocated": 5000.0,
                        "budget_spent": 0.0,
                        "responsible_user_id": users[1].id if len(users) > 1 else users[0].id,
                        "notes": None
                    },
                    {
                        "name": "Pagamento",
                        "description": f"Processamento do pagamento para {location.title}",
                        "stage_type": ProjectLocationStageType.PAYMENT,
                        "status": ProjectLocationStageStatus.PENDING,
                        "order_index": 9,
                        "planned_start_date": start_date + timedelta(days=66),
                        "planned_end_date": start_date + timedelta(days=70),
                        "budget_allocated": 0.0,
                        "budget_spent": 0.0,
                        "responsible_user_id": users[2].id if len(users) > 2 else users[0].id,
                        "notes": None
                    }
                ]

                # Criar as etapas
                for stage_data in stages_data:
                    stage = ProjectLocationStage(
                        project_id=project.id,
                        location_id=location.id,
                        **stage_data
                    )
                    db.add(stage)
                    stages_created += 1

        db.commit()
        print(f"✅ {stages_created} etapas criadas com sucesso!")

        # Criar algumas etapas atrasadas para demonstração
        print("⚠️  Criando algumas etapas atrasadas para demonstração...")

        # Buscar uma etapa pendente e torná-la atrasada
        overdue_stage = db.query(ProjectLocationStage).filter(
            ProjectLocationStage.status == ProjectLocationStageStatus.PENDING
        ).first()

        if overdue_stage:
            overdue_stage.planned_end_date = date.today() - timedelta(days=5)  # 5 dias atrasada
            db.commit()
            print(f"✅ Etapa '{overdue_stage.name}' marcada como atrasada")

        print("🎉 População de etapas de locações concluída!")
        print(f"📊 Total de etapas criadas: {stages_created}")

    except Exception as e:
        print(f"❌ Erro ao popular etapas de locações: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_project_stages()
