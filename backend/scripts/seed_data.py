#!/usr/bin/env python3
"""
Script para popular o banco de dados com dados de exemplo
"""

import sys
import os
from datetime import datetime, timedelta

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, create_tables
from app.models.user import User
from app.models.project import Project, ProjectStatus
from app.models.location import Location
from app.models.visit import Visit, VisitParticipant, VisitEtapa, VisitStatus

def seed_database():
    """Popula o banco de dados com dados de exemplo"""
    db = SessionLocal()
    
    try:
        # Criar usuários
        print("Criando usuários...")
        users = [
            User(
                email="joao.silva@cinema.com",
                full_name="João Silva",
                bio="Diretor de Produção"
            ),
            User(
                email="maria.santos@cinema.com",
                full_name="Maria Santos",
                bio="Produtora Executiva"
            ),
            User(
                email="pedro.oliveira@cinema.com",
                full_name="Pedro Oliveira",
                bio="Assistente de Produção"
            ),
            User(
                email="ana.costa@cinema.com",
                full_name="Ana Costa",
                bio="Coordenadora de Locação"
            )
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        
        # Criar projetos
        print("Criando projetos...")
        projects = [
            Project(
                name="Comercial Nike - Copa 2026",
                description="Comercial para a Nike durante a Copa do Mundo 2026",
                client_name="Nike Brasil",
                budget="R$ 2.500.000,00",
                status=ProjectStatus.ACTIVE
            ),
            Project(
                name="Filme Independente - 'A Última Chance'",
                description="Longa-metragem independente sobre segunda chance na vida",
                client_name="Produtora Independente Ltda",
                budget="R$ 800.000,00",
                status=ProjectStatus.ACTIVE
            ),
            Project(
                name="Série Netflix - 'Cidade dos Sonhos'",
                description="Série de drama urbano para Netflix",
                client_name="Netflix",
                budget="R$ 15.000.000,00",
                status=ProjectStatus.ACTIVE
            )
        ]
        
        for project in projects:
            db.add(project)
        db.commit()
        
        # Criar locações
        print("Criando locações...")
        locations = [
            Location(
                name="Estúdio São Paulo",
                address="Rua das Artes, 123 - Vila Madalena",
                city="São Paulo",
                state="SP",
                description="Estúdio profissional com 500m², equipado com iluminação e cenários",
                contact_name="Carlos Mendes",
                contact_phone="(11) 99999-8888",
                contact_email="carlos@estudiosp.com.br",
                area_size=500.0,
                max_capacity=50,
                daily_rate="R$ 8.000,00"
            ),
            Location(
                name="Fazenda Boa Vista",
                address="Estrada do Sertão, km 45",
                city="Campinas",
                state="SP",
                description="Fazenda histórica com 200 hectares, ideal para filmagens externas",
                contact_name="Roberto Almeida",
                contact_phone="(19) 88888-7777",
                contact_email="roberto@fazendaboavista.com.br",
                area_size=2000000.0,
                max_capacity=200,
                daily_rate="R$ 15.000,00"
            ),
            Location(
                name="Centro Histórico de Paraty",
                address="Centro Histórico",
                city="Paraty",
                state="RJ",
                description="Centro histórico colonial preservado, perfeito para filmagens de época",
                contact_name="Secretaria de Turismo",
                contact_phone="(24) 3371-1895",
                contact_email="turismo@paraty.rj.gov.br",
                area_size=1000.0,
                max_capacity=100,
                daily_rate="R$ 12.000,00"
            ),
            Location(
                name="Complexo Industrial ABC",
                address="Av. Industrial, 1500 - Santo André",
                city="Santo André",
                state="SP",
                description="Complexo industrial abandonado, ideal para filmagens de ação e suspense",
                contact_name="Empresa ABC",
                contact_phone="(11) 77777-6666",
                contact_email="locacao@abcindustrial.com.br",
                area_size=3000.0,
                max_capacity=150,
                daily_rate="R$ 6.000,00"
            )
        ]
        
        for location in locations:
            db.add(location)
        db.commit()
        
        # Criar visitas
        print("Criando visitas...")
        now = datetime.now()
        
        visits = [
            Visit(
                title="Visita técnica - Estúdio São Paulo",
                description="Visita para avaliar equipamentos e cenários disponíveis",
                etapa=VisitEtapa.VISITA_TECNICA,
                start_datetime=now + timedelta(days=2, hours=10),
                end_datetime=now + timedelta(days=2, hours=12),
                project_id=1,
                location_id=1,
                created_by=1,
                status=VisitStatus.SCHEDULED
            ),
            Visit(
                title="Prospecção - Fazenda Boa Vista",
                description="Primeira visita para conhecer o local e avaliar possibilidades",
                etapa=VisitEtapa.PROSPECCAO,
                start_datetime=now + timedelta(days=5, hours=14),
                end_datetime=now + timedelta(days=5, hours=16),
                project_id=2,
                location_id=2,
                created_by=2,
                status=VisitStatus.SCHEDULED
            ),
            Visit(
                title="Aprovação - Centro Histórico Paraty",
                description="Visita com cliente para aprovação final do local",
                etapa=VisitEtapa.APROVACAO,
                start_datetime=now + timedelta(days=1, hours=9),
                end_datetime=now + timedelta(days=1, hours=11),
                project_id=3,
                location_id=3,
                created_by=3,
                status=VisitStatus.SCHEDULED
            ),
            Visit(
                title="Negociação - Complexo Industrial",
                description="Reunião para discutir preços e condições de locação",
                etapa=VisitEtapa.NEGOCIACAO,
                start_datetime=now + timedelta(days=3, hours=15),
                end_datetime=now + timedelta(days=3, hours=17),
                project_id=1,
                location_id=4,
                created_by=1,
                status=VisitStatus.SCHEDULED
            )
        ]
        
        for visit in visits:
            db.add(visit)
        db.commit()
        
        # Criar participantes das visitas
        print("Criando participantes...")
        participants = [
            # Visita 1 - Estúdio São Paulo
            VisitParticipant(visit_id=1, user_id=1, role="Responsável"),
            VisitParticipant(visit_id=1, user_id=4, role="Apoio"),
            
            # Visita 2 - Fazenda Boa Vista
            VisitParticipant(visit_id=2, user_id=2, role="Responsável"),
            VisitParticipant(visit_id=2, user_id=3, role="Apoio"),
            
            # Visita 3 - Centro Histórico Paraty
            VisitParticipant(visit_id=3, user_id=3, role="Responsável"),
            VisitParticipant(visit_id=3, user_id=1, role="Apoio"),
            
            # Visita 4 - Complexo Industrial
            VisitParticipant(visit_id=4, user_id=1, role="Responsável"),
            VisitParticipant(visit_id=4, user_id=2, role="Apoio"),
            VisitParticipant(visit_id=4, user_id=4, role="Apoio")
        ]
        
        for participant in participants:
            db.add(participant)
        db.commit()
        
        print("✅ Banco de dados populado com sucesso!")
        print(f"📊 Criados: {len(users)} usuários, {len(projects)} projetos, {len(locations)} locações, {len(visits)} visitas")
        
    except Exception as e:
        print(f"❌ Erro ao popular banco: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Iniciando população do banco de dados...")
    seed_database()
    print("🎉 Concluído!")
