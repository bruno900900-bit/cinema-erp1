# 🏗️ Nova Arquitetura - ERP Completo de Locações para Cinema

## 🎯 **Visão Geral da Expansão**

O sistema foi expandido de uma **Agenda de Visitas** para um **ERP completo** de locações para cinema e publicidade, incluindo todas as funcionalidades solicitadas:

- ✅ **Gestão completa de locações** com status, tipos e características
- ✅ **Sistema de fornecedores** com avaliações e contatos
- ✅ **Taxonomia de tags** organizadas por categoria
- ✅ **Upload e gestão de fotos** com metadados e ordenação
- ✅ **Busca avançada** com filtros complexos e facetas
- ✅ **Sistema de contratos** com templates e versões
- ✅ **Apresentações automáticas** baseadas em filtros
- ✅ **RBAC completo** com roles e permissões
- ✅ **Auditoria completa** de todas as ações
- ✅ **PostgreSQL + PostGIS** para geolocalização
- ✅ **Filtros salvos** reutilizáveis

## 🏗️ **Arquitetura de Dados Expandida**

### **Entidades Principais**

#### **1. Location (Locação) - Expandida**
```python
class Location(Base):
    # Informações básicas
    title, slug, summary, description
    
    # Status e relacionamentos
    status: LocationStatus (draft, prospecting, approved, etc.)
    project_id, supplier_id, responsible_user_id
    
    # Preços e características
    price_day, price_hour, currency
    space_type: SpaceType (studio, house, warehouse, etc.)
    capacity, area_size, power_specs
    
    # Geolocalização
    address_json, city, state, country, postal_code
    geo_point (PostGIS Point)
    
    # Busca e SEO
    search_vector (tsvector), meta_title, meta_description
```

#### **2. Supplier (Fornecedor) - Nova**
```python
class Supplier(Base):
    name, tax_id, email, phone, website
    address_json, notes, rating
    is_active
```

#### **3. Tag System (Sistema de Tags) - Novo**
```python
class Tag(Base):
    name, kind: TagKind (feature, style, lighting, etc.)
    description, color
    
class LocationTag(Base):
    location_id, tag_id (N:N)
```

#### **4. LocationPhoto (Fotos) - Nova**
```python
class LocationPhoto(Base):
    location_id, url, storage_key
    width, height, file_size, exif_json
    caption, sort_order, is_primary
```

#### **5. Contract System (Sistema de Contratos) - Novo**
```python
class Contract(Base):
    project_id, location_id, supplier_id
    status: ContractStatus (draft, generated, signed, etc.)
    version, pdf_url, custom_data
    
class ContractTemplate(Base):
    name, body_html, locale, variables_json
```

#### **6. Presentation System (Sistema de Apresentações) - Novo**
```python
class Presentation(Base):
    name, criteria_json, generated_by
    token, token_expires_at, password_hash
    theme, watermark_text, logo_url, pdf_url
    
class PresentationItem(Base):
    presentation_id, location_id, sort_order, note
```

#### **7. Saved Filters (Filtros Salvos) - Novo**
```python
class SavedFilter(Base):
    name, owner_user_id, scope (private, team, public)
    criteria_json, is_default, sort_order
```

#### **8. Audit System (Sistema de Auditoria) - Novo**
```python
class AuditLog(Base):
    actor_user_id, entity, entity_id
    action, before_json, after_json
    ip_address, user_agent, session_id
```

## 🔍 **Sistema de Busca Avançada**

### **Endpoint Principal**
```
POST /api/v1/locations/search
```

### **Filtros Disponíveis**
```json
{
  "q": "galpão silencioso",                    // Busca textual
  "project_ids": [1, 2],                      // Por projeto
  "supplier_ids": [10],                       // Por fornecedor
  "responsible_user_ids": [5],                // Por responsável
  "status": ["approved", "scheduled"],        // Por status
  "space_type": ["warehouse", "studio"],      // Por tipo de espaço
  "tags": {                                   // Por tags organizadas
    "feature": ["iluminação natural", "industrial"],
    "style": ["vintage", "moderno"]
  },
  "city": ["São Paulo"],                      // Por cidade
  "price_day": {"min": 500, "max": 5000},    // Por faixa de preço
  "capacity": {"min": 10, "max": 200},       // Por capacidade
  "geo": {                                    // Por localização geográfica
    "lat": -23.561, "lng": -46.656, "radius_km": 15
  },
  "sort": [                                   // Ordenação
    {"field": "score", "direction": "desc"},
    {"field": "price_day", "direction": "asc"}
  ],
  "page": 1, "page_size": 24,                // Paginação
  "facets": true,                             // Incluir facetas
  "include": ["photos", "supplier", "tags"]   // Relacionamentos
}
```

### **Facetas Automáticas**
- **Status**: Contagem por status
- **Tipo de Espaço**: Contagem por tipo
- **Cidade**: Top 20 cidades
- **Faixas de Preço**: Ranges pré-definidos
- **Tags**: Contagem por categoria

## 📊 **Performance e Otimização**

