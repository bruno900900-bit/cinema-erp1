#!/usr/bin/env python3
"""
Script para popular dados de exemplo de locações
"""

import sys
import os
from datetime import datetime

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_db
from app.models.location import Location, LocationStatus, SpaceType, SectorType
from app.models.supplier import Supplier

def seed_locations():
    """Popular dados de exemplo de locações"""
    
    db = next(get_db())
    
    try:
        # Verificar se já existem locações
        existing_locations = db.query(Location).count()
        if existing_locations > 0:
            print(f"⚠️  Já existem {existing_locations} locações no banco. Pulando criação.")
            return
        
        # Criar fornecedores primeiro
        suppliers_data = [
            {
                'name': 'Estúdios SP Ltda',
                'email': 'contato@estudiosp.com',
                'phone': '(11) 99999-9999',
                'tax_id': '12.345.678/0001-90',
                'address': 'Rua das Artes, 123 - Centro, São Paulo - SP',
                'is_active': True
            },
            {
                'name': 'Patrimônio Cultural RJ',
                'email': 'locacao@patrimonio-rj.com',
                'phone': '(21) 88888-8888',
                'tax_id': '98.765.432/0001-10',
                'address': 'Av. Histórica, 456 - Centro, Rio de Janeiro - RJ',
                'is_active': True
            },
            {
                'name': 'Locações Premium BH',
                'email': 'premium@locacoesbh.com',
                'phone': '(31) 77777-7777',
                'tax_id': '11.222.333/0001-44',
                'address': 'Rua Premium, 789 - Savassi, Belo Horizonte - MG',
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
                'description': 'Estúdio de 200m² com equipamentos profissionais, ideal para gravações de cinema e publicidade. Possui iluminação profissional, isolamento acústico e estacionamento para 20 veículos.',
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
                'acoustic_treatment': 'Paredes com tratamento acústico profissional',
                'parking_spots': 20,
                'accessibility_features': {
                    'wheelchair_accessible': True,
                    'elevator': True,
                    'accessible_bathroom': True
                }
            },
            {
                'title': 'Casa Histórica - Rio de Janeiro',
                'slug': 'casa-historica-rj',
                'summary': 'Casa histórica do século XIX no Rio de Janeiro',
                'description': 'Casa colonial preservada, perfeita para produções de época e publicidade premium. Localizada no centro histórico do Rio de Janeiro.',
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
                'parking_spots': 8,
                'accessibility_features': {
                    'wheelchair_accessible': False,
                    'elevator': False,
                    'accessible_bathroom': False
                }
            },
            {
                'title': 'Galpão Industrial - Belo Horizonte',
                'slug': 'galpao-industrial-bh',
                'summary': 'Galpão industrial adaptado para produções',
                'description': 'Galpão de 500m² com pé-direito alto, ideal para produções que precisam de muito espaço. Localizado em área industrial com fácil acesso.',
                'status': LocationStatus.APPROVED,
                'supplier_id': suppliers[2].id,
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
                'parking_spots': 30,
                'accessibility_features': {
                    'wheelchair_accessible': True,
                    'elevator': False,
                    'accessible_bathroom': True
                }
            },
            {
                'title': 'Escritório Moderno - São Paulo',
                'slug': 'escritorio-moderno-sp',
                'summary': 'Escritório moderno para gravações corporativas',
                'description': 'Escritório de 120m² com design moderno, ideal para gravações corporativas, entrevistas e publicidade empresarial.',
                'status': LocationStatus.APPROVED,
                'supplier_id': suppliers[0].id,
                'sector_type': SectorType.PUBLICIDADE,
                'price_day_cinema': 1500.0,
                'price_hour_cinema': 200.0,
                'price_day_publicidade': 1200.0,
                'price_hour_publicidade': 150.0,
                'currency': 'BRL',
                'street': 'Av. Paulista',
                'number': '1000',
                'neighborhood': 'Bela Vista',
                'city': 'São Paulo',
                'state': 'SP',
                'country': 'Brasil',
                'postal_code': '01310-100',
                'space_type': SpaceType.OFFICE,
                'capacity': 25,
                'area_size': 120.0,
                'power_specs': '220V, 80A, 2 fases',
                'noise_level': 'Baixo',
                'parking_spots': 10,
                'accessibility_features': {
                    'wheelchair_accessible': True,
                    'elevator': True,
                    'accessible_bathroom': True
                }
            },
            {
                'title': 'Praia de Copacabana - Rio de Janeiro',
                'slug': 'praia-copacabana-rj',
                'summary': 'Localização na praia de Copacabana',
                'description': 'Localização privilegiada na praia de Copacabana, perfeita para gravações externas, publicidade e eventos ao ar livre.',
                'status': LocationStatus.APPROVED,
                'supplier_id': suppliers[1].id,
                'sector_type': SectorType.PUBLICIDADE,
                'price_day_cinema': 2000.0,
                'price_hour_cinema': 300.0,
                'price_day_publicidade': 1500.0,
                'price_hour_publicidade': 200.0,
                'currency': 'BRL',
                'street': 'Av. Atlântica',
                'number': 's/n',
                'neighborhood': 'Copacabana',
                'city': 'Rio de Janeiro',
                'state': 'RJ',
                'country': 'Brasil',
                'postal_code': '22070-011',
                'space_type': SpaceType.OUTDOOR,
                'capacity': 200,
                'area_size': 1000.0,
                'power_specs': 'Gerador portátil disponível',
                'noise_level': 'Alto (ambiente externo)',
                'parking_spots': 50,
                'accessibility_features': {
                    'wheelchair_accessible': True,
                    'elevator': False,
                    'accessible_bathroom': True
                }
            }
        ]
        
        created_count = 0
        for location_data in locations_data:
            location = Location(**location_data)
            db.add(location)
            created_count += 1
        
        db.commit()
        print(f"✅ Criadas {created_count} locações")
        
        # Mostrar resumo
        print("\n📊 Resumo das Locações Criadas:")
        for location in db.query(Location).all():
            print(f"\n📍 {location.title}")
            print(f"   Cidade: {location.city}, {location.state}")
            print(f"   Tipo: {location.space_type.value if location.space_type else 'N/A'}")
            print(f"   Capacidade: {location.capacity} pessoas")
            print(f"   Área: {location.area_size}m²")
            print(f"   Preço Cinema (dia): R$ {location.price_day_cinema:,.2f}")
            print(f"   Preço Publicidade (dia): R$ {location.price_day_publicidade:,.2f}")
            print(f"   Status: {location.status.value}")
        
    except Exception as e:
        print(f"❌ Erro ao popular dados: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Iniciando seed de locações...")
    seed_locations()
    print("✅ Seed de locações concluído!")
