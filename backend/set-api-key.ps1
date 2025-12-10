param(
  [Parameter(Mandatory=$true)][string]$ApiKey,
  [string]$ProjectId = "palaoro-production",
  [string]$Service = "cinema-erp-api",
  [string]$Region = "us-central1"
)

$ErrorActionPreference = "Stop"

Write-Host "Atualizando variável API_KEY no serviço $Service" -ForegroundColor Cyan

# Obter env vars existentes
$existing = gcloud run services describe $Service --region $Region --project $ProjectId --format json |
  ConvertFrom-Json

$vars = @{}
if ($existing.spec.template.spec.containers[0].env) {
  foreach ($envVar in $existing.spec.template.spec.containers[0].env) {
    $vars[$envVar.name] = $envVar.value
  }
}

$vars["API_KEY"] = $ApiKey

# Montar string
$envString = ($vars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ","

Write-Host "Aplicando: $envString" -ForegroundColor Yellow

gcloud run services update $Service `
  --region $Region `
  --project $ProjectId `
  --set-env-vars $envString | Out-Null

Write-Host "API_KEY atualizada com sucesso." -ForegroundColor Green
