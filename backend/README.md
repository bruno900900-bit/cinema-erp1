# Cinema ERP - Backend

Sistema de gestão de locações para cinema e publicidade com agenda de visitas integrada.

## Funcionalidades

### 🎬 Gestão de Projetos
- Criação, edição e arquivamento de projetos
- Controle de status (ativo, arquivado, concluído)
- Gestão de orçamentos e clientes

### 🏢 Gestão de Locações
- Cadastro completo de locações com informações técnicas
- Contatos e informações de preços
- Status ativo/inativo

### 📅 Agenda de Visitas
- Agendamento de visitas vinculadas a projetos e locações
- Controle de etapas (prospecção, visita técnica, aprovação, negociação, contratação)
- Gestão de participantes com check-in/check-out
- Filtros avançados por data, projeto, locação, usuário, etapa e status

## Tecnologias

- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy** - ORM para banco de dados
- **Pydantic** - Validação de dados
- **SQLite** - Banco de dados (desenvolvimento)
- **Alembic** - Migrações de banco de dados

## Instalação

1. **Instalar dependências:**
```bash
pip install -r requirements.txt
```

2. **Executar a aplicação:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. **Acessar documentação:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Estrutura do Projeto

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/
│   │           ├── visits.py      # Endpoints de visitas
│   │           ├── projects.py    # Endpoints de projetos
│   │           ├── locations.py   # Endpoints de locações
│   │           └── users.py       # Endpoints de usuários
│   ├── core/
│   │   └── database.py           # Configuração do banco
│   ├── models/                   # Modelos SQLAlchemy
│   ├── schemas/                  # Schemas Pydantic
│   ├── services/                 # Lógica de negócio
│   └── main.py                   # Aplicação principal
├── requirements.txt
└── README.md
```

## API Endpoints

### Visitas (`/api/v1/visits`)
- `POST /` - Criar visita
- `GET /` - Listar visitas com filtros
- `GET /{id}` - Obter visita específica
- `PATCH /{id}` - Atualizar visita
- `DELETE /{id}` - Cancelar visita
- `PATCH /{id}/complete` - Marcar como concluída

### Participantes (`/api/v1/visits/{id}/participants`)
- `POST /` - Adicionar participante
- `PATCH /{user_id}` - Atualizar participante
- `DELETE /{user_id}` - Remover participante
- `POST /{user_id}/check-in` - Check-in
- `POST /{user_id}/check-out` - Check-out

### Projetos (`/api/v1/projects`)
- `POST /` - Criar projeto
- `GET /` - Listar projetos
- `GET /{id}` - Obter projeto específico
- `PATCH /{id}` - Atualizar projeto
- `DELETE /{id}` - Remover projeto

### Locações (`/api/v1/locations`)
- `POST /` - Criar locação
- `GET /` - Listar locações
- `GET /{id}` - Obter locação específica
- `PATCH /{id}` - Atualizar locação
- `DELETE /{id}` - Remover locação

### Usuários (`/api/v1/users`)
- `POST /` - Criar usuário
- `GET /` - Listar usuários
- `GET /{id}` - Obter usuário específico
- `PATCH /{id}` - Atualizar usuário
- `DELETE /{id}` - Remover usuário

## Filtros de Visitas

A API suporta filtros avançados para busca de visitas:

```json
{
  "date_range": {"from": "2025-01-01", "to": "2025-01-31"},
  "project_ids": [1, 2],
  "location_ids": [10, 15],
  "user_ids": [5],
  "etapas": ["visita_tecnica"],
  "status": ["scheduled"]
}
```

## Modelo de Dados

### Visita
- **id**: Identificador único
- **title**: Título da visita
- **description**: Descrição opcional
- **etapa**: Enum (prospeccao, visita_tecnica, aprovacao, negociacao, contratacao)
- **start_datetime**: Data/hora de início
- **end_datetime**: Data/hora de fim
- **status**: Enum (scheduled, completed, cancelled)
- **project_id**: Referência ao projeto
- **location_id**: Referência à locação
- **created_by**: Usuário que criou a visita

### Participante
- **visit_id**: Referência à visita
- **user_id**: Referência ao usuário
- **role**: Papel na visita (ex.: responsável, apoio)
- **check_in_time**: Horário de check-in
- **check_out_time**: Horário de check-out

## Desenvolvimento

### Banco de Dados
O sistema usa SQLite para desenvolvimento. As tabelas são criadas automaticamente na inicialização.

### Migrações
Para produção, use Alembic para gerenciar migrações de banco de dados.

### Testes
Execute os testes com:
```bash
pytest
```

## Próximos Passos

- [ ] Implementar autenticação JWT
- [ ] Adicionar validações de negócio
- [ ] Implementar notificações por e-mail
- [ ] Integração com Google Calendar/Outlook
- [ ] Sistema de permissões por usuário
- [ ] Logs de auditoria
- [ ] Cache Redis para performance
- [ ] Testes automatizados
- [ ] Docker para containerização

## Autenticação por API Key

Para ativar proteção simples via cabeçalho `X-API-Key`:
1. Defina a variável de ambiente `API_KEY` (local ou no Cloud Run).
2. Envie em cada requisição: `X-API-Key: <valor>`.

Atualizar no Cloud Run com script:
```powershell
cd backend
./set-api-key.ps1 -ApiKey "SUA_CHAVE_FORTE" -ProjectId palaoro-production -Service cinema-erp-api
```

Teste rápido:
```powershell
$URL="https://<SERVICE_URL>"
Invoke-WebRequest -UseBasicParsing -Uri "$URL/api/v1/health" -Headers @{"X-API-Key"="SUA_CHAVE_FORTE"}
```

## Endpoints Firebase (Consolidação)

Dois conjuntos existiam: `firebase_locations_fixed.py` (marcado como DEPRECATED) e `firebase_locations.py` (em uso principal com fotos + metadados). Recomenda-se migrar clientes para:
- Criar locação com fotos Firebase: `POST /api/v1/locations/firebase`
- Adicionar fotos: `POST /api/v1/locations/{id}/firebase-photos`
- Listar fotos: `GET /api/v1/locations/{id}/firebase-photos`

O arquivo deprecated será removido depois que não houver mais consumidores externos.
