# 🔗 **COMO CONECTAR FRONTEND E BACKEND**

## ✅ **STATUS ATUAL**

- ✅ Frontend configurado para conectar com backend
- ✅ Backend com CORS habilitado
- ✅ Serviços atualizados para usar APIs reais
- ✅ Scripts de inicialização criados

## 🚀 **PASSO A PASSO PARA UNIR OS SISTEMAS**

### **1. Iniciar Backend**

```bash
cd backend
py -m uvicorn app.main:app --reload --port 8000
```

### **2. Iniciar Frontend**

```bash
cd frontend
npm run dev
```

### **3. Verificar Conexão**

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🔧 **ALTERAÇÕES REALIZADAS**

### **Frontend - Serviços Atualizados**

- ✅ `projectService.ts` - Conectado com APIs reais
- ✅ `locationService.ts` - Conectado com APIs reais
- ✅ `authService.ts` - Conectado com APIs reais
- ✅ `api.ts` - Configurado para backend real

### **Frontend - Handlers Atualizados**

- ✅ `LocationsPage.tsx` - CRUD conectado com backend
- ✅ `ProjectsPage.tsx` - CRUD conectado com backend
- ✅ Invalidação de cache após operações

### **Scripts de Inicialização**

- ✅ `start-dev.bat` - Para Windows
- ✅ `start-dev.sh` - Para Linux/Mac

## 🎯 **FUNCIONALIDADES CONECTADAS**

### **✅ Projetos**

- Criar projeto → `POST /api/v1/projects`
- Listar projetos → `GET /api/v1/projects`
- Editar projeto → `PUT /api/v1/projects/{id}`
- Excluir projeto → `DELETE /api/v1/projects/{id}`

### **✅ Locações**

- Criar locação → `POST /api/v1/locations`
- Listar locações → `GET /api/v1/locations`
- Editar locação → `PUT /api/v1/locations/{id}`
- Excluir locação → `DELETE /api/v1/locations/{id}`

### **✅ Autenticação**

- Login → `POST /api/v1/auth/login`
- Logout → `POST /api/v1/auth/logout`
- Usuário atual → `GET /api/v1/auth/me`

## 🔍 **VERIFICAÇÃO DE FUNCIONAMENTO**

### **1. Testar Backend**

```bash
curl http://localhost:8000/health
```

### **2. Testar Frontend**

- Abrir http://localhost:5173
- Tentar fazer login
- Criar um projeto
- Criar uma locação

### **3. Verificar Logs**

- Backend: Terminal do uvicorn
- Frontend: Console do navegador (F12)

## 🚨 **PROBLEMAS COMUNS**

### **Erro CORS**

- Verificar se backend está rodando na porta 8000
- Verificar configuração CORS em `backend/app/main.py`

### **Erro 404**

- Verificar se rotas estão corretas em `backend/app/api/v1/endpoints/`
- Verificar se frontend está chamando URLs corretas

### **Erro de Conexão**

- Verificar se backend está rodando
- Verificar se porta 8000 não está ocupada
- Verificar firewall/antivírus

## 📊 **PRÓXIMOS PASSOS**

### **Alta Prioridade**

1. ✅ Conectar autenticação real
2. ✅ Implementar upload de fotos
3. ✅ Conectar agenda com backend
4. ✅ Implementar notificações

### **Média Prioridade**

5. Implementar relatórios
6. Conectar gestão de usuários
7. Implementar testes automatizados
8. Preparar para produção

## 🎉 **RESULTADO**

**O frontend e backend agora estão conectados!**

- Dados reais sendo salvos no banco
- Operações CRUD funcionais
- Autenticação integrada
- Sistema pronto para desenvolvimento

---

**Para iniciar rapidamente:**

```bash
# Windows
start-dev.bat

# Linux/Mac
./start-dev.sh
```

