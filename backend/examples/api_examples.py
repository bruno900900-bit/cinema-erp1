#!/usr/bin/env python3
"""
Exemplos práticos de uso da API de Agenda de Visitas
"""

import requests
import json
from datetime import datetime, timedelta

# Configuração da API
BASE_URL = "http://localhost:8000/api/v1"

def print_response(response, title):
    """Imprime resposta da API de forma organizada"""
    print(f"\n{'='*60}")
    print(f"📋 {title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    if response.status_code < 400:
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        except:
            print(f"Response: {response.text}")
    else:
        print(f"Error: {response.text}")

def test_create_visit():
    """Exemplo: Criar uma nova visita"""
    
    # Dados da visita
    visit_data = {
        "title": "Visita técnica - Estúdio São Paulo",
        "description": "Avaliar equipamentos de iluminação e cenários disponíveis para o comercial da Nike",
        "etapa": "visita_tecnica",
        "start_datetime": (datetime.now() + timedelta(days=3, hours=10)).isoformat(),
        "end_datetime": (datetime.now() + timedelta(days=3, hours=12)).isoformat(),
        "project_id": 1,
        "location_id": 1,
        "participants": [
            {
                "user_id": 1,
                "role": "Responsável"
            },
            {
                "user_id": 4,
                "role": "Técnico de Iluminação"
            }
        ]
    }
    
    print("🚀 Criando nova visita...")
    response = requests.post(f"{BASE_URL}/visits", json=visit_data)
    print_response(response, "Criar Visita")
    
    return response.json() if response.status_code == 200 else None

def test_get_visits():
    """Exemplo: Listar visitas com filtros"""
    
    # Filtro por data
    params = {
        "date_from": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
        "date_to": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "etapas": "visita_tecnica,aprovacao",
        "status": "scheduled"
    }
    
    print("🔍 Buscando visitas com filtros...")
    response = requests.get(f"{BASE_URL}/visits", params=params)
    print_response(response, "Listar Visitas com Filtros")

def test_get_visit_by_id(visit_id):
    """Exemplo: Obter visita específica por ID"""
    
    print(f"📖 Obtendo detalhes da visita {visit_id}...")
    response = requests.get(f"{BASE_URL}/visits/{visit_id}")
    print_response(response, f"Obter Visita {visit_id}")

def test_update_visit(visit_id):
    """Exemplo: Atualizar uma visita"""
    
    update_data = {
        "description": "Visita técnica atualizada - Avaliar equipamentos e cenários disponíveis",
        "end_datetime": (datetime.now() + timedelta(days=3, hours=13)).isoformat()
    }
    
    print(f"✏️ Atualizando visita {visit_id}...")
    response = requests.patch(f"{BASE_URL}/visits/{visit_id}", json=update_data)
    print_response(response, f"Atualizar Visita {visit_id}")

def test_add_participant(visit_id):
    """Exemplo: Adicionar participante a uma visita"""
    
    participant_data = {
        "user_id": 3,
        "role": "Assistente de Produção"
    }
    
    print(f"👥 Adicionando participante à visita {visit_id}...")
    response = requests.post(f"{BASE_URL}/visits/{visit_id}/participants", json=participant_data)
    print_response(response, f"Adicionar Participante à Visita {visit_id}")

def test_check_in_participant(visit_id, user_id):
    """Exemplo: Registrar check-in de participante"""
    
    print(f"✅ Registrando check-in do usuário {user_id} na visita {visit_id}...")
    response = requests.post(f"{BASE_URL}/visits/{visit_id}/participants/{user_id}/check-in")
    print_response(response, f"Check-in Usuário {user_id} na Visita {visit_id}")

def test_complete_visit(visit_id):
    """Exemplo: Marcar visita como concluída"""
    
    print(f"🎯 Marcando visita {visit_id} como concluída...")
    response = requests.patch(f"{BASE_URL}/visits/{visit_id}/complete")
    print_response(response, f"Concluir Visita {visit_id}")

def test_get_visits_by_project(project_id):
    """Exemplo: Buscar visitas por projeto"""
    
    params = {
        "project_ids": str(project_id),
        "limit": 10
    }
    
    print(f"📊 Buscando visitas do projeto {project_id}...")
    response = requests.get(f"{BASE_URL}/visits", params=params)
    print_response(response, f"Visitas do Projeto {project_id}")

def test_get_visits_by_location(location_id):
    """Exemplo: Buscar visitas por locação"""
    
    params = {
        "location_ids": str(location_id),
        "limit": 10
    }
    
    print(f"🏢 Buscando visitas da locação {location_id}...")
    response = requests.get(f"{BASE_URL}/visits", params=params)
    print_response(response, f"Visitas da Locação {location_id}")

def test_get_visits_by_user(user_id):
    """Exemplo: Buscar visitas por usuário (participante)"""
    
    params = {
        "user_ids": str(user_id),
        "limit": 10
    }
    
    print(f"👤 Buscando visitas do usuário {user_id}...")
    response = requests.get(f"{BASE_URL}/visits", params=params)
    print_response(response, f"Visitas do Usuário {user_id}")

def test_cancel_visit(visit_id):
    """Exemplo: Cancelar uma visita"""
    
    print(f"❌ Cancelando visita {visit_id}...")
    response = requests.delete(f"{BASE_URL}/visits/{visit_id}")
    print_response(response, f"Cancelar Visita {visit_id}")

def run_all_examples():
    """Executa todos os exemplos em sequência"""
    
    print("🎬 Cinema ERP - Exemplos da API de Agenda de Visitas")
    print("="*60)
    
    try:
        # 1. Criar visita
        visit = test_create_visit()
        if not visit:
            print("❌ Falha ao criar visita. Parando execução.")
            return
        
        visit_id = visit['id']
        
        # 2. Listar visitas com filtros
        test_get_visits()
        
        # 3. Obter visita específica
        test_get_visit_by_id(visit_id)
        
        # 4. Atualizar visita
        test_update_visit(visit_id)
        
        # 5. Adicionar participante
        test_add_participant(visit_id)
        
        # 6. Check-in de participante
        test_check_in_participant(visit_id, 1)
        
        # 7. Buscar visitas por projeto
        test_get_visits_by_project(1)
        
        # 8. Buscar visitas por locação
        test_get_visits_by_location(1)
        
        # 9. Buscar visitas por usuário
        test_get_visits_by_user(1)
        
        # 10. Concluir visita
        test_complete_visit(visit_id)
        
        print("\n🎉 Todos os exemplos foram executados com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro durante execução: {e}")
        import traceback
        traceback.print_exc()

def run_specific_example():
    """Executa um exemplo específico baseado na escolha do usuário"""
    
    examples = {
        "1": ("Criar Visita", test_create_visit),
        "2": ("Listar Visitas", test_get_visits),
        "3": ("Buscar por Projeto", lambda: test_get_visits_by_project(1)),
        "4": ("Buscar por Locação", lambda: test_get_visits_by_location(1)),
        "5": ("Buscar por Usuário", lambda: test_get_visits_by_user(1)),
        "6": ("Adicionar Participante", lambda: test_add_participant(1)),
        "7": ("Check-in Participante", lambda: test_check_in_participant(1, 1)),
        "8": ("Concluir Visita", lambda: test_complete_visit(1)),
        "9": ("Cancelar Visita", lambda: test_cancel_visit(1))
    }
    
    print("\n🎯 Escolha um exemplo para executar:")
    for key, (name, _) in examples.items():
        print(f"  {key}. {name}")
    print("  0. Executar todos")
    
    choice = input("\nEscolha (0-9): ").strip()
    
    if choice == "0":
        run_all_examples()
    elif choice in examples:
        name, func = examples[choice]
        print(f"\n🚀 Executando: {name}")
        try:
            result = func()
            if result:
                print(f"✅ Resultado: {result}")
        except Exception as e:
            print(f"❌ Erro: {e}")
    else:
        print("❌ Opção inválida!")

if __name__ == "__main__":
    print("🎬 Cinema ERP - Exemplos da API")
    print("="*40)
    
    # Verificar se a API está rodando
    try:
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health")
        if response.status_code == 200:
            print("✅ API está rodando!")
        else:
            print("❌ API não está respondendo corretamente")
            exit(1)
    except:
        print("❌ Não foi possível conectar à API. Certifique-se de que está rodando em http://localhost:8000")
        exit(1)
    
    # Menu de opções
    while True:
        print("\n" + "="*40)
        print("1. Executar todos os exemplos")
        print("2. Executar exemplo específico")
        print("3. Sair")
        
        choice = input("\nEscolha uma opção (1-3): ").strip()
        
        if choice == "1":
            run_all_examples()
        elif choice == "2":
            run_specific_example()
        elif choice == "3":
            print("👋 Até logo!")
            break
        else:
            print("❌ Opção inválida!")
