param(
  [string]$ProjectId = "palaoro-production",
  [string]$Region = "us-central1"
)

Write-Host "=== Cinema ERP Deploy Cloud Run (Fast) ===" -ForegroundColor Cyan

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  Write-Host "gcloud CLI não encontrado" -ForegroundColor Red
  exit 1
}

Write-Host "Ativando projeto $ProjectId" -ForegroundColor Yellow
gcloud config set project $ProjectId | Out-Null

Write-Host "Construindo imagem Docker..." -ForegroundColor Yellow
gcloud builds submit --tag gcr.io/$ProjectId/cinema-erp-api ..\backend
if ($LASTEXITCODE -ne 0) { Write-Host "Falha build" -ForegroundColor Red; exit 1 }

Write-Host "Publicando serviço Cloud Run..." -ForegroundColor Yellow
gcloud run deploy cinema-erp-api `
  --image gcr.io/$ProjectId/cinema-erp-api `
  --region $Region `
  --allow-unauthenticated `
  --set-env-vars ENVIRONMENT=production,DATABASE_TYPE=firebase,FIREBASE_PROJECT_ID=$ProjectId,FIREBASE_STORAGE_BUCKET=$ProjectId.firebasestorage.app
if ($LASTEXITCODE -ne 0) { Write-Host "Falha deploy" -ForegroundColor Red; exit 1 }

Write-Host "Obtendo URL do serviço..." -ForegroundColor Yellow
$serviceUrl = gcloud run services describe cinema-erp-api --region $Region --format 'value(status.url)'
Write-Host "Service URL: $serviceUrl" -ForegroundColor Green

Write-Host "Testando /health..." -ForegroundColor Yellow
try {
  $resp = Invoke-RestMethod -Uri "$serviceUrl/health" -TimeoutSec 10
  Write-Host "Resposta health: $(ConvertTo-Json $resp)" -ForegroundColor Green
} catch {
  Write-Host "Falha ao chamar health" -ForegroundColor Red
}

Write-Host "Pronto. Configure rewrites no Hosting apontando para Cloud Run (já existe em firebase.json)." -ForegroundColor Cyan
