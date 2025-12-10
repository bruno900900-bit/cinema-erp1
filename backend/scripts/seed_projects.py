#!/usr/bin/env python3
"""
Script para popular o banco de dados com dados de exemplo de projetos
"""

import sys
import os
from datetime import datetime, timedelta, date

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.project import Project, ProjectStatus
from app.models.location import Location, LocationStatus, SectorType, SpaceType
from app.models.visit import Visit, VisitParticipant, VisitEtapa, VisitStatus

def seed_projects():
    """Popula o banco de dados com dados de exemplo de projetos"""
    db = SessionLocal()
    
    try:
        print("🌱 Iniciando população de dados de projetos...")
        
        # Verificar se já existem usuários
        existing_users = db.query(User).all()
        if not existing_users:
            print("❌ Nenhum usuário encontrado. Execute primeiro o seed_data.py")
            return
        
        # Verificar se já existem locações
        existing_locations = db.query(Location).all()
        if not existing_locations:
            print("❌ Nenhuma locação encontrada. Execute primeiro o seed_data.py")
            return
        
        # Criar projetos mais detalhados
        print("📋 Criando projetos detalhados...")
        
        # Projeto 1: Comercial Nike
        project_nike = Project(
            name="Comercial Nike - Copa 2026",
            description="Comercial para a Nike durante a Copa do Mundo 2026, focado em atletas brasileiros e a paixão pelo futebol",
            client_name="Nike Brasil",
            budget_total=2500000.0,
            budget_spent=450000.0,
            budget_currency="BRL",
            start_date=date(2024, 3, 1),
            end_date=date(2024, 6, 30),
            created_by=existing_users[0].id,
            manager_id=existing_users[1].id,
            coordinator_id=existing_users[2].id,
            status=ProjectStatus.ACTIVE,
            is_public=True,
            settings_json={
                "priority": "high",
                "client_requirements": ["estádio", "gramado", "iluminação profissional"],
                "special_notes": "Projeto de alta visibilidade, requer aprovação da Nike"
            }
        )
        db.add(project_nike)
        db.flush()  # Para obter o ID
        
        # Projeto 2: Filme Independente
        project_filme = Project(
            name="Filme Independente - 'A Última Chance'",
            description="Longa-metragem independente sobre segunda chance na vida, drama urbano com foco em personagens reais",
            client_name="Produtora Independente Ltda",
            budget_total=800000.0,
            budget_spent=120000.0,
            budget_currency="BRL",
            start_date=date(2024, 2, 15),
            end_date=date(2024, 8, 15),
            created_by=existing_users[1].id,
            manager_id=existing_users[0].id,
            coordinator_id=existing_users[3].id,
            status=ProjectStatus.ACTIVE,
            is_public=False,
            settings_json={
                "priority": "medium",
                "client_requirements": ["locais urbanos", "interior residencial", "ruas movimentadas"],
                "special_notes": "Orçamento limitado, negociar preços"
            }
        )
        db.add(project_filme)
        db.flush()
        
        # Projeto 3: Série Netflix
        project_netflix = Project(
            name="Série Netflix - 'Cidade dos Sonhos'",
            description="Série de drama urbano para Netflix, 8 episódios sobre jovens em busca de seus sonhos na cidade grande",
            client_name="Netflix",
            budget_total=15000000.0,
            budget_spent=2800000.0,
            budget_currency="BRL",
            start_date=date(2024, 1, 10),
            end_date=date(2024, 12, 20),
            created_by=existing_users[2].id,
            manager_id=existing_users[1].id,
            coordinator_id=existing_users[0].id,
            status=ProjectStatus.ACTIVE,
            is_public=True,
            settings_json={
                "priority": "high",
                "client_requirements": ["diversidade de locais", "acesso 24h", "estacionamento amplo"],
                "special_notes": "Projeto Netflix, orçamento flexível, qualidade premium"
            }
        )
        db.add(project_netflix)
        db.flush()
        
        # Projeto 4: Documentário
        project_doc = Project(
            name="Documentário - 'Brasil Selvagem'",
            description="Documentário sobre a fauna brasileira para canal internacional, foco em preservação ambiental",
            client_name="Discovery Channel",
            budget_total=1200000.0,
            budget_spent=0.0,
            budget_currency="BRL",
            start_date=date(2024, 4, 1),
            end_date=date(2024, 10, 31),
            created_by=existing_users[3].id,
            manager_id=existing_users[2].id,
            coordinator_id=existing_users[1].id,
            status=ProjectStatus.PLANNING,
            is_public=False,
            settings_json={
                "priority": "medium",
                "client_requirements": ["locais naturais", "acesso remoto", "permissões ambientais"],
                "special_notes": "Aguardando aprovação de orçamento"
            }
        )
        db.add(project_doc)
        db.flush()
        
        # Projeto 5: Comercial Pequeno
        project_comercial = Project(
            name="Comercial - 'Café do Sertão'",
            description="Comercial de 30 segundos para marca de café regional, foco em tradição e qualidade",
            client_name="Café do Sertão Ltda",
            budget_total=150000.0,
            budget_spent=75000.0,
            budget_currency="BRL",
            start_date=date(2024, 1, 20),
            end_date=date(2024, 3, 15),
            created_by=existing_users[0].id,
            manager_id=existing_users[3].id,
            coordinator_id=existing_users[2].id,
            status=ProjectStatus.IN_PROGRESS,
            is_public=False,
            settings_json={
                "priority": "low",
                "client_requirements": ["ambiente rural", "plantação de café", "interior simples"],
                "special_notes": "Projeto pequeno, orçamento fixo"
            }
        )
        db.add(project_comercial)
        db.flush()
        
        db.commit()
        print("✅ Projetos criados com sucesso!")
        
        # Criar locações adicionais se necessário
        print("🏢 Verificando locações...")
        if len(existing_locations) < 8:
            print("📍 Criando locações adicionais...")
            
            # Locações adicionais
            additional_locations = [
                Location(
                    title="Estádio do Maracanã",
                    slug="estadio-maracana",
                    summary="Estádio histórico do Rio de Janeiro",
                    description="Estádio do Maracanã, palco de grandes eventos esportivos e culturais",
                    status=LocationStatus.APPROVED,
                    sector_type=SectorType.CINEMA,
                    space_type=SpaceType.OUTDOOR,
                    capacity=78000,
                    area_size=200000.0,
                    price_day_cinema=50000.0,
                    price_hour_cinema=8000.0,
                    currency="BRL",
                    city="Rio de Janeiro",
                    state="RJ",
                    country="Brasil",
                    street="Rua Professor Eurico Rabelo",
                    number="s/n",
                    neighborhood="Maracanã",
                    postal_code="20271-150",
                    supplier_name="Maracanã Administração",
                    supplier_phone="(21) 2334-1705",
                    supplier_email="locacao@maracana.com.br"
                ),
                Location(
                    title="Fazenda Colonial - Minas Gerais",
                    slug="fazenda-colonial-mg",
                    summary="Fazenda histórica do século XVIII",
                    description="Fazenda colonial preservada, ideal para filmagens de época e documentários históricos",
                    status=LocationStatus.APPROVED,
                    sector_type=SectorType.CINEMA,
                    space_type=SpaceType.OUTDOOR,
                    capacity=100,
                    area_size=500000.0,
                    price_day_cinema=12000.0,
                    price_hour_cinema=2000.0,
                    currency="BRL",
                    city="Ouro Preto",
                    state="MG",
                    country="Brasil",
                    street="Estrada da Fazenda",
                    number="km 15",
                    neighborhood="Zona Rural",
                    supplier_name="Fazenda Colonial Ltda",
                    supplier_phone="(31) 99999-1234",
                    supplier_email="contato@fazendacolonial.com.br"
                ),
                Location(
                    title="Centro Comercial Moderno",
                    slug="centro-comercial-moderno",
                    summary="Shopping center com arquitetura contemporânea",
                    description="Shopping center moderno com amplos corredores e praças de alimentação",
                    status=LocationStatus.APPROVED,
                    sector_type=SectorType.PUBLICIDADE,
                    space_type=SpaceType.INDOOR,
                    capacity=500,
                    area_size=10000.0,
                    price_day_publicidade=8000.0,
                    price_hour_publicidade=1500.0,
                    currency="BRL",
                    city="São Paulo",
                    state="SP",
                    country="Brasil",
                    street="Av. Paulista",
                    number="1000",
                    neighborhood="Bela Vista",
                    postal_code="01310-100",
                    supplier_name="Shopping Paulista",
                    supplier_phone="(11) 3333-4444",
                    supplier_email="locacao@shoppingpaulista.com.br"
                ),
                Location(
                    title="Praia de Copacabana",
                    slug="praia-copacabana",
                    summary="Famosa praia do Rio de Janeiro",
                    description="Praia de Copacabana, cenário icônico do Rio de Janeiro",
                    status=LocationStatus.APPROVED,
                    sector_type=SectorType.PUBLICIDADE,
                    space_type=SpaceType.OUTDOOR,
                    capacity=1000,
                    area_size=50000.0,
                    price_day_publicidade=15000.0,
                    price_hour_publicidade=3000.0,
                    currency="BRL",
                    city="Rio de Janeiro",
                    state="RJ",
                    country="Brasil",
                    street="Av. Atlântica",
                    number="s/n",
                    neighborhood="Copacabana",
                    postal_code="22070-011",
                    supplier_name="Prefeitura do Rio",
                    supplier_phone="(21) 2976-2000",
                    supplier_email="filmagem@rio.rj.gov.br"
                )
            ]
            
            for location in additional_locations:
                db.add(location)
            db.commit()
            print("✅ Locações adicionais criadas!")
        
        # Criar visitas relacionadas aos projetos
        print("📅 Criando visitas para os projetos...")
        now = datetime.now()
        
        # Visitas para Projeto Nike
        visit_nike1 = Visit(
            title="Reconhecimento - Estádio do Maracanã",
            description="Visita técnica para avaliar o estádio para filmagem do comercial Nike",
            etapa=VisitEtapa.VISITA_TECNICA,
            start_datetime=now + timedelta(days=3, hours=10),
            end_datetime=now + timedelta(days=3, hours=12),
            project_id=project_nike.id,
            location_id=existing_locations[0].id if existing_locations else 1,
            created_by=existing_users[0].id,
            status=VisitStatus.SCHEDULED
        )
        db.add(visit_nike1)
        
        # Visitas para Projeto Filme
        visit_filme1 = Visit(
            title="Prospecção - Centro Histórico",
            description="Primeira visita para conhecer locais urbanos para o filme independente",
            etapa=VisitEtapa.PROSPECCAO,
            start_datetime=now + timedelta(days=5, hours=14),
            end_datetime=now + timedelta(days=5, hours=16),
            project_id=project_filme.id,
            location_id=existing_locations[1].id if len(existing_locations) > 1 else 2,
            created_by=existing_users[1].id,
            status=VisitStatus.SCHEDULED
        )
        db.add(visit_filme1)
        
        # Visitas para Projeto Netflix
        visit_netflix1 = Visit(
            title="Aprovação - Múltiplas Locações",
            description="Visita com equipe Netflix para aprovação de locações da série",
            etapa=VisitEtapa.APROVACAO,
            start_datetime=now + timedelta(days=2, hours=9),
            end_datetime=now + timedelta(days=2, hours=17),
            project_id=project_netflix.id,
            location_id=existing_locations[2].id if len(existing_locations) > 2 else 3,
            created_by=existing_users[2].id,
            status=VisitStatus.SCHEDULED
        )
        db.add(visit_netflix1)
        
        db.commit()
        print("✅ Visitas criadas com sucesso!")
        
        # Criar participantes das visitas
        print("👥 Criando participantes das visitas...")
        participants = [
            # Visita Nike
            VisitParticipant(visit_id=visit_nike1.id, user_id=existing_users[0].id, role="Responsável"),
            VisitParticipant(visit_id=visit_nike1.id, user_id=existing_users[1].id, role="Apoio"),
            
            # Visita Filme
            VisitParticipant(visit_id=visit_filme1.id, user_id=existing_users[1].id, role="Responsável"),
            VisitParticipant(visit_id=visit_filme1.id, user_id=existing_users[2].id, role="Apoio"),
            
            # Visita Netflix
            VisitParticipant(visit_id=visit_netflix1.id, user_id=existing_users[2].id, role="Responsável"),
            VisitParticipant(visit_id=visit_netflix1.id, user_id=existing_users[0].id, role="Apoio"),
            VisitParticipant(visit_id=visit_netflix1.id, user_id=existing_users[3].id, role="Apoio")
        ]
        
        for participant in participants:
            db.add(participant)
        db.commit()
        print("✅ Participantes criados com sucesso!")
        
        print("🎉 População de dados de projetos concluída!")
        print(f"📊 Criados: 5 projetos, {len(additional_locations) if 'additional_locations' in locals() else 0} locações adicionais, 3 visitas, {len(participants)} participantes")
        
    except Exception as e:
        print(f"❌ Erro ao popular dados de projetos: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_projects()
