# 🚀 Guia Completo: Como Ativar e Manter a API Sempre Ligada

## 📋 Pré-requisitos

Antes de começar, certifique-se de que você tem:

- ✅ Python 3.8+ instalado
- ✅ Node.js 16+ instalado
- ✅ Git instalado

## 🔧 Passo 1: Instalar Dependências do Backend

Abra o terminal e execute:

```bash
# Navegar para o diretório do backend
cd backend

# Instalar dependências Python
pip install -r requirements.txt

# OU se você usa Python 3 especificamente:
py -m pip install -r requirements.txt
```

## 🗄️ Passo 2: Configurar Banco de Dados

### Opção A: SQLite (Mais Simples)
```bash
# O banco SQLite já está configurado
# Não precisa fazer nada adicional
```

### Opção B: PostgreSQL (Recomendado para Produção)
```bash
# Instalar PostgreSQL
# Criar banco de dados
# Configurar variáveis de ambiente
```

## 🚀 Passo 3: Iniciar a API

### Método 1: Script Simples (Recomendado)
```bash
cd backend
python simple_server.py
```

### Método 2: Com Reload Automático
```bash
cd backend
python run_server.py
```

### Método 3: Comando Direto
```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## ✅ Passo 4: Verificar se a API Está Funcionando

Abra o navegador e acesse:

- **API Health Check**: http://127.0.0.1:8000/health
- **Documentação da API**: http://127.0.0.1:8000/docs
- **Interface Swagger**: http://127.0.0.1:8000/redoc

## 🔄 Passo 5: Manter a API Sempre Ligada

### Opção A: Terminal Sempre Aberto
- Mantenha o terminal aberto com o servidor rodando
- Use `Ctrl+C` para parar quando necessário

### Opção B: Serviço do Windows (Avançado)
```bash
# Criar um serviço do Windows para iniciar automaticamente
# Requer configuração adicional
```

### Opção C: PM2 (Node.js Process Manager)
```bash
# Instalar PM2
npm install -g pm2

# Criar arquivo ecosystem.config.js
# Configurar para rodar o servidor Python
```

## 🌐 Passo 6: Configurar Frontend para Usar API Real

### Atualizar Variáveis de Ambiente
Edite o arquivo `frontend/.env.development`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### Iniciar Frontend
```bash
cd frontend
npm run dev
```

## 🔧 Scripts de Automação

### Script para Windows (start-api.bat)
```batch
@echo off
echo 🚀 Iniciando API do Cinema ERP...
cd backend
python simple_server.py
pause
```

### Script para Linux/Mac (start-api.sh)
```bash
#!/bin/bash
echo "🚀 Iniciando API do Cinema ERP..."
cd backend
python3 simple_server.py
```

## 📊 Monitoramento da API

### Logs em Tempo Real
```bash
# Ver logs do servidor
tail -f logs/api.log

# OU se não houver arquivo de log:
# Os logs aparecem no terminal onde o servidor está rodando
```

### Verificar Status
```bash
# Testar se a API está respondendo
curl http://127.0.0.1:8000/health

# OU abrir no navegador:
# http://127.0.0.1:8000/health
```

## 🛠️ Solução de Problemas

### Erro: "Module not found"
```bash
# Reinstalar dependências
pip install -r requirements.txt --force-reinstall
```

### Erro: "Port already in use"
```bash
# Encontrar processo usando a porta 8000
netstat -ano | findstr :8000

# Matar o processo (substitua PID pelo número do processo)
taskkill /PID <PID> /F
```

### Erro: "Database connection failed"
```bash
# Verificar se o banco de dados está configurado
# Executar migrações se necessário
python run_migration.py
```

## 🎯 Funcionalidades Disponíveis com API Ativa

### ✅ CRUD Completo
- **Locações**: Criar, editar, excluir, listar
- **Projetos**: Gerenciamento completo
- **Fornecedores**: Cadastro e vinculação
- **Usuários**: Sistema de usuários
- **Tags**: Sistema de tags
- **Agenda**: Eventos e visitas

### ✅ Upload de Arquivos
- **Fotos de locações**: Upload múltiplo
- **Documentos**: Upload de contratos
- **Exportação**: Relatórios em PDF/PPT

### ✅ Autenticação
- **Login/Logout**: Sistema de autenticação
- **Permissões**: Controle de acesso
- **JWT**: Tokens de autenticação

## 🔄 Fluxo de Trabalho Recomendado

1. **Iniciar API**: `cd backend && python simple_server.py`
2. **Iniciar Frontend**: `cd frontend && npm run dev`
3. **Acessar**: http://localhost:5173 (frontend)
4. **API Docs**: http://127.0.0.1:8000/docs

## 📱 URLs Importantes

- **Frontend**: http://localhost:5173
- **API**: http://127.0.0.1:8000
- **API Docs**: http://127.0.0.1:8000/docs
- **Health Check**: http://127.0.0.1:8000/health

## 🎉 Resultado Final

Com a API ativa, você terá:

- ✅ **Dados reais** salvos no banco de dados
- ✅ **Upload de fotos** funcionando
- ✅ **Todas as funcionalidades** operacionais
- ✅ **Performance melhorada**
- ✅ **Sistema completo** funcionando

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se todas as dependências estão instaladas
2. Confirme se a porta 8000 está livre
3. Verifique os logs do servidor
4. Teste a API em http://127.0.0.1:8000/health

---

**🎯 Agora sua API estará sempre ligada e funcionando!**



