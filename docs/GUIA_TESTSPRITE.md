# 🧪 Guia de Testes com TestSprite - Cinema ERP

## ✅ O que já foi configurado

1. ✅ Resumo do código criado em `testsprite_tests/tmp/code_summary.json`
2. ✅ Estrutura do projeto analisada
3. ✅ Informações de portas identificadas:
   - Frontend: porta 5173 (Vite)
   - Backend: porta 8000 (FastAPI)

## 🚀 Pré-requisitos para executar os testes

Antes de executar os testes com TestSprite, você precisa iniciar os serviços:

### **Opção 1: Script Automático (Recomendado)**

```powershell
# No diretório raiz do projeto
.\start-dev-all.ps1 -Port 8000
```

Ou no Windows:
```batch
start_system.bat
```

### **Opção 2: Iniciar Manualmente**

#### **1. Iniciar Backend (porta 8000)**

```bash
cd backend
python start_server.py
```

Ou:
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### **2. Iniciar Frontend (porta 5173)**

Em outro terminal:
```bash
cd frontend
npm run dev
```

### **3. Verificar se os serviços estão rodando**

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## 📋 Próximos Passos

Após iniciar os serviços, você pode executar os testes do TestSprite:

### **1. Bootstrap dos Testes**

O TestSprite precisa fazer o bootstrap inicial. Você pode executar:

```bash
# Para frontend
# Usar a ferramenta: testsprite_bootstrap_tests com type="frontend" e localPort=5173

# Para backend
# Usar a ferramenta: testsprite_bootstrap_tests com type="backend" e localPort=8000
```

### **2. Gerar Planos de Teste**

```bash
# Gerar plano de teste para frontend
testsprite_generate_frontend_test_plan

# Gerar plano de teste para backend
testsprite_generate_backend_test_plan
```

### **3. Executar Testes**

```bash
# Executar todos os testes ou testes específicos
testsprite_generate_code_and_execute
```

## 📝 Estrutura de Testes

Os testes do TestSprite serão criados em:
- `testsprite_tests/` - Diretório principal de testes
- `testsprite_tests/tmp/` - Arquivos temporários e configurações
- Relatórios de teste serão gerados após a execução

## 🔍 Funcionalidades que serão testadas

### **Frontend:**
- ✅ Autenticação e login
- ✅ Dashboard com métricas
- ✅ Gestão de Locações (CRUD)
- ✅ Gestão de Projetos (CRUD)
- ✅ Agenda de Visitas (calendário)
- ✅ Gestão de Fornecedores
- ✅ Exportação de Apresentações
- ✅ Gestão de Usuários
- ✅ Sistema de Notificações

### **Backend:**
- ✅ API endpoints de Locações
- ✅ API endpoints de Projetos
- ✅ API endpoints de Visitas
- ✅ API endpoints de Fornecedores
- ✅ API endpoints de Usuários
- ✅ API endpoints de Tags
- ✅ Validação de dados
- ✅ Autenticação e autorização

## ⚠️ Observações Importantes

1. **Serviços devem estar rodando**: O TestSprite precisa que tanto o frontend quanto o backend estejam ativos durante os testes
2. **Banco de dados**: Certifique-se de que o banco de dados está configurado (SQLite para desenvolvimento ou PostgreSQL para produção)
3. **Firebase**: Se usar recursos do Firebase (Storage, Firestore), configure as credenciais adequadamente
4. **Portas**: Certifique-se de que as portas 5173 e 8000 estão livres

## 📞 Próximos Passos

1. ✅ Inicie os serviços (frontend e backend)
2. ✅ Execute o bootstrap dos testes do TestSprite
3. ✅ Gere os planos de teste
4. ✅ Execute os testes e analise os resultados









