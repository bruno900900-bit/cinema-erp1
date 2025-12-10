# 🔐 Credenciais de Login - Cinema ERP

## ✅ **Usuários de Teste Criados**

### 👑 **Administrador**
- **Email:** `admin@cinema.com`
- **Senha:** `admin123`
- **Role:** `ADMIN`
- **Descrição:** Acesso total ao sistema

### 👨‍💼 **Gerente**
- **Email:** `gerente@cinema.com`
- **Senha:** `gerente123`
- **Role:** `MANAGER`
- **Descrição:** Gerencia projetos e equipes

### 👥 **Membros da Equipe**
- **Email:** `joao.silva@cinema.com`
- **Senha:** `joao123`
- **Role:** `MEMBER`
- **Descrição:** Diretor de Produção

- **Email:** `maria.santos@cinema.com`
- **Senha:** `maria123`
- **Role:** `MEMBER`
- **Descrição:** Produtora Executiva

- **Email:** `pedro.oliveira@cinema.com`
- **Senha:** `pedro123`
- **Role:** `MEMBER`
- **Descrição:** Assistente de Produção

- **Email:** `ana.costa@cinema.com`
- **Senha:** `ana123`
- **Role:** `MEMBER`
- **Descrição:** Coordenadora de Locação

### 🏢 **Cliente Externo**
- **Email:** `cliente@nike.com`
- **Senha:** `cliente123`
- **Role:** `CLIENT`
- **Descrição:** Cliente externo - Nike Brasil

## 🚀 **Como Fazer Login**

### **1. Via API (Postman/Insomnia)**
```bash
POST http://localhost:8000/api/v1/auth/login-json
Content-Type: application/json

{
  "email": "admin@cinema.com",
  "password": "admin123"
}
```

### **2. Via Frontend**
- Acesse: `http://localhost:3000`
- Use qualquer uma das credenciais acima

### **3. Via Swagger UI**
- Acesse: `http://localhost:8000/docs`
- Use o endpoint `/api/v1/auth/login-json`

## 🔧 **Endpoints de Autenticação**

### **Login com JSON**
```bash
POST /api/v1/auth/login-json
```

### **Login com Form Data**
```bash
POST /api/v1/auth/login
```

### **Obter Usuário Atual**
```bash
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### **Testar Autenticação**
```bash
GET /api/v1/auth/test
Authorization: Bearer <token>
```

## 📝 **Exemplo de Resposta do Login**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

## 🛡️ **Níveis de Acesso**

| Role | Descrição | Permissões |
|------|-----------|------------|
| `ADMIN` | Administrador | Acesso total ao sistema |
| `MANAGER` | Gerente | Gerencia projetos e equipes |
| `MEMBER` | Membro | Acesso padrão da equipe |
| `CLIENT` | Cliente | Acesso limitado |

## 🔄 **Como Recriar Usuários**

Se precisar recriar os usuários de teste:

```bash
cd backend
py scripts/create_test_users.py
```

## ⚠️ **Importante**

- **NÃO use essas credenciais em produção**
- As senhas são simples para facilitar testes
- Em produção, use senhas complexas e seguras
- O token JWT expira em 30 minutos por padrão

---

**🎬 Cinema ERP - Sistema de Gestão de Locações**














