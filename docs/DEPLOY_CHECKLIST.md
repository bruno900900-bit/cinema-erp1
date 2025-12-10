# ✅ Checklist de Deploy - Cinema ERP

Guia rápido e prático para publicar nova versão do sistema (Backend FastAPI + Frontend React + Firebase Hosting + Cloud Run).

---

## 1. Pré-Requisitos Locais

- gcloud CLI autenticado: `gcloud auth login`
- Firebase CLI autenticada: `firebase login`
- Projeto GCP definido: `gcloud config set project <PROJECT_ID>`
- Service Account com permissões: Cloud Run, Firestore, Storage.
- Python 3.11 + Node.js (versão compatível com o frontend)

---

## 2. Variáveis de Ambiente (Backend)

Definir (no Cloud Run ou Secret Manager):

- `DATABASE_TYPE` = `firebase` (ou `postgres` quando migrar)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET` (opcional; default `<project>.appspot.com`)
- `API_KEY` (chave privada para chamadas internas/frontend)
- `SECRET_KEY` (JWT – trocar em produção)
- `LOG_LEVEL` (ex: INFO)
- `ENVIRONMENT` = `production`
- (Opcional) `WORKERS` (ex: 4)

PostgreSQL (quando aplicável):

- `DATABASE_URL` ou componentes `POSTGRES_*`

Storage alternativo (futuro):

- `STORAGE_TYPE` = `local|s3|r2|minio`
- `STORAGE_BUCKET`, `STORAGE_ENDPOINT_URL`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`

---

## 3. Verificações Antes do Deploy

- [ ] Testes backend passam: `cd backend && pytest -q`
- [ ] Teste básico de locações (`test_locations_basic.py`) passa
- [ ] Teste de fornecedores (`test_suppliers.py`) passa
- [ ] OpenAPI atualizado ( opcional ): iniciar local e acessar `/openapi.json`
- [ ] Endpoints não implementados escondidos (501 não aparece no schema)
- [ ] `API_KEY` configurada no ambiente
- [ ] Frontend build local sem erros: `cd frontend && npm run build`

---

## 4. Build & Deploy Backend (Cloud Run)

### Script Automatizado

No diretório `backend/`:

```powershell
./deploy_cloud_run.ps1 -PROJECT_ID "<PROJECT_ID>" -REGION "us-central1" -SERVICE_NAME "cinema-erp-api"
```

### Manual (alternativa)

```powershell
# Build da imagem (Cloud Build)
gcloud builds submit --tag gcr.io/<PROJECT_ID>/cinema-erp-api:latest

# Deploy Cloud Run
gcloud run deploy cinema-erp-api `
  --image gcr.io/<PROJECT_ID>/cinema-erp-api:latest `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --set-env-vars DATABASE_TYPE=firebase,FIREBASE_PROJECT_ID=<PROJECT_ID>,API_KEY=<API_KEY>,ENVIRONMENT=production,LOG_LEVEL=INFO
```

---

## 5. Deploy Frontend (Firebase Hosting)

Atualize `firebase.json` rewrite se o `serviceId` ou `region` mudaram:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api/**",
        "run": { "serviceId": "cinema-erp-api", "region": "us-central1" }
      },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

Executar:

```powershell
firebase deploy --only hosting
```

---

## 6. Testes Pós-Deploy

Substitua `BASE_URL` pelo domínio do Hosting ou URL do Cloud Run.

```powershell
# Health
curl -s https://<BASE_URL>/health
curl -s https://<BASE_URL>/health/firebase

# Lista locações
curl -s -H "X-API-Key: <API_KEY>" https://<BASE_URL>/api/v1/locations?limit=5

# Criar locação simples
curl -s -X POST -H "Content-Type: application/json" -H "X-API-Key: <API_KEY>" \
  -d '{"title": "Locação Deploy Test"}' https://<BASE_URL>/api/v1/locations
```

Verificar:

- [ ] `200` em `/health`
- [ ] `/locations` retorna lista (mesmo vazia)
- [ ] POST cria locação e slug válido

---

## 7. Observabilidade / Logs

```powershell
gcloud run services describe cinema-erp-api --region us-central1

gcloud logs tail --project <PROJECT_ID> --region us-central1 --service cinema-erp-api
```

Checar erros iniciais, latência e cold starts.

---

## 8. Segurança

- [ ] `API_KEY` não exposta no código frontend (enviar via build secret ou config runtime)
- [ ] Revisar permissões da Service Account
- [ ] Regras do Firestore/Storage revisadas (`firestore.rules`, `storage.rules`)
- [ ] Considerar limitar CORS a domínios oficiais

---

## 9. Próximas Melhorias Futuras

- Migrar para Postgres gerenciado (Cloud SQL) + conexão privada
- Cache Redis (memorystore) para sessões / queries pesadas
- Rate limiting real (ex: Cloud Armor / FastAPI middleware dedicado)
- Migração Pydantic v1 validators -> v2 `field_validator`
- Ajustes de warnings SQLAlchemy 2.x
- Testes de carga (k6 / Locust)

---

## 10. Rollback Rápido

- Manter imagem anterior listando:

```powershell
gcloud artifacts docker images list gcr.io/<PROJECT_ID>/cinema-erp-api
```

- Fazer deploy explícito da tag anterior:

```powershell
gcloud run deploy cinema-erp-api --image gcr.io/<PROJECT_ID>/cinema-erp-api:<OLD_TAG> --region us-central1
```

---

## 11. Troubleshooting Comum

| Problema          | Causa Provável                | Ação                                        |
| ----------------- | ----------------------------- | ------------------------------------------- |
| 404 em /api       | rewrite incorreto             | Revisar `firebase.json`                     |
| 401 em endpoints  | `X-API-Key` faltando          | Adicionar header                            |
| 403 Firestore     | Service Account sem permissão | Ajustar roles                               |
| 502 / Timeout     | Porta errada ou cold start    | Confirmar `PORT`=8080 / configurar minScale |
| Fotos não salvam  | Bucket não configurado        | Definir `FIREBASE_STORAGE_BUCKET`           |
| Acentos quebrando | Client sem UTF-8              | Verificar headers response                  |

---

## 12. Confirmação Final

Marcar tudo antes de considerar deploy concluído. Salvar este checklist em PR de release.

✅ Pronto para produção!
