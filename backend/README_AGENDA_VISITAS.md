# 🗓️ Agenda de Visitas - Cinema ERP

## 📋 Visão Geral

A funcionalidade de **Agenda de Visitas** permite gerenciar todas as visitas relacionadas a projetos e locações de cinema e publicidade. Cada visita é vinculada obrigatoriamente a um projeto e uma locação, com controle de participantes, etapas do processo e status.

## 🏗️ Arquitetura

### Modelos de Dados

#### **Visit (Visita)**
- **id**: Identificador único
- **title**: Título da visita (ex.: "Visita técnica - Estúdio São Paulo")
- **description**: Descrição detalhada
- **etapa**: Etapa do processo (prospeção, visita técnica, aprovação, negociação, contratação)
- **start_datetime**: Data/hora de início
- **end_datetime**: Data/hora de fim
- **status**: Status atual (agendada, concluída, cancelada)
- **project_id**: ID do projeto relacionado
- **location_id**: ID da locação relacionada
- **created_by**: ID do usuário que criou a visita

#### **VisitParticipant (Participante)**
- **id**: Identificador único
- **visit_id**: ID da visita
- **user_id**: ID do usuário participante
- **role**: Função na visita (ex.: "responsável", "apoio")
- **check_in_time**: Horário de chegada
- **check_out_time**: Horário de saída

### Enums

#### **VisitEtapa**
```python
PROSPECCAO = "prospeccao"        # Primeira visita para conhecer o local
VISITA_TECNICA = "visita_tecnica" # Avaliação técnica do local
APROVACAO = "aprovacao"          # Visita com cliente para aprovação
NEGOCIACAO = "negociacao"        # Reunião para discutir preços/condições
CONTRATACAO = "contratacao"      # Finalização do contrato
```

#### **VisitStatus**
```python
SCHEDULED = "scheduled"   # Visita agendada
COMPLETED = "completed"   # Visita concluída
CANCELLED = "cancelled"   # Visita cancelada
```

## 🚀 Endpoints da API

### **Visitas**

#### `POST /api/v1/visits`
Cria uma nova visita com participantes.

**Payload:**
```json
{
  "title": "Visita técnica - Estúdio São Paulo",
  "description": "Avaliar equipamentos e cenários disponíveis",
  "etapa": "visita_tecnica",
  "start_datetime": "2025-01-15T10:00:00",
  "end_datetime": "2025-01-15T12:00:00",
  "project_id": 1,
  "location_id": 1,
  "participants": [
    {
      "user_id": 1,
      "role": "Responsável"
    },
    {
      "user_id": 4,
      "role": "Apoio"
    }
  ]
}
```

#### `GET /api/v1/visits`
Lista visitas com filtros avançados.

**Parâmetros de Query:**
- `skip`: Número de registros para pular (paginação)
- `limit`: Número máximo de registros
- `date_from`: Data inicial (YYYY-MM-DD)
- `date_to`: Data final (YYYY-MM-DD)
- `project_ids`: IDs dos projetos separados por vírgula
- `location_ids`: IDs das locações separadas por vírgula
- `user_ids`: IDs dos usuários separados por vírgula
- `etapas`: Etapas separadas por vírgula
- `status`: Status separados por vírgula

**Exemplo:**
```
GET /api/v1/visits?date_from=2025-01-01&date_to=2025-01-31&etapas=visita_tecnica,aprovacao
```

#### `GET /api/v1/visits/{visit_id}`
Obtém detalhes de uma visita específica.

#### `PATCH /api/v1/visits/{visit_id}`
Atualiza uma visita existente.

#### `DELETE /api/v1/visits/{visit_id}`
Cancela uma visita (soft delete).

#### `PATCH /api/v1/visits/{visit_id}/complete`
Marca uma visita como concluída.

### **Participantes**

#### `POST /api/v1/visits/{visit_id}/participants`
Adiciona um participante a uma visita.

#### `PATCH /api/v1/visits/{visit_id}/participants/{user_id}`
Atualiza dados de um participante.

#### `DELETE /api/v1/visits/{visit_id}/participants/{user_id}`
Remove um participante de uma visita.

#### `POST /api/v1/visits/{visit_id}/participants/{user_id}/check-in`
Registra check-in de um participante.

#### `POST /api/v1/visits/{visit_id}/participants/{user_id}/check-out`
Registra check-out de um participante.

## 🔍 Filtros Avançados

### **Filtro por Data**
```json
{
  "date_range": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  }
}
```

### **Filtro por Projetos**
```json
{
  "project_ids": [1, 2, 3]
}
```

### **Filtro por Locações**
```json
{
  "location_ids": [10, 15, 20]
}
```

### **Filtro por Usuários (Participantes)**
```json
{
  "user_ids": [5, 8, 12]
}
```

