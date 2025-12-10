# 🐘 Passo a Passo: Configuração pgAdmin

Este guia te ensina como configurar o pgAdmin do zero para usar com o Cinema ERP.

## 📋 Pré-requisitos

- ✅ PostgreSQL instalado e rodando
- ✅ pgAdmin instalado (ou vamos instalar)

## 🚀 Passo 1: Verificar se pgAdmin está instalado

### Verificar instalação:

1. **Pressione** `Windows + R`
2. **Digite** `pgAdmin 4` e pressione Enter
3. **Se abrir**: pgAdmin já está instalado ✅
4. **Se não abrir**: Vamos instalar

### Se não estiver instalado:

1. **Acesse**: https://www.pgadmin.org/download/
2. **Baixe** a versão para Windows
3. **Execute** o instalador
4. **Siga** as instruções de instalação

## 🔧 Passo 2: Abrir pgAdmin

### Método 1 - Menu Iniciar:

1. **Clique** no botão Iniciar
2. **Digite** `pgAdmin`
3. **Clique** em `pgAdmin 4`

### Método 2 - Desktop:

1. **Procure** o ícone do pgAdmin na área de trabalho
2. **Clique** duas vezes

### Método 3 - Executável:

1. **Pressione** `Windows + R`
2. **Digite**: `C:\Program Files\pgAdmin 4\runtime\pgAdmin4.exe`
3. **Pressione** Enter

## 🔐 Passo 3: Configurar Senha Master

**Na primeira execução**, o pgAdmin pedirá uma senha master:

1. **Digite** uma senha segura (ex: `admin123`)
2. **Confirme** a senha
3. **Clique** em `OK`
4. **Guarde** esta senha - você precisará dela sempre

## 🖥️ Passo 4: Interface do pgAdmin

Após abrir, você verá:

```
pgAdmin 4
├── Servers (no painel esquerdo)
│   └── PostgreSQL 17 (ou sua versão)
│       ├── Databases
│       ├── Login/Group Roles
│       ├── Tablespaces
│       └── Extensions
```

## 🔌 Passo 5: Conectar ao Servidor PostgreSQL

### Se já aparecer "PostgreSQL 17":

1. **Clique** em `PostgreSQL 17`
2. **Digite** a senha do usuário `postgres`
3. **Clique** em `OK`

### Se não aparecer servidor:

1. **Clique com botão direito** em `Servers`
2. **Selecione** `Register > Server...`
3. **Preencha**:
   - **Name**: `PostgreSQL 17` (ou qualquer nome)
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Username**: `postgres`
   - **Password**: `postgres` (ou sua senha)
4. **Clique** em `Save`

## 🗄️ Passo 6: Criar Usuário cinema_erp

1. **Expanda** `PostgreSQL 17`
2. **Clique com botão direito** em `Login/Group Roles`
3. **Selecione** `Create > Login/Group Role...`
4. **Na aba General**:
   - **Name**: `cinema_erp`
5. **Na aba Definition**:
   - **Password**: `cinema_erp_password_123`
6. **Na aba Privileges**:
   - **Can login?**: ✅ Sim
   - **Create databases?**: ✅ Sim
7. **Clique** em `Save`

## 🏗️ Passo 7: Criar Banco cinema_erp

1. **Clique com botão direito** em `Databases`
2. **Selecione** `Create > Database...`
3. **Preencha**:
   - **Database**: `cinema_erp`
   - **Owner**: `cinema_erp`
4. **Clique** em `Save`

## 🔑 Passo 8: Dar Privilégios

1. **Clique com botão direito** no banco `cinema_erp`
2. **Selecione** `Properties`
3. **Vá para aba** `Privileges`
4. **Clique** em `+` para adicionar
5. **Selecione**:
   - **Grantee**: `cinema_erp`
   - **Privileges**: Marque todas as opções
6. **Clique** em `Save`

## 🧪 Passo 9: Testar Conexão

1. **Clique com botão direito** em `cinema_erp`
2. **Selecione** `Query Tool`
3. **Digite**:
   ```sql
   SELECT current_database(), current_user;
   ```
4. **Pressione** `F5` ou clique no botão Executar
5. **Deve retornar**: `cinema_erp | cinema_erp`

## 🔧 Passo 10: Executar Script de Configuração

1. **No Query Tool**, abra o arquivo `setup_postgres_manual.sql`
2. **Copie** todo o conteúdo
3. **Cole** no Query Tool
4. **Execute** (F5)

## ✅ Passo 11: Verificar Configuração

Execute estas consultas para verificar:

```sql
-- Verificar usuário
SELECT rolname FROM pg_roles WHERE rolname = 'cinema_erp';

-- Verificar banco
SELECT datname FROM pg_database WHERE datname = 'cinema_erp';

-- Verificar extensões
SELECT extname FROM pg_extension WHERE extname IN ('postgis', 'pg_trgm', 'unaccent', 'uuid-ossp');
```

## 🚨 Solução de Problemas

### Erro: "password authentication failed"

- **Solução**: Verifique a senha do usuário `postgres`
- **Teste**: Tente conectar com `psql` no terminal

### Erro: "database does not exist"

- **Solução**: Crie o banco `cinema_erp` primeiro

### Erro: "permission denied"

- **Solução**: Dê privilégios ao usuário `cinema_erp`

### pgAdmin não abre

- **Solução**: Reinstale o pgAdmin
- **Alternativa**: Use `psql` no terminal

## 📱 Interface do pgAdmin

### Painel Esquerdo (Browser):

- **Servers**: Lista de servidores
- **Databases**: Bancos de dados
- **Schemas**: Esquemas (public, etc.)
- **Tables**: Tabelas
- **Functions**: Funções
- **Views**: Visualizações

### Painel Central:

- **Query Tool**: Editor SQL
- **Properties**: Propriedades do objeto
- **Data**: Dados das tabelas

### Painel Inferior:

- **Messages**: Mensagens de erro/sucesso
- **History**: Histórico de consultas

## 🎯 Próximos Passos

Após configurar o pgAdmin:

1. **Execute** o script de configuração
2. **Teste** a conexão
3. **Volte** ao terminal e execute:
   ```bash
   py finalize_postgres_setup.py
   ```

## 📞 Suporte

Se encontrar problemas:

1. **Verifique** se PostgreSQL está rodando
2. **Confirme** as credenciais
3. **Teste** conexão com `psql`
4. **Reinicie** o pgAdmin

---

**✅ Pronto!** Seu pgAdmin está configurado e pronto para usar com o Cinema ERP!

