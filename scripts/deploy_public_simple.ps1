Write-Host "🚀 Iniciando deploy público para Firebase..." -ForegroundColor Cyan

# Build do frontend
Write-Host "🔨 Construindo o frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build
Set-Location ..

# Deploy das regras e frontend
Write-Host "📜 Fazendo deploy das regras e frontend..." -ForegroundColor Yellow
firebase deploy

Write-Host "✅ Deploy público concluído com sucesso!" -ForegroundColor Green