### **Filtro por Etapas**
```json
{
  "etapas": ["visita_tecnica", "aprovacao"]
}
```

### **Filtro por Status**
```json
{
  "status": ["scheduled", "completed"]
}
```

### **Filtro Combinado**
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

## 📊 Casos de Uso

### **1. Agendamento de Visita**
1. Usuário seleciona projeto e locação
2. Define título, descrição e etapa
3. Define data/hora de início e fim
4. Adiciona participantes da equipe
5. Sistema cria evento na agenda

### **2. Visualização de Agenda**
1. **Visão Mensal**: Visão geral do mês
2. **Visão Semanal**: Detalhes da semana
3. **Visão Diária**: Agenda do dia
4. **Filtros**: Por projeto, locação, usuário, etapa, status

### **3. Gerenciamento de Visita**
1. **Editar**: Alterar detalhes da visita
2. **Cancelar**: Marcar como cancelada
3. **Concluir**: Marcar como concluída
4. **Check-in/out**: Registrar presença dos participantes

### **4. Relatórios**
1. **Visitas por Projeto**: Todas as visitas de um projeto específico
2. **Visitas por Locação**: Histórico de visitas em uma locação
3. **Visitas por Usuário**: Agenda pessoal de cada membro da equipe
4. **Visitas por Etapa**: Análise do progresso dos projetos

## 🔧 Configuração

### **1. Instalar Dependências**
```bash
pip install -r requirements.txt
```

### **2. Executar Script de Seed**
```bash
python scripts/seed_data.py
```

### **3. Iniciar Aplicação**
```bash
uvicorn app.main:app --reload
```

### **4. Acessar Documentação**
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📱 Frontend (Futuro)

### **Componentes Planejados**
1. **Calendário FullCalendar.js**
   - Visão mensal, semanal e diária
   - Drag & drop para reagendamento
   - Cores por etapa/status

2. **Formulário de Visita**
   - Seleção de projeto e locação
   - Seletor de data/hora
   - Adição de participantes
   - Validações em tempo real

3. **Dashboard de Visitas**
   - Resumo do dia/semana
   - Próximas visitas
   - Visitas pendentes
   - Estatísticas por etapa

4. **Integração com Calendários**
   - Google Calendar
   - Outlook
   - iCal export

## 🚨 Validações

### **Datas**
- `end_datetime` deve ser posterior a `start_datetime`
- Não permitir visitas no passado (opcional)

### **Participantes**
- Usuário deve existir no sistema
- Não permitir duplicatas de participantes
- Mínimo de 1 participante por visita

### **Projeto e Locação**
- Ambos devem existir no sistema
- Projeto deve estar ativo
- Locação deve estar ativa

## 🔮 Funcionalidades Futuras

### **Notificações**
- E-mail para participantes
- Notificações push no sistema
- Lembretes automáticos

### **Integração Externa**
- Google Calendar API
- Outlook Calendar API
- Webhooks para sincronização

### **Relatórios Avançados**
- Métricas de produtividade
- Análise de tempo por etapa
- ROI por projeto

### **Mobile App**
- Aplicativo nativo iOS/Android
- Sincronização offline
- GPS para check-in automático

## 📝 Exemplos de Uso

### **Exemplo 1: Visita de Prospecção**
```json
POST /api/v1/visits
{
  "title": "Prospecção - Fazenda Boa Vista",
  "description": "Primeira visita para conhecer o local",
  "etapa": "prospeccao",
  "start_datetime": "2025-01-20T14:00:00",
  "end_datetime": "2025-01-20T16:00:00",
  "project_id": 2,
  "location_id": 2,
  "participants": [
    {"user_id": 2, "role": "Responsável"},
    {"user_id": 3, "role": "Apoio"}
  ]
}
```

### **Exemplo 2: Visita Técnica**
```json
POST /api/v1/visits
{
  "title": "Visita técnica - Estúdio São Paulo",
  "description": "Avaliar equipamentos e cenários",
  "etapa": "visita_tecnica",
  "start_datetime": "2025-01-22T10:00:00",
  "end_datetime": "2025-01-22T12:00:00",
  "project_id": 1,
  "location_id": 1,
  "participants": [
    {"user_id": 1, "role": "Responsável"},
    {"user_id": 4, "role": "Técnico"}
  ]
}
```

## 🎯 Benefícios

1. **Organização**: Agenda centralizada para toda a equipe
2. **Rastreabilidade**: Histórico completo de visitas por projeto
3. **Eficiência**: Redução de conflitos de agenda
4. **Relatórios**: Insights sobre progresso dos projetos
5. **Integração**: Conexão com projetos e locações existentes

---

**🎬 Cinema ERP - Transformando a gestão de locações para cinema e publicidade!**
