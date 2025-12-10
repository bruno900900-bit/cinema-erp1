#!/usr/bin/env python3
"""
Script para encontrar e abrir o pgAdmin automaticamente
"""

import os
import sys
import subprocess
from pathlib import Path

def find_pgadmin():
    """Encontra o pgAdmin no sistema"""
    print("🔍 Procurando pgAdmin...")

    # Caminhos comuns do pgAdmin no Windows
    pgadmin_paths = [
        # Instalação padrão
        r"C:\Program Files\pgAdmin 4\runtime\pgAdmin4.exe",
        r"C:\Program Files (x86)\pgAdmin 4\runtime\pgAdmin4.exe",

        # Instalação por usuário
        rf"C:\Users\{os.getenv('USERNAME', '')}\AppData\Local\Programs\pgAdmin 4\pgAdmin4.exe",

        # Instalação via Chocolatey
        r"C:\ProgramData\chocolatey\lib\pgadmin4\tools\pgAdmin4.exe",

        # Instalação via Scoop
        rf"C:\Users\{os.getenv('USERNAME', '')}\scoop\apps\pgadmin4\current\pgAdmin4.exe",
    ]

    for path in pgadmin_paths:
        if Path(path).exists():
            print(f"✅ pgAdmin encontrado: {path}")
            return path

    # Tentar encontrar via PATH
    try:
        result = subprocess.run(['where', 'pgAdmin4.exe'],
                              capture_output=True, text=True, shell=True)
        if result.returncode == 0:
            path = result.stdout.strip().split('\n')[0]
            print(f"✅ pgAdmin encontrado via PATH: {path}")
            return path
    except:
        pass

    print("❌ pgAdmin não encontrado")
    return None

def open_pgadmin(pgadmin_path):
    """Abre o pgAdmin"""
    try:
        print("🚀 Abrindo pgAdmin...")
        subprocess.Popen([pgadmin_path])
        print("✅ pgAdmin aberto!")
        return True
    except Exception as e:
        print(f"❌ Erro ao abrir pgAdmin: {e}")
        return False

def check_postgres_service():
    """Verifica se o serviço PostgreSQL está rodando"""
    try:
        print("🔍 Verificando serviço PostgreSQL...")
        result = subprocess.run(['sc', 'query', 'postgresql-x64-17'],
                              capture_output=True, text=True, shell=True)

        if 'RUNNING' in result.stdout:
            print("✅ Serviço PostgreSQL está rodando")
            return True
        else:
            print("❌ Serviço PostgreSQL não está rodando")
            return False
    except Exception as e:
        print(f"⚠️ Não foi possível verificar serviço: {e}")
        return True  # Assumir que está rodando

def show_instructions():
    """Mostra instruções para configuração manual"""
    print("\n" + "="*60)
    print("📋 INSTRUÇÕES PARA CONFIGURAÇÃO MANUAL")
    print("="*60)
    print()
    print("1. 🗄️ CRIAR USUÁRIO:")
    print("   - Clique com botão direito em 'Login/Group Roles'")
    print("   - Selecione 'Create > Login/Group Role...'")
    print("   - Name: cinema_erp")
    print("   - Password: cinema_erp_password_123")
    print("   - Marque 'Can login?' e 'Create databases?'")
    print()
    print("2. 🏗️ CRIAR BANCO:")
    print("   - Clique com botão direito em 'Databases'")
    print("   - Selecione 'Create > Database...'")
    print("   - Database: cinema_erp")
    print("   - Owner: cinema_erp")
    print()
    print("3. 🔑 DAR PRIVILÉGIOS:")
    print("   - Clique com botão direito no banco 'cinema_erp'")
    print("   - Selecione 'Properties'")
    print("   - Vá para aba 'Privileges'")
    print("   - Adicione usuário 'cinema_erp' com todos os privilégios")
    print()
    print("4. 🧪 TESTAR:")
    print("   - Clique com botão direito no banco 'cinema_erp'")
    print("   - Selecione 'Query Tool'")
    print("   - Digite: SELECT current_database(), current_user;")
    print("   - Pressione F5")
    print()
    print("5. ✅ FINALIZAR:")
    print("   - Volte ao terminal")
    print("   - Execute: py finalize_postgres_setup.py")
    print()

def main():
    """Função principal"""
    print("🐘 Configuração pgAdmin para Cinema ERP")
    print("="*50)

    # Verificar serviço PostgreSQL
    check_postgres_service()

    # Encontrar pgAdmin
    pgadmin_path = find_pgadmin()

    if pgadmin_path:
        # Tentar abrir pgAdmin
        if open_pgadmin(pgadmin_path):
            print("\n⏳ Aguarde o pgAdmin abrir...")
            print("   (Pode levar alguns segundos)")

            # Mostrar instruções
            show_instructions()
        else:
            print("\n❌ Não foi possível abrir pgAdmin automaticamente")
            print("   Tente abrir manualmente:")
            print(f"   {pgadmin_path}")
            show_instructions()
    else:
        print("\n❌ pgAdmin não encontrado!")
        print("\n📥 Para instalar:")
        print("1. Acesse: https://www.pgadmin.org/download/")
        print("2. Baixe a versão para Windows")
        print("3. Execute o instalador")
        print("4. Execute este script novamente")

        # Mostrar instruções mesmo sem pgAdmin
        show_instructions()

if __name__ == "__main__":
    main()

