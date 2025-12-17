"""
Script para executar a migração Alembic 004 - adiciona tabela de histórico de etapas
"""
from alembic.config import Config
from alembic import command
import os

# Caminho para o alembic.ini
alembic_ini_path = os.path.join(os.path.dirname(__file__), 'alembic.ini')

# Criar configuração
alembic_cfg = Config(alembic_ini_path)

# Verificar versão atual
print("📊 Verificando versão atual do banco...")
try:
    command.current(alembic_cfg, verbose=True)
except Exception as e:
    print(f"⚠️ Erro ao verificar versão: {e}")

# Executar upgrade
print("\n🚀 Executando migração 004 (adicionar histórico de etapas)...")
try:
    command.upgrade(alembic_cfg, "head")
    print("✅ Migração concluída com sucesso!")
except Exception as e:
    print(f"❌ Erro na migração: {e}")
    raise

# Verificar nova versão
print("\n📊 Nova versão do banco:")
command.current(alembic_cfg, verbose=True)

print("\n✨ Tabela 'project_location_stage_history' criada!")
print("🎯 Sistema de rastreamento de mudanças de etapas está ativo!")
