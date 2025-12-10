# 🎬 Cinema ERP - Como Usar

## 🚀 Início Rápido

### 1. **Instalar Dependências**
```bash
pip install -r requirements.txt
```

### 2. **Executar a Aplicação**
```bash
# Opção 1: Script automático (recomendado)
python run_app.py

# Opção 2: Apenas configurar banco
python run_app.py --setup-only

# Opção 3: Executar manualmente
python scripts/seed_data.py
uvicorn app.main:app --reload
```

### 3. **Acessar a Aplicação**
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📋 Funcionalidades Implementadas

### ✅ **Agenda de Visitas Completa**
- ✅ Modelos de dados (Visit, VisitParticipant)
- ✅ Schemas de validação
- ✅ Serviços de negócio
- ✅ Endpoints da API
- ✅ Filtros avançados
- ✅ Gerenciamento de participantes
- ✅ Check-in/check-out
- ✅ Controle de etapas e status

### ✅ **Integração com Projetos e Locações**
- ✅ Relacionamentos entre visitas, projetos e locações
- ✅ Validações de integridade referencial
- ✅ Filtros por projeto e locação

### ✅ **Sistema de Usuários**
- ✅ Modelo de usuários
- ✅ Relacionamentos com visitas
- ✅ Controle de participações

## 🎯 Principais Endpoints

### **Visitas**
```
POST   /api/v1/visits                              # Criar visita
GET    /api/v1/visits                              # Listar com filtros
GET    /api/v1/visits/{id}                         # Obter específica
PATCH  /api/v1/visits/{id}                         # Atualizar
DELETE /api/v1/visits/{id}                         # Cancelar
PATCH  /api/v1/visits/{id}/complete                # Concluir
```

### **Participantes**
```
POST   /api/v1/visits/{id}/participants            # Adicionar participante
PATCH  /api/v1/visits/{id}/participants/{user_id}  # Atualizar participante
DELETE /api/v1/visits/{id}/participants/{user_id}  # Remover participante
POST   /api/v1/visits/{id}/participants/{user_id}/check-in   # Check-in
POST   /api/v1/visits/{id}/participants/{user_id}/check-out  # Check-out
```

### **Outros Recursos**
```
GET /api/v1/projects    # Listar projetos
GET /api/v1/locations   # Listar locações
GET /api/v1/users       # Listar usuários
```

## 🔍 Filtros Avançados

### **Por URL (Query Params)**
```
GET /api/v1/visits?date_from=2025-01-01&date_to=2025-01-31&etapas=visita_tecnica&status=scheduled
```

### **Filtros Disponíveis:**
- `date_from` / `date_to`: Intervalo de datas
- `project_ids`: IDs de projetos (separados por vírgula)
- `location_ids`: IDs de locações (separados por vírgula)
- `user_ids`: IDs de usuários (separados por vírgula)
- `etapas`: Etapas (separadas por vírgula)
- `status`: Status (separados por vírgula)

## 📊 Exemplos Práticos

### **Criar Visita**
```bash
curl -X POST "http://localhost:8000/api/v1/visits" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Visita técnica - Estúdio São Paulo",
    "description": "Avaliar equipamentos",
    "etapa": "visita_tecnica",
    "start_datetime": "2025-01-20T10:00:00",
    "end_datetime": "2025-01-20T12:00:00",
    "project_id": 1,
    "location_id": 1,
    "participants": [
      {"user_id": 1, "role": "Responsável"}
    ]
  }'
```

### **Listar Visitas do Mês**
```bash
curl "http://localhost:8000/api/v1/visits?date_from=2025-01-01&date_to=2025-01-31"
```

### **Buscar Visitas por Projeto**
```bash
curl "http://localhost:8000/api/v1/visits?project_ids=1,2"
```

## 🧪 Testar a API

### **Script de Testes Interativo**
```bash
python examples/api_examples.py
```

Este script permite:
- ✅ Testar todos os endpoints
- ✅ Ver exemplos práticos
- ✅ Verificar respostas da API
- ✅ Executar cenários específicos

## 🗄️ Banco de Dados

### **SQLite Local**
- Arquivo: `cinema_erp.db`
- Localização: Raiz do projeto backend
- Acesso direto: Qualquer cliente SQLite

### **Estrutura das Tabelas**
1. **users** - Usuários do sistema
2. **projects** - Projetos de cinema/publicidade
3. **locations** - Locações disponíveis
4. **visits** - Agenda de visitas
5. **visit_participants** - Participantes das visitas

## 🔧 Resolução de Problemas

### **Erro: Módulo não encontrado**
```bash
# Certifique-se de estar no diretório backend
cd backend
python run_app.py
```

### **Erro: Banco de dados**
```bash
# Remover banco existente e recriar
rm cinema_erp.db
python run_app.py --setup-only
```

### **Erro: Porta em uso**
```bash
# Usar porta diferente
uvicorn app.main:app --port 8001
```

### **Erro: Dependências**
```bash
# Reinstalar dependências
pip install -r requirements.txt --force-reinstall
```

## 📱 Próximos Passos (Frontend)

### **Tecnologias Sugeridas**
- **React** ou **Vue.js** para interface
- **FullCalendar.js** para visualização de agenda
- **Axios** para comunicação com API
- **Material-UI** ou **Tailwind** para design

### **Componentes Prioritários**
1. **Calendário de Visitas** (mensal, semanal, diário)
2. **Formulário de Agendamento**
3. **Dashboard de Visitas**
4. **Filtros Avançados**
5. **Gestão de Participantes**

## 🎯 Funcionalidades Implementadas

### ✅ **Core da Agenda**
- [x] Criar visitas
- [x] Listar com filtros avançados
- [x] Atualizar visitas
- [x] Cancelar visitas
- [x] Concluir visitas
- [x] Gerenciar participantes
- [x] Check-in/check-out
- [x] Validações de dados
- [x] Relacionamentos com projetos/locações

### 🔄 **Próximas Funcionalidades**
- [ ] Notificações por email
- [ ] Integração com Google Calendar
- [ ] Dashboard de métricas
- [ ] Relatórios avançados
- [ ] Interface web (frontend)
- [ ] Aplicativo mobile

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação da API em `/docs`
2. Execute os scripts de teste
3. Verifique os logs do servidor
4. Consulte os exemplos práticos

---

**🎬 Cinema ERP - Transformando a gestão de locações para cinema e publicidade!**
