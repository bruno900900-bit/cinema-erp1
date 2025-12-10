#!/bin/bash

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Iniciando Cinema ERP - Desenvolvimento"
echo

echo "🐍 Preparando backend Python..."
pushd "$PROJECT_ROOT/backend" >/dev/null

if [ ! -d "venv" ]; then
  echo "📦 Criando ambiente virtual..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

if [ -f ".env" ]; then
  if ! grep -q "DATABASE_TYPE=postgres" .env; then
    if [ -f "env.postgres" ]; then
      cp -f env.postgres .env
      echo "⚙️  Arquivo .env atualizado para PostgreSQL (senha 0876)."
    elif [ -f ".env.example" ]; then
      cp -f .env.example .env
      echo "⚙️  Arquivo .env recriado a partir do exemplo."
    fi
  fi
else
  if [ -f "env.postgres" ]; then
    cp env.postgres .env
    echo "⚙️  Arquivo .env criado com configuração PostgreSQL (senha 0876)."
  elif [ -f ".env.example" ]; then
    cp .env.example .env
    echo "⚙️  Arquivo .env criado a partir do exemplo."
  elif [ -f "env.example" ]; then
    cp env.example .env
    echo "⚙️  Arquivo .env criado a partir do exemplo."
  fi
fi

python setup_database.py

BACKEND_CMD="cd $(pwd) && source venv/bin/activate && python run_app.py"
if command -v gnome-terminal >/dev/null; then
  gnome-terminal --title="Backend - Cinema ERP" -- bash -c "$BACKEND_CMD; exec bash"
else
  echo "⚠️ gnome-terminal não encontrado. Executando backend nesta janela..."
  bash -c "$BACKEND_CMD" &
fi

popd >/dev/null

echo
echo "⏳ Aguardando backend inicializar..."
sleep 8

echo
echo "📦 Preparando frontend React..."
pushd "$PROJECT_ROOT/frontend" >/dev/null

if [ ! -d "node_modules" ]; then
  echo "📥 Instalando dependências do frontend (npm install)..."
  npm install
fi

if [ ! -f ".env.local" ]; then
  echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env.local
  echo "🔧 Criado arquivo .env.local apontando para o backend local."
fi

FRONTEND_CMD="cd $(pwd) && npm run dev"
if command -v gnome-terminal >/dev/null; then
  gnome-terminal --title="Frontend - Cinema ERP" -- bash -c "$FRONTEND_CMD; exec bash"
else
  echo "⚠️ gnome-terminal não encontrado. Executando frontend em background nesta janela..."
  bash -c "$FRONTEND_CMD" &
fi

popd >/dev/null

echo
echo "========================================"
echo "✅ SISTEMA INICIADO!"
echo "========================================"
echo
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend : http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo
echo "👤 Login padrão: admin@cinema.com / admin123"
echo
read -p "Pressione Enter para finalizar este script (os serviços continuam rodando)..."
