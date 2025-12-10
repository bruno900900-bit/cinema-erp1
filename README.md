# 🎬 **Cinema ERP - Sistema de Gestão de Locações**

Sistema completo para gestão de projetos, locações e agenda de visitas para cinema e publicidade, desenvolvido com FastAPI, React e PostgreSQL.

## ✨ **Funcionalidades Principais**

### **1. Dashboard Inteligente**

- Métricas em tempo real
- Gráficos de receita mensal
- Lista de visitas recentes
- Top locações por performance
- Resumo de projetos ativos

### **2. Busca Avançada de Locações**

- Filtros por setor, preço, capacidade
- Busca geográfica com PostGIS
- Filtros por tags e status
- Paginação e ordenação
- Facetas para análise

### **3. Sistema de Agendamento**

- Calendário interativo (FullCalendar)
- Drag & drop de eventos
- Visualização mensal/semanal/diária
- Gestão de status de visitas
- Notificações de agendamento

### **4. Gestão de Projetos**

- CRUD completo de projetos
- Controle de status e progresso
- Atribuição de responsáveis
- Sistema de tags
- Orçamentos e prazos
- Visualização em cards ou lista

### **5. Gestão de Usuários**

- Autenticação JWT
- Controle de permissões
- Perfis personalizáveis
- Histórico de atividades

### **6. Exportação de Apresentações PowerPoint** 🆕

- **Seleção inteligente** de locações
- **Drag & drop** para reordenação
- **Templates personalizáveis** (Padrão, Corporativo, Criativo, Minimalista)
- **Slides automáticos** com informações completas
- **Fotos das locações** incluídas automaticamente
- **Slide de resumo** com estatísticas agregadas
- **Download direto** em formato PPTX
- **Preparado para Google Slides** (futuro)

## 🗄️ Estrutura do Banco

### **Tabelas Principais**

- **users**: Usuários do sistema
- **locations**: Locações disponíveis
- **projects**: Projetos e campanhas
- **visits**: Agendamento de visitas
- **contracts**: Contratos e acordos
- **tags**: Sistema de categorização
- **audit_log**: Log de auditoria

### **Relacionamentos**

- Usuários podem ter múltiplos projetos
- Locações podem ter múltiplas visitas
- Projetos podem ter múltiplas tags
- Sistema de auditoria para todas as operações

## 🔒 Segurança

- **Autenticação JWT** com refresh tokens
- **Validação de dados** com Pydantic
- **Sanitização de inputs** SQL
- **Logs de auditoria** para todas as operações
- **Rate limiting** para APIs
- **Headers de segurança** configurados

## ⚡ Performance

- **Cache Redis** para sessões e dados frequentes
- **Índices otimizados** no PostgreSQL
- **Lazy loading** de componentes React
- **Code splitting** automático
- **Compressão gzip** habilitada
- **CDN** para assets estáticos

## 🚀 Como iniciar localmente

1. **Windows:** execute `INICIAR_SEM_DOCKER.bat` (cria ambiente virtual, instala dependências, prepara banco SQLite e inicia backend/frontend automaticamente).
2. **Linux/macOS:** rode `./start-dev.sh` com permissões de execução (`chmod +x start-dev.sh`).
3. Acesse `http://localhost:5173` (frontend) e `http://localhost:8000/docs` (API).
4. **Login padrão:** `admin@cinema.com` / `admin123`.
5. O `.env` é preenchido automaticamente para usar PostgreSQL local (`postgres` / senha `0876`).

> Prefere fazer manualmente? Siga o guia `GUIA_INICIO_RAPIDO.md` para os comandos detalhados.

## 🧪 Testes

### Backend (FastAPI)

```powershell
# Primeira execução (cria venv dedicado e instala dependências mínimas)
./testar_backend.ps1 -InstalarDependencias

# Execuções seguintes (já com ambiente pronto)
./testar_backend.ps1
```

### Frontend (React)

```bash
cd frontend
npm install
npm run lint
npm run typecheck
```

## 🚀 Deploy

### **Desenvolvimento**

```bash
docker-compose up -d
```

### **Produção**

```bash
# Build das imagens
make docker-build

# Deploy
make deploy
```

### **Deploy Cloud Run + Firebase Hosting (Unificado)**

Para publicar backend (Cloud Run) e frontend (Firebase Hosting) com rewrites para `/api/**`:

```powershell
./deploy_cloudrun_hosting.ps1 -ProjectId palaoro-production -EnablePlaywright
```

Opções principais:

- `-SkipBuild` ou `-SkipCloudRun` para apenas atualizar frontend
- `-SkipHosting` para apenas backend
- `-DryRun` para visualizar comandos

Documentação detalhada: ver `DEPLOY_CLOUD_RUN_HOSTING.md`.

Variáveis ambiente backend: ver `backend/.env.example`.

## 📊 Monitoramento

- **Health checks** para todos os serviços
- **Logs estruturados** com timestamps
- **Métricas de performance** do banco
- **Alertas** para falhas críticas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### **Padrões de Código**

- **Backend**: Black para formatação Python
- **Frontend**: ESLint + Prettier
- **Commits**: Conventional Commits
- **Documentação**: Docstrings em português

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

- **Issues**: GitHub Issues
- **Documentação**: README e comentários no código
- **Email**: suporte@cinema-erp.com

---

**Desenvolvido com ❤️ para a indústria cinematográfica brasileira**
