# Script de Deploy Simplificado para Cinema ERP
$ErrorActionPreference = "Stop"

Write-Host "🚀 INICIANDO DEPLOY DO CINEMA ERP" -ForegroundColor Green
Write-Host "============================================================"

# 1. Verificar ambiente
Write-Host "`n🔍 VERIFICANDO AMBIENTE" -ForegroundColor Yellow

# Verificar Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python encontrado: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python não encontrado" -ForegroundColor Red
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado" -ForegroundColor Red
    exit 1
}

# 2. Backend Setup
Write-Host "`n🔧 CONFIGURANDO BACKEND" -ForegroundColor Yellow

if (-not (Test-Path "backend")) {
    Write-Host "❌ Diretório backend não encontrado" -ForegroundColor Red
    exit 1
}

Set-Location backend

# Criar e ativar ambiente virtual
if (-not (Test-Path "venv")) {
    Write-Host "📦 Criando ambiente virtual..." -ForegroundColor Cyan
    python -m venv venv
}

# Ativar ambiente virtual
Write-Host "🔌 Ativando ambiente virtual..." -ForegroundColor Cyan
& ".\venv\Scripts\Activate.ps1"

# Instalar dependências
Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Cyan
pip install -r requirements.txt

Set-Location ..

# 3. Frontend Setup
Write-Host "`n💻 CONFIGURANDO FRONTEND" -ForegroundColor Yellow

if (-not (Test-Path "frontend")) {
    Write-Host "❌ Diretório frontend não encontrado" -ForegroundColor Red
    exit 1
}

Set-Location frontend

# Instalar dependências
Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Cyan
npm install

# Build do frontend
Write-Host "🔨 Construindo frontend..." -ForegroundColor Cyan
npm run build

Set-Location ..

# 4. Criar scripts de inicialização
Write-Host "`n📜 CRIANDO SCRIPTS DE INICIALIZAÇÃO" -ForegroundColor Yellow

$backendContent = @"
@echo off
cd backend
call venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 0.0.0.0 --port 8020 --reload
"@

$frontendContent = @"
@echo off
cd frontend
npm run dev
"@

Set-Content -Path "start-backend.bat" -Value $backendContent -Encoding UTF8
Set-Content -Path "start-frontend.bat" -Value $frontendContent -Encoding UTF8

Write-Host "✅ Scripts de inicialização criados" -ForegroundColor Green

# 5. Resumo
Write-Host "`n🎉 DEPLOY LOCAL CONCLUÍDO!" -ForegroundColor Green
Write-Host "============================================================"

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Inicie o backend: .\start-backend.bat" -ForegroundColor Cyan
Write-Host "2. Inicie o frontend: .\start-frontend.bat" -ForegroundColor Cyan
Write-Host "3. Acesse: http://localhost:5173" -ForegroundColor Cyan

Write-Host "`n✨ SISTEMA PRONTO PARA USO!" -ForegroundColor Green