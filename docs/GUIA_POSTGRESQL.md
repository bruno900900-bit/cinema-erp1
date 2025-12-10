# 🐘 Guia de Configuração PostgreSQL

Este guia explica como configurar e usar PostgreSQL no projeto Cinema ERP.

## 📋 Pré-requisitos

1. **PostgreSQL instalado** (versão 12 ou superior)
2. **Python 3.8+** com pip
3. **Dependências do projeto** instaladas

## 🚀 Configuração Inicial

### 1. Instalar Dependências PostgreSQL

```bash
# No diretório backend/
py -m pip install psycopg2-binary
```

### 2. Configurar PostgreSQL (Método Automático)

Execute o script de configuração:

```bash
# No diretório backend/
py fix_encoding_and_setup.py
```

Este script irá:

- ✅ Configurar codificação UTF-8
- 📁 Criar arquivo .env com configuração PostgreSQL
- 📄 Criar script SQL para configuração manual
- 🚀 Tentar abrir pgAdmin automaticamente

### 3. Configuração Manual no pgAdmin

1. **Abra o pgAdmin** (se não abriu automaticamente)
2. **Conecte ao servidor PostgreSQL** (geralmente localhost:5432)
3. **Execute o script SQL** `setup_postgres_manual.sql` ou os comandos:

```sql
CREATE USER cinema_erp WITH PASSWORD 'cinema_erp_password_123';
CREATE DATABASE cinema_erp OWNER cinema_erp;
GRANT ALL PRIVILEGES ON DATABASE cinema_erp TO cinema_erp;
```

### 4. Finalizar Configuração

```bash
# No diretório backend/
py finalize_postgres_setup.py
```

Este script irá:

- ✅ Verificar conexão com PostgreSQL
- 🏗️ Criar todas as tabelas
- 📊 Criar índices otimizados
- 🔧 Instalar extensões PostgreSQL

### 3. Migrar Dados do SQLite (Opcional)

Se você já tem dados no SQLite e quer migrá-los:

```bash
# No diretório backend/
python migrate_to_postgres.py
```

Este script irá:

- 💾 Criar backup do SQLite
- 📖 Extrair todos os dados
- 💾 Inserir dados no PostgreSQL

### 4. Ativar PostgreSQL

Copie o arquivo de configuração:

```bash
# No diretório backend/
copy env.postgres .env
```

## 🔧 Configuração Manual

Se preferir configurar manualmente:

### 1. Criar Usuário e Banco

```sql
-- Conectar como superuser (postgres)
CREATE USER cinema_erp WITH PASSWORD 'cinema_erp_password_123';
CREATE DATABASE cinema_erp OWNER cinema_erp;
GRANT ALL PRIVILEGES ON DATABASE cinema_erp TO cinema_erp;
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` com:

```env
# Configurações do Banco de Dados PostgreSQL
POSTGRES_USER=cinema_erp
POSTGRES_PASSWORD=cinema_erp_password_123
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=cinema_erp

# Outras configurações...
DEBUG=true
ENVIRONMENT=development
SECRET_KEY=dev_secret_key_change_in_production_12345
```

## 🏃‍♂️ Executando a Aplicação

### Iniciar o Servidor

```bash
# No diretório backend/
python run_server.py
```

### Verificar Status

Acesse: http://localhost:8000/docs

## 🔍 Verificações

### 1. Testar Conexão

```python
# Teste rápido
python -c "
from app.core.database_postgres import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT version()'))
    print('PostgreSQL:', result.fetchone()[0])
"
```

### 2. Verificar Tabelas

```python
# Listar tabelas
python -c "
from app.core.database_postgres import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text(\"SELECT tablename FROM pg_tables WHERE schemaname='public'\"))
    print('Tabelas:', [row[0] for row in result])
"
```

## 🛠️ Comandos Úteis

### Resetar Banco

```bash
# Remover e recriar banco
python setup_postgres.py
```

### Backup

```bash
# Backup manual
pg_dump -h localhost -U cinema_erp -d cinema_erp > backup.sql
```

### Restaurar

```bash
# Restaurar backup
psql -h localhost -U cinema_erp -d cinema_erp < backup.sql
```

## 🐛 Solução de Problemas

### Erro de Conexão

```
❌ Erro ao conectar com PostgreSQL: connection refused
```

**Soluções:**

1. Verificar se PostgreSQL está rodando
2. Verificar porta (padrão: 5432)
3. Verificar credenciais no `.env`

### Erro de Permissão

```
❌ permission denied for database cinema_erp
```

**Soluções:**

1. Verificar se usuário tem privilégios
2. Executar como superuser (postgres)

### Erro de Extensão

```
❌ extension "postgis" does not exist
```

**Soluções:**

1. Instalar PostGIS: `CREATE EXTENSION postgis;`
2. Ou remover extensões desnecessárias do código

## 📊 Extensões PostgreSQL

O projeto usa as seguintes extensões:

- **PostGIS**: Para dados geográficos
- **pg_trgm**: Para busca fuzzy
- **unaccent**: Para busca sem acentos
- **uuid-ossp**: Para geração de UUIDs

## 🔒 Segurança

### Produção

Para produção, altere:

```env
POSTGRES_PASSWORD=senha_super_segura_aqui
SECRET_KEY=chave_secreta_muito_longa_e_aleatoria
DEBUG=false
ENVIRONMENT=production
```

### Firewall

Configure firewall para permitir apenas conexões locais:

```bash
# No postgresql.conf
listen_addresses = 'localhost'
```

## 📈 Performance

### Índices

O projeto cria automaticamente índices otimizados para:

- Busca textual (GIN)
- Filtros comuns
- Relacionamentos
- Datas

### Pool de Conexões

Configurado para:

- Pool size: 20
- Max overflow: 30
- Pool recycle: 3600s

## 🔄 Migração de Dados

### SQLite → PostgreSQL

```bash
python migrate_to_postgres.py
```

### PostgreSQL → SQLite

Não recomendado, mas possível com scripts customizados.

## 📝 Logs

Logs do PostgreSQL em:

- Windows: `C:\Program Files\PostgreSQL\[version]\data\log\`
- Linux: `/var/log/postgresql/`

## 🆘 Suporte

Se encontrar problemas:

1. Verificar logs do PostgreSQL
2. Verificar logs da aplicação
3. Testar conexão manual
4. Verificar configurações de firewall

---

**✅ Pronto!** Seu Cinema ERP agora está rodando com PostgreSQL!
