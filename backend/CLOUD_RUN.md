# Deploy do Backend no Cloud Run

Este guia publica o backend FastAPI no Cloud Run e integra com o Firebase Hosting.

## Pré-requisitos

- gcloud CLI instalado e autenticado (`gcloud auth login`).
- Projeto GCP com faturamento habilitado.
- APIs: Cloud Run, Cloud Build, Artifact/Container Registry.
- Conta de serviço do Cloud Run com permissões de acesso ao Firestore/Storage (roles: `Datastore User`, `Storage Object Admin` ou conforme mínima necessidade).

## Dockerfile

O `Dockerfile` já está configurado para Cloud Run:

- Respeita a variável `PORT` (8080 por padrão).
- Executa `uvicorn app.main:app` sem reload.

## Build e Deploy (PowerShell)

No diretório `backend/`:

```powershell
# Execute com seu PROJECT_ID e REGION
# Exemplo REGION: us-central1
./deploy_cloud_run.ps1 -PROJECT_ID "SEU_PROJECT_ID" -REGION "SUA_REGION" -SERVICE_NAME "cinema-erp-api"
```

O script:

- Ativa as APIs necessárias
- Faz build com Cloud Build (a partir do Dockerfile)
- Faz deploy no Cloud Run
- Define env vars essenciais (DATABASE_TYPE=firebase, FIREBASE_PROJECT_ID=...)

## Variáveis de ambiente

- DATABASE_TYPE=firebase
- FIREBASE_PROJECT_ID=seu-projeto (opcional se usar service account; o código tenta inferir)
- FIREBASE_STORAGE_BUCKET (opcional; inferido como `<project>.appspot.com` se ausente)

### Novas (upload de fotos)

- ENABLE_FIREBASE_PHOTO_STORAGE=true (ativa upload direto para Firebase Storage ao invés de filesystem local)
- FIREBASE_PUBLIC_PHOTOS=true (torna blobs públicos automaticamente; desative para acesso controlado)
- CLOUD_RUN=1 (força uso de `/tmp/uploads` para qualquer fallback local)
- LOCAL_UPLOAD_BASE=uploads (override apenas em dev se quiser trocar a raiz local)

Quando `ENABLE_FIREBASE_PHOTO_STORAGE` está ativo:

1. Os arquivos são enviados para `gs://<bucket>/locations/<id>/<uuid>.ext`.
2. Se `FIREBASE_PUBLIC_PHOTOS=true`, a URL pública (`https://storage.googleapis.com/...`) é retornada em `url`.
3. Miniaturas só são geradas em fallback local (não otimizadas no Storage ainda).
4. Futuro: implementar geração de thumbnail no Storage via Cloud Function ou processamento local temporário.

Se você preferir usar ADC (Application Default Credentials) no Cloud Run, anexe um service account com as permissões adequadas ao serviço e suba o arquivo no Secret Manager se necessário (não recomendado embutir chave JSON no container).

## Conectando Hosting -> API

No `firebase.json` (na raiz), já há um rewrite de exemplo:

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

Troque `serviceId` e `region` pelos do seu serviço Cloud Run. Depois execute:

```powershell
firebase deploy --only hosting
```

## Teste rápido

- Após o deploy, abra `https://SEU_DOMINIO/health` e `https://SEU_DOMINIO/health/firebase` para validar.
- Verifique se endpoints `/api/v1/...` respondem via Hosting.

## Problemas comuns

- 404 em /api: rewrite não aponta para o serviceId/region corretos.
- 403 no Firestore/Storage: service account do Cloud Run sem permissão.
- Timeout 502: container não está ouvindo em `PORT` (use 8080) ou cold start alto sem minScale.
