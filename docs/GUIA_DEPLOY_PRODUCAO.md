# 🚀 Guia Rápido de Deploy para Produção

## ✅ Status Atual do Ambiente

Verificações realizadas:

- ✅ Google Cloud SDK instalado (versão 538.0.0)
- ✅ Projeto configurado: `palaoro-production`
- ✅ APIs habilitadas:
  - Cloud Run
  - Artifact Registry
  - Cloud Build
- ✅ Repositório Artifact Registry: `cinema-backend` criado
- ✅ Firebase CLI instalado (versão 14.16.0)

## 🎯 O que será feito no deploy

1. **Backend (FastAPI)**

   - Build da imagem Docker
   - Upload para Artifact Registry
   - Deploy no Cloud Run (região us-central1)
   - URL gerada automaticamente

2. **Frontend (React)**

   - Build otimizado de produção
   - Deploy no Firebase Hosting
   - CDN global automático
   - HTTPS habilitado

3. **Integração**
   - Roteamento `/api/**` → Cloud Run (backend)
   - Tudo acessível via: `https://palaoro-production.web.app`

## 📋 Comandos de Deploy

### Deploy Completo (Backend + Frontend)

```powershell
# Deploy completo
.\deploy_cloudrun_hosting.ps1 -ProjectId palaoro-production
```

**Tempo estimado:** 5-10 minutos

### Deploy Apenas Frontend

```powershell
# Útil para atualizações rápidas do frontend
.\deploy_cloudrun_hosting.ps1 -SkipBuild -SkipCloudRun
```

**Tempo estimado:** 2-3 minutos

### Deploy com Playwright (PDF servidor)

```powershell
# Habilita geração de PDFs reais via Chromium
.\deploy_cloudrun_hosting.ps1 -EnablePlaywright
```

### Modo Staging (teste sem afetar produção)

```powershell
# Deploy em canal separado para testes
.\deploy_cloudrun_hosting.ps1 -Staging
```

### Dry Run (ver comandos sem executar)

```powershell
# Visualizar o que será feito
.\deploy_cloudrun_hosting.ps1 -DryRun
```

## 🔍 Verificação Pós-Deploy

Após o deploy, teste:

1. **Frontend:** https://palaoro-production.web.app
2. **API Health:** https://palaoro-production.web.app/api/v1/health
3. **API Docs:** https://palaoro-production.web.app/api/v1/docs

## 🔐 Variáveis de Ambiente (Opcional)

Para configurar variáveis sensíveis no backend:

```powershell
gcloud run deploy cinema-backend `
  --project palaoro-production `
  --region us-central1 `
  --image us-central1-docker.pkg.dev/palaoro-production/cinema-backend/backend:latest `
  --set-env-vars "DATABASE_URL=postgres://...,SECRET_KEY=...,OPENAI_API_KEY=..."
```

Variáveis recomendadas:

- `DATABASE_URL` - Conexão PostgreSQL (se usar Cloud SQL)
- `SECRET_KEY` - Chave para JWT
- `OPENAI_API_KEY` - Para enriquecimento IA (opcional)
- `PLAYWRIGHT_ENABLED=1` - Para PDF real (opcional)
- `API_KEY` - Chave de autenticação da API (opcional)

## 📊 Monitoramento

### Cloud Run:

- Console: https://console.cloud.google.com/run?project=palaoro-production
- Logs: Cloud Logging
- Métricas: Latência, requests/s, erros

### Firebase Hosting:

- Console: https://console.firebase.google.com/project/palaoro-production/hosting
- Analytics: Visualizações, performance

## 🔄 Rollback (se necessário)

```powershell
# Listar revisões anteriores
gcloud run revisions list --service cinema-backend --region us-central1 --project palaoro-production

# Reverter para revisão específica
gcloud run services update-traffic cinema-backend --to-revisions REVISAO=100 --region us-central1 --project palaoro-production
```

## 💰 Custos Estimados

**Cloud Run (Backend):**

- Tier gratuito: 2 milhões de requests/mês
- Após: ~$0.40 por milhão de requests
- Cold start: grátis
- Instâncias mínimas: 0 (sem custo quando não usado)

**Firebase Hosting (Frontend):**

- 10 GB armazenamento gratuito
- 360 MB/dia transferência gratuita
- Após: ~$0.026/GB

**Artifact Registry:**

- 0.5 GB gratuito
- Após: ~$0.10/GB/mês

**Estimativa total (uso baixo-médio):** $0-20/mês

## 🚨 Checklist Pré-Deploy

Antes de fazer deploy em produção:

- [ ] Código testado localmente
- [ ] Variáveis de ambiente sensíveis configuradas
- [ ] Backup do banco de dados (se aplicável)
- [ ] DNS configurado (se usar domínio próprio)
- [ ] Firewall/CORS configurados corretamente
- [ ] SSL/HTTPS verificado
- [ ] Logs e monitoramento configurados

## 📞 Suporte

**Documentação oficial:**

- Cloud Run: https://cloud.google.com/run/docs
- Firebase Hosting: https://firebase.google.com/docs/hosting

**Logs e Debug:**

```powershell
# Ver logs do Cloud Run
gcloud run logs read cinema-backend --region us-central1 --project palaoro-production --limit 50

# Ver logs do Firebase
firebase hosting:logs
```

## 🎉 Próximos Passos

Após o primeiro deploy:

1. **Configurar domínio personalizado** (opcional)

   - Firebase Hosting > Domínio Personalizado
   - Adicionar registros DNS

2. **Configurar CI/CD** (opcional)

   - GitHub Actions
   - Cloud Build Triggers
   - Deploy automático em push

3. **Habilitar monitoramento**

   - Error Reporting
   - Cloud Monitoring
   - Alertas de latência/erros

4. **Otimizações**
   - CDN para assets estáticos
   - Cache de API
   - Compressão

---

**Desenvolvido com ❤️ para a indústria cinematográfica brasileira**









