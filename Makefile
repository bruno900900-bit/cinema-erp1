.PHONY: help install start stop clean test build deploy docker-up docker-down

# Variáveis
PYTHON = python3
NODE = node
NPM = npm
DOCKER = docker
DOCKER_COMPOSE = docker-compose

# Cores para output
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Mostra esta ajuda
	@echo "$(GREEN)🎬 Cinema ERP - Comandos disponíveis:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Instala todas as dependências
	@echo "$(GREEN)📦 Instalando dependências...$(NC)"
	@echo "$(YELLOW)Instalando dependências do backend...$(NC)"
	cd backend && $(PYTHON) -m venv venv
	cd backend && source venv/bin/activate && pip install -r requirements.txt
	@echo "$(YELLOW)Instalando dependências do frontend...$(NC)"
	cd frontend && $(NPM) install
	@echo "$(GREEN)✅ Todas as dependências foram instaladas!$(NC)"

start: ## Inicia o projeto completo
	@echo "$(GREEN)🚀 Iniciando projeto...$(NC)"
	@echo "$(YELLOW)Iniciando backend...$(NC)"
	cd backend && source venv/bin/activate && python run_app.py &
	@echo "$(YELLOW)Iniciando frontend...$(NC)"
	cd frontend && $(NPM) run dev &
	@echo "$(GREEN)✅ Projeto iniciado!$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:5173$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:8000$(NC)"
	@echo "$(YELLOW)API Docs: http://localhost:8000/docs$(NC)"

stop: ## Para todos os serviços
	@echo "$(YELLOW)🛑 Parando serviços...$(NC)"
	@pkill -f "python run_app.py" || true
	@pkill -f "npm run dev" || true
	@echo "$(GREEN)✅ Serviços parados!$(NC)"

clean: ## Limpa arquivos temporários e caches
	@echo "$(YELLOW)🧹 Limpando arquivos temporários...$(NC)"
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name "node_modules" -exec rm -rf {} +
	find . -type d -name "dist" -exec rm -rf {} +
	find . -type d -name "build" -exec rm -rf {} +
	@echo "$(GREEN)✅ Limpeza concluída!$(NC)"

test: ## Executa todos os testes
	@echo "$(GREEN)🧪 Executando testes...$(NC)"
	@echo "$(YELLOW)Testes do backend...$(NC)"
	cd backend && source venv/bin/activate && pytest -v
	@echo "$(YELLOW)Testes do frontend...$(NC)"
	cd frontend && $(NPM) test

build: ## Constrói o projeto para produção
	@echo "$(GREEN)🏗️ Construindo projeto...$(NC)"
	@echo "$(YELLOW)Construindo backend...$(NC)"
	cd backend && source venv/bin/activate && python -m build
	@echo "$(YELLOW)Construindo frontend...$(NC)"
	cd frontend && $(NPM) run build
	@echo "$(GREEN)✅ Build concluído!$(NC)"

docker-up: ## Inicia os serviços com Docker
	@echo "$(GREEN)🐳 Iniciando serviços Docker...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Serviços Docker iniciados!$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:8000$(NC)"
	@echo "$(YELLOW)Nginx: http://localhost:80$(NC)"

docker-down: ## Para os serviços Docker
	@echo "$(YELLOW)🛑 Parando serviços Docker...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✅ Serviços Docker parados!$(NC)"

docker-logs: ## Mostra logs dos serviços Docker
	@echo "$(YELLOW)📋 Logs dos serviços...$(NC)"
	$(DOCKER_COMPOSE) logs -f

docker-build: ## Reconstrói as imagens Docker
	@echo "$(GREEN)🔨 Reconstruindo imagens Docker...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache
	@echo "$(GREEN)✅ Imagens reconstruídas!$(NC)"

deploy: ## Deploy para produção
	@echo "$(GREEN)🚀 Deploy para produção...$(NC)"
	@echo "$(YELLOW)Construindo projeto...$(NC)"
	$(MAKE) build
	@echo "$(YELLOW)Iniciando serviços...$(NC)"
	$(MAKE) docker-up
	@echo "$(GREEN)✅ Deploy concluído!$(NC)"

dev-setup: ## Configuração para desenvolvimento
	@echo "$(GREEN)⚙️ Configurando ambiente de desenvolvimento...$(NC)"
	@echo "$(YELLOW)Instalando dependências...$(NC)"
	$(MAKE) install
	@echo "$(YELLOW)Configurando pre-commit hooks...$(NC)"
	cd backend && source venv/bin/activate && pip install pre-commit
	cd backend && source venv/bin/activate && pre-commit install
	@echo "$(GREEN)✅ Ambiente de desenvolvimento configurado!$(NC)"

lint: ## Executa linting no código
	@echo "$(GREEN)🔍 Executando linting...$(NC)"
	@echo "$(YELLOW)Linting do backend...$(NC)"
	cd backend && source venv/bin/activate && flake8 app/ tests/
	@echo "$(YELLOW)Linting do frontend...$(NC)"
	cd frontend && $(NPM) run lint

format: ## Formata o código
	@echo "$(GREEN)🎨 Formatando código...$(NC)"
	@echo "$(YELLOW)Formatando backend...$(NC)"
	cd backend && source venv/bin/activate && black app/ tests/
	@echo "$(YELLOW)Formatando frontend...$(NC)"
	cd frontend && $(NPM) run format

migrate: ## Executa migrações do banco
	@echo "$(GREEN)🗄️ Executando migrações...$(NC)"
	cd backend && source venv/bin/activate && alembic upgrade head
	@echo "$(GREEN)✅ Migrações concluídas!$(NC)"

seed: ## Popula o banco com dados de exemplo
	@echo "$(GREEN)🌱 Populando banco com dados de exemplo...$(NC)"
	cd backend && source venv/bin/activate && python scripts/seed_data.py
	@echo "$(GREEN)✅ Banco populado!$(NC)"

backup: ## Cria backup do banco
	@echo "$(GREEN)💾 Criando backup do banco...$(NC)"
	@mkdir -p backups
	$(DOCKER) exec cinema_erp_postgres pg_dump -U cinema_user cinema_erp > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup criado!$(NC)"

restore: ## Restaura backup do banco
	@echo "$(YELLOW)⚠️  ATENÇÃO: Isso irá sobrescrever o banco atual!$(NC)"
	@read -p "Digite o nome do arquivo de backup: " backup_file; \
	$(DOCKER) exec -i cinema_erp_postgres psql -U cinema_user cinema_erp < backups/$$backup_file
	@echo "$(GREEN)✅ Backup restaurado!$(NC)"

monitor: ## Monitora recursos do sistema
	@echo "$(GREEN)📊 Monitorando recursos...$(NC)"
	@echo "$(YELLOW)Uso de CPU e memória:$(NC)"
	@top -bn1 | head -20
	@echo "$(YELLOW)Uso de disco:$(NC)"
	@df -h
	@echo "$(YELLOW)Processos Python:$(NC)"
	@ps aux | grep python | grep -v grep || true

logs: ## Mostra logs dos serviços
	@echo "$(GREEN)📋 Logs dos serviços...$(NC)"
	@echo "$(YELLOW)Logs do backend:$(NC)"
	@tail -f backend/logs/app.log || echo "Arquivo de log não encontrado"
	@echo "$(YELLOW)Logs do frontend:$(NC)"
	@tail -f frontend/logs/app.log || echo "Arquivo de log não encontrado"

# Comando padrão
.DEFAULT_GOAL := help
