# 🎬 Cinema ERP - Guia de Inicialização

## 🚀 Formas de Iniciar o Sistema

Você tem **2 opções** para iniciar o sistema:

---

### ✅ **OPÇÃO 1: Com Docker (Recomendado e Mais Fácil)**

**Vantagens:**
- Não precisa instalar PostgreSQL, Redis, Nginx separadamente
- Tudo configurado automaticamente
- Mais fácil e rápido

**Requisitos:**
- Docker Desktop instalado e rodando
- Download: https://www.docker.com/products/docker-desktop

**Como iniciar:**
```
1. Abra o Docker Desktop
2. Execute: INICIAR_SISTEMA_COMPLETO.bat
3. Aguarde alguns segundos
4. Acesse: http://localhost:3000 (Frontend)
5. API: http://localhost:8000/docs
```

**Para parar:**
```
Execute: PARAR_SISTEMA.bat
```

**Para ver logs:**
```
Execute: VER_LOGS.bat
```

---

### ⚙️ **OPÇÃO 2: Sem Docker (Desenvolvimento Manual)**

**Requisitos:**
1. **Python 3.11+** instalado
2. **Node.js 18+** instalado

**Configuração Inicial:**

#### 1️⃣ Preparar Backend

```bash
# Navegue para a pasta backend
cd backend

# Criar ambiente virtual e instalar dependências
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate       # Linux/macOS
pip install -r requirements.txt

# Gerar banco SQLite com dados de demonstração
python setup_database.py
```

> Os scripts padrão já geram `.env` apontando para PostgreSQL local com usuário `postgres` e senha `0876`. Caso ainda não exista o banco, execute:
> ```bash
> psql -U postgres
> CREATE DATABASE cinema_erp;
> \q
> ```

#### 2️⃣ Preparar Frontend

```bash
cd ../frontend
npm install
echo VITE_API_BASE_URL=http://localhost:8000/api/v1 > .env.local
```

#### 3️⃣ Iniciar Sistema

```
# Terminal 1
cd backend
venv\Scripts\activate && python run_app.py

# Terminal 2
cd frontend
npm run dev
```

> Dica: use `INICIAR_SEM_DOCKER.bat` (Windows) ou `./start-dev.sh` (Linux/macOS) para automatizar todo o processo.

---

## 🌐 URLs de Acesso

### Com Docker:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Nginx:** http://localhost

### Sem Docker:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

### Credenciais de demonstração
- Email: `admin@cinema.com`
- Senha: `admin123`

---

## 🛠️ Scripts Disponíveis

### Com Docker:
- `INICIAR_SISTEMA_COMPLETO.bat` - Inicia todos os serviços
- `PARAR_SISTEMA.bat` - Para todos os serviços
- `VER_LOGS.bat` - Visualiza logs em tempo real

### Sem Docker:
- `INICIAR.bat` - Menu interativo para escolher modo Docker ou manual
- `INICIAR_SEM_DOCKER.bat` - Inicia backend e frontend manualmente
- `1_iniciar_backend.bat` - Apenas backend
- `2_iniciar_frontend.bat` - Apenas frontend

---

## ❓ Problemas Comuns

### "Docker não encontrado"
- Instale o Docker Desktop
- Certifique-se de que está rodando

### "PostgreSQL connection failed" (apenas se estiver usando Postgres)
- Verifique se PostgreSQL está rodando
- Confirme usuário/senha no arquivo `backend/.env`
- Certifique-se de que o banco 'cinema_erp' existe

### "Port already in use"
- Algum serviço já está usando a porta
- Backend (8000) ou Frontend (5173/3000)
- Pare o processo que está usando a porta

### Frontend não carrega
- Aguarde 15-20 segundos após iniciar
- Verifique se o backend está rodando (http://localhost:8000/health)
- Limpe o cache do navegador (Ctrl+Shift+R)

---

## 📝 Notas Importantes

1. **Primeira execução:** Pode demorar mais (instalação de dependências)
2. **Banco:** SQLite já fica pronto automaticamente (PostgreSQL é opcional)
3. **Portas:** Certifique-se de que as portas 8000 e 5173 (ou 3000) estão livres
4. **Logs:** Se algo der errado, verifique os logs nas janelas abertas

---

## 🆘 Ajuda

Se continuar tendo problemas:

1. Verifique os logs nas janelas que abriram
2. Tente com Docker (é mais fácil)
3. Verifique se PostgreSQL está configurado corretamente
4. Confirme que todas as dependências estão instaladas

---

## 📚 Documentação Completa

Após iniciar o sistema, acesse:
- **http://localhost:8000/docs** - Documentação completa da API (Swagger)
- **http://localhost:8000/redoc** - Documentação alternativa (ReDoc)
