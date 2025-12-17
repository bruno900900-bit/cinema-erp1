# Script de Deploy Simples - Cinema ERP (Supabase Version)

Write-Host "🚀 INICIANDO DEPLOY - CINEMA ERP (SUPABASE)" -ForegroundColor Green
Write-Host "============================================================"

$ErrorActionPreference = "Stop"

# 1. VERIFICAR DEPENDÊNCIAS
Write-Host "`n🔍 VERIFICANDO DEPENDÊNCIAS" -ForegroundColor Yellow

# Verificar Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python encontrado: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python não encontrado. Instale o Python 3.9+" -ForegroundColor Red
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale o Node.js 18+" -ForegroundColor Red
    exit 1
}

# 2. CONFIGURAR BACKEND
Write-Host "`n🔧 CONFIGURANDO BACKEND" -ForegroundColor Yellow

if (-not (Test-Path "backend")) {
    Write-Host "❌ Diretório backend não encontrado" -ForegroundColor Red
    exit 1
}

Set-Location backend

# Verificar ambiente virtual
if (-not (Test-Path "venv")) {
    Write-Host "📦 Criando ambiente virtual..." -ForegroundColor Cyan
    python -m venv venv
    Write-Host "✅ Ambiente virtual criado" -ForegroundColor Green
}

# Instalar dependências
Write-Host "🔌 Instalando dependências do backend..." -ForegroundColor Cyan
try {
    & "venv\Scripts\Activate.ps1"
    pip install -q -r requirements.txt
    Write-Host "✅ Dependências do backend instaladas" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Aviso: Falha ao instalar algumas dependências. Verifique se o pip está atualizado." -ForegroundColor Yellow
}

# Verificar .env
if (-not (Test-Path ".env") -and (Test-Path "env.example")) {
    Copy-Item "env.example" ".env"
    Write-Host "✅ Arquivo .env criado a partir de env.example" -ForegroundColor Green
} elseif (Test-Path ".env") {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️ Arquivo .env e env.example não encontrados." -ForegroundColor Yellow
}

Set-Location ..

# 3. BUILD DO FRONTEND
Write-Host "`n💻 BUILD DO FRONTEND" -ForegroundColor Yellow

if (-not (Test-Path "frontend")) {
    Write-Host "❌ Diretório frontend não encontrado" -ForegroundColor Red
    exit 1
}

Set-Location frontend

# Instalar dependências
Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Cyan
call npm install --silent
Write-Host "✅ Dependências instaladas" -ForegroundColor Green

# Build
Write-Host "🏗️ Executando build de produção..." -ForegroundColor Cyan
try {
    call npm run build
    Write-Host "✅ Build concluído com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro durante o build do frontend" -ForegroundColor Red
    exit 1
}

Set-Location ..

# 4. CRIAR SCRIPTS DE INICIALIZAÇÃO
Write-Host "`n📜 CRIANDO SCRIPTS DE START" -ForegroundColor Yellow

$backendScript = @"
@echo off
echo Iniciando Backend Cinema ERP...
cd backend
call venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 0.0.0.0 --port 8020 --reload
"@
$backendScript | Out-File -FilePath "start_backend.bat" -Encoding UTF8

$frontendScript = @"
@echo off
echo Iniciando Frontend Cinema ERP...
cd frontend
npm run dev
"@
$frontendScript | Out-File -FilePath "start_frontend.bat" -Encoding UTF8

# Script para servir o build de produção (preview)
$previewScript = @"
@echo off
echo Iniciando Preview de Produção...
cd frontend
npm run preview
"@
$previewScript | Out-File -FilePath "start_production.bat" -Encoding UTF8


Write-Host "✅ Scripts criados:" -ForegroundColor Green
Write-Host "   - start_backend.bat (API Server)"
Write-Host "   - start_frontend.bat (Dev Mode)"
Write-Host "   - start_production.bat (Production Preview)"

Write-Host "`n🎉 DEPLOY LOCAL CONCLUÍDO!" -ForegroundColor Green
Write-Host "============================================================"
Write-Host "Para rodar:"
Write-Host "1. Backend: .\start_backend.bat"
Write-Host "2. Frontend (Dev): .\start_frontend.bat"
Write-Host "   OU"
Write-Host "2. Frontend (Prod): .\start_production.bat"
