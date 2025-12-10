param(
    [string]$ProjectId = "cinema-erp",
    [switch]$SkipBuild = $false
)

Write-Host "🚀 Iniciando deploy público para Firebase..." -ForegroundColor Cyan

# Verifica se o Firebase CLI está instalado
if (!(Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Firebase CLI não encontrado. Por favor, instale com: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

# Verifica login no Firebase
firebase login --reauth

# Seleciona o projeto
firebase use $ProjectId

# Build e deploy do frontend
if (!$SkipBuild) {
    # Build do frontend
    Write-Host "🔨 Construindo o frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    npm run build
    Set-Location ..
}

# Deploy do Firestore e Storage Rules
Write-Host "📜 Fazendo deploy das regras do Firestore e Storage..." -ForegroundColor Yellow
firebase deploy --only firestore:rules,storage

# Deploy do Frontend
Write-Host "🌐 Fazendo deploy do frontend..." -ForegroundColor Yellow
firebase deploy --only hosting

Write-Host "✅ Deploy público concluído com sucesso!" -ForegroundColor Green
Write-Host "🌎 Seu site está disponível em: https://$ProjectId.web.app" -ForegroundColor Cyan
