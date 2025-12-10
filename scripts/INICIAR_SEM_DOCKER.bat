@echo off
setlocal enabledelayedexpansion
cls
set "PROJECT_ROOT=%~dp0"
echo ========================================
echo   CINEMA ERP - Modo Desenvolvimento
echo   (Backend SQLite + Frontend React)
echo ========================================
echo.
echo ✅ Este assistente vai iniciar backend e frontend automaticamente
echo    - Python 3.11+ requerido
echo    - Node.js 18+ requerido
echo.
pause

echo.
echo 🐍 Preparando backend Python...
pushd "%PROJECT_ROOT%backend" >nul

if not exist "venv" (
    echo 📦 Criando ambiente virtual...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Nao foi possivel criar o ambiente virtual.
        echo    Verifique se o Python 3.11+ esta instalado e no PATH.
        popd >nul
        pause
        exit /b 1
    )
)

call venv\Scripts\activate.bat >nul

echo 📥 Instalando dependencias do backend...
python -m pip install --upgrade pip
pip install -r requirements.txt

if exist ".env" (
    findstr /C:"DATABASE_TYPE=postgres" ".env" >nul
    if errorlevel 1 (
        if exist "env.postgres" (
            copy /Y "env.postgres" ".env" >nul
            echo ⚙️  Atualizado arquivo .env com configuracao PostgreSQL (senha 0876).
        ) else if exist ".env.example" (
            copy /Y ".env.example" ".env" >nul
            echo ⚙️  Arquivo .env recriado a partir do exemplo.
        )
    )
) else (
    if exist "env.postgres" (
        copy "env.postgres" ".env" >nul
        echo ⚙️  Arquivo .env criado com configuracao PostgreSQL (senha 0876).
    ) else if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ⚙️  Arquivo .env criado a partir do exemplo.
    ) else if exist "env.example" (
        copy "env.example" ".env" >nul
        echo ⚙️  Arquivo .env criado a partir do exemplo.
    )
)

echo 🗃️  Preparando banco com dados demonstracao...
python setup_database.py

echo 🚀 Iniciando backend (porta 8000)...
start "Backend - Cinema ERP" cmd /k "cd /d %CD% && call venv\Scripts\activate.bat && python run_app.py"

popd >nul

echo.
echo ⏳ Aguardando backend inicializar...
timeout /t 8 /nobreak >nul

echo.
echo 📦 Verificando frontend React...
pushd "%PROJECT_ROOT%frontend" >nul

if not exist "node_modules" (
    echo 📥 Instalando dependencias NPM (pode demorar alguns minutos)...
    call npm install
)

if not exist ".env.local" (
    echo VITE_API_BASE_URL=http://localhost:8000/api/v1> ".env.local"
    echo 🔧 Criado arquivo frontend\.env.local apontando para o backend local.
)

echo 🎨 Iniciando frontend (porta 5173)...
start "Frontend - Cinema ERP" cmd /k "cd /d %CD% && npm run dev"

popd >nul

echo.
echo ========================================
echo ✅ SISTEMA INICIADO!
echo ========================================
echo.
echo 📍 URLs para acessar:
echo    Frontend: http://localhost:5173
echo    Backend : http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo 👤 Login padrao: admin@cinema.com / admin123
echo.
echo 🛑 Para encerrar: feche as janelas "Backend" e "Frontend" abertas.
echo.
pause
