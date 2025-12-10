# 🚀 Guia de Início Rápido - Cinema ERP

## ✅ **Sistema Funcionando!**

O sistema está configurado e funcionando perfeitamente. Aqui está como usar:

## 🎯 **Como Iniciar o Sistema**

### **Opção 1: Script Automático (Recomendado)**

```bash
# Windows (duplo clique ou terminal)
INICIAR_SEM_DOCKER.bat

# Linux/macOS
./start-dev.sh
```

O script cria o ambiente virtual Python, instala dependências, configura o PostgreSQL local (usuário `postgres`, senha `0876`) com dados de exemplo e inicia backend (porta 8000) e frontend (porta 5173).

### **Opção 2: Manual**

```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
python setup_database.py
python run_app.py

# Terminal 2 - Frontend
cd frontend
npm install
echo VITE_API_BASE_URL=http://localhost:8000/api/v1 > .env.local
npm run dev
```

**Login padrão:** `admin@cinema.com` / `admin123`

## 🌐 **URLs do Sistema**

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Documentação da API**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔧 **Configuração do Python**

Se você encontrar erro de "python não reconhecido", use:

```bash
# No PowerShell, configure o alias:
Set-Alias python "C:\Users\werbi\AppData\Local\Programs\Python\Python313\python.exe"

# Ou adicione ao PATH permanentemente:
# 1. Abra "Variáveis de Ambiente" no Windows
# 2. Adicione: C:\Users\werbi\AppData\Local\Programs\Python\Python313\
# 3. Reinicie o terminal
```

## 🎨 **Melhorias Implementadas**

### **Frontend (React + TypeScript)**

- ✅ **Tratamento de erros robusto** com logs detalhados
- ✅ **Queries seguras** que nunca retornam `undefined`
- ✅ **Validação de payloads** antes de enviar para API
- ✅ **Fallbacks automáticos** quando API não está disponível
- ✅ **Firebase Storage** com tratamento de erros e fallbacks
- ✅ **React Query otimizado** com retry inteligente
- ✅ **Hooks personalizados** para queries e mutations

### **Backend (FastAPI + Python)**

- ✅ **API RESTful completa** com endpoints funcionais
- ✅ **PostgreSQL local** configurado automaticamente para desenvolvimento
- ✅ **CORS configurado** para desenvolvimento
- ✅ **Documentação automática** em /docs
- ✅ **Health check** em /health

## 📊 **Funcionalidades Disponíveis**

### **Locações**

- ✅ Listar locações com paginação
- ✅ Busca avançada com filtros
- ✅ Visualizar detalhes da locação
- ✅ Upload de fotos (Firebase + fallback local)
- ✅ Sistema de tags e categorias

### **Projetos**

- ✅ CRUD completo de projetos
- ✅ Status e workflow
- ✅ Vinculação com locações
- ✅ Controle de orçamento

### **Usuários**

- ✅ Sistema de autenticação
- ✅ Diferentes níveis de acesso
- ✅ Gerenciamento de permissões

### **Agenda**

- ✅ Visitas agendadas
- ✅ Calendário interativo
- ✅ Notificações

## 🐛 **Resolução de Problemas**

### **Erro: "python não reconhecido"**

```bash
# Solução temporária:
Set-Alias python "C:\Users\werbi\AppData\Local\Programs\Python\Python313\python.exe"

# Solução permanente:
# Adicione o Python ao PATH do sistema
```

### **Erro: "npm não reconhecido"**

```bash
# Instale o Node.js: https://nodejs.org/
# Reinicie o terminal após instalação
```

### **Backend não inicia**

```bash
# Verifique se as dependências estão instaladas:
cd backend
python -m pip install fastapi uvicorn sqlalchemy pydantic
```

### **Frontend não carrega**

```bash
# Verifique se as dependências estão instaladas:
cd frontend
npm install
```

## 🔍 **Logs e Debug**

### **Logs do Backend**

- Logs detalhados no terminal do backend
- Emojis para identificação rápida (🔥, ✅, ❌, etc.)
- Informações de banco de dados e API

### **Logs do Frontend**

- Console do navegador com logs estruturados
- React Query DevTools (se instalado)
- Network tab para ver requisições

## 🚀 **Próximos Passos**

1. **Teste as funcionalidades** no frontend
2. **Explore a API** em http://localhost:8000/docs
3. **Configure o banco real** se necessário
4. **Personalize** conforme suas necessidades

## 📞 **Suporte**

Se encontrar problemas:

1. Verifique os logs nos terminais
2. Confirme que as URLs estão acessíveis
3. Verifique se as dependências estão instaladas
4. Use o health check: http://localhost:8000/health

---

**🎉 Sistema pronto para uso!**
