param(
    [string]$ProjectId = "palaoro-production",
    [string]$Region = "us-central1",
    [string]$Service = "cinema-erp-api",
    [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Deploy Cloud Run ($Service) ===" -ForegroundColor Cyan

# Verifica se Dockerfile existe
if (-not (Test-Path -Path "Dockerfile")) {
    Write-Error "Dockerfile não encontrado no diretório atual. Execute dentro de backend/."
}

$Image = "gcr.io/$ProjectId/${Service}:$ImageTag"

Write-Host "=> Construindo imagem: $Image" -ForegroundColor Yellow
& gcloud builds submit --tag $Image --project $ProjectId

Write-Host "=> Fazendo deploy para Cloud Run: $Service" -ForegroundColor Yellow
& gcloud run deploy $Service `
    --image $Image `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --project $ProjectId `
    --set-env-vars "DATABASE_TYPE=firestore,FIREBASE_PROJECT_ID=$ProjectId,ENVIRONMENT=production"

Write-Host "=> Obtendo URL do serviço" -ForegroundColor Yellow
$ServiceUrl = (& gcloud run services describe $Service --region $Region --project $ProjectId --format="value(status.url)")
Write-Host "URL: $ServiceUrl" -ForegroundColor Green

Write-Host "=> Teste de saúde" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -UseBasicParsing -Uri "$ServiceUrl/health" -TimeoutSec 20
    Write-Host "Status health: $($resp.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "Falha ao chamar /health" -ForegroundColor Red
}

Write-Host "=== Deploy concluído ===" -ForegroundColor Cyan