### **Índices PostgreSQL**
```sql
-- Busca textual com GIN
CREATE INDEX idx_locations_title_gin ON locations USING GIN (title gin_trgm_ops);
CREATE INDEX idx_locations_description_gin ON locations USING GIN (description gin_trgm_ops);

-- Filtros comuns
CREATE INDEX idx_locations_status ON locations (status);
CREATE INDEX idx_locations_space_type ON locations (space_type);
CREATE INDEX idx_locations_city ON locations (city);
CREATE INDEX idx_locations_price_day ON locations (price_day);

-- Relacionamentos
CREATE INDEX idx_locations_project_id ON locations (project_id);
CREATE INDEX idx_locations_supplier_id ON locations (supplier_id);
```

### **Extensões PostgreSQL**
- **PostGIS**: Geolocalização e consultas espaciais
- **pg_trgm**: Busca fuzzy com trigram
- **unaccent**: Busca sem acentos
- **uuid-ossp**: IDs únicos

## 🔐 **Sistema de Autenticação e Autorização**

### **Roles (Funções)**
```python
class UserRole(str, enum.Enum):
    ADMIN = "admin"           # Acesso total
    MANAGER = "manager"       # Gerencia projetos e equipes
    MEMBER = "member"         # Membro da equipe
    CLIENT = "client"         # Cliente externo (acesso limitado)
```

### **Controle de Acesso**
- **Locação**: Só pode ter responsável se vinculada a projeto
- **Filtros**: Escopo privado, equipe ou público
- **Apresentações**: Tokens com expiração e senha opcional
- **Auditoria**: Log de todas as ações

## 📱 **Funcionalidades de Frontend (Planejadas)**

### **1. Dashboard Principal**
- Resumo de locações por status
- Gráficos de preços e capacidades
- Últimas atividades e visitas
- Filtros rápidos

### **2. Gestão de Locações**
- Formulário completo com validações
- Upload múltiplo de fotos
- Sistema de tags com drag & drop
- Geolocalização com mapa

### **3. Busca Avançada**
- Interface de filtros visuais
- Facetas interativas
- Resultados em grid/lista
- Filtros salvos e compartilhados

### **4. Sistema de Contratos**
- Editor de templates HTML
- Preview em tempo real
- Geração automática de PDF
- Assinatura digital

### **5. Apresentações**
- Construtor visual de apresentações
- Temas e personalização
- Exportação para PDF
- Links públicos com token

## 🚀 **Como Usar a Nova Arquitetura**

### **1. Configuração do Banco**
```bash
# Para desenvolvimento (SQLite)
python run_app.py

# Para produção (PostgreSQL)
python -c "from app.core.database_postgres import initialize_database; initialize_database()"
```

### **2. Exemplo de Busca Avançada**
```python
from app.services.location_search_service import LocationSearchService

search_request = LocationSearchRequest(
    q="galpão industrial",
    status=["approved"],
    space_type=["warehouse"],
    price_day={"min": 1000, "max": 5000},
    city=["São Paulo"],
    include=["photos", "supplier", "tags"]
)

search_service = LocationSearchService(db)
results = search_service.search_locations(search_request)
```

### **3. Criação de Locação com Tags**
```python
# Criar tags primeiro
tag_feature = Tag(name="Iluminação Natural", kind=TagKind.FEATURE)
tag_style = Tag(name="Industrial", kind=TagKind.STYLE)

# Criar locação
location = Location(
    title="Galpão Industrial São Paulo",
    space_type=SpaceType.WAREHOUSE,
    capacity=100,
    price_day=2500.0
)

# Adicionar tags
location.location_tags = [
    LocationTag(tag=tag_feature),
    LocationTag(tag=tag_style)
]
```

## 🔮 **Próximos Passos**

### **Implementações Pendentes**
1. **Upload de Fotos**: Integração com S3/R2/MinIO
2. **Geração de PDFs**: Playwright/Puppeteer para contratos
3. **Notificações**: Sistema de email e push
4. **Integração Externa**: Google Calendar, Outlook
5. **Mobile App**: React Native ou Flutter

### **Melhorias de Performance**
1. **Cache Redis**: Para resultados de busca frequentes
2. **Background Jobs**: Celery para processamento assíncrono
3. **CDN**: Para fotos e arquivos estáticos
4. **Elasticsearch**: Para busca mais avançada (opcional)

## 📚 **Documentação da API**

### **Endpoints Principais**
- `POST /locations/search` - Busca avançada
- `POST /locations/{id}/photos` - Upload de fotos
- `POST /locations/{id}/tags` - Gerenciar tags
- `GET /locations/stats/overview` - Estatísticas
- `GET /locations/export/csv` - Exportação CSV
- `GET /locations/export/excel` - Exportação Excel

### **Novos Recursos**
- `POST /suppliers` - Criar fornecedor
- `POST /tags` - Criar tag
- `POST /contracts` - Criar contrato
- `POST /presentations` - Gerar apresentação
- `POST /saved-filters` - Salvar filtro

---

**🎬 Cinema ERP - Sistema completo de gestão de locações para cinema e publicidade!**
