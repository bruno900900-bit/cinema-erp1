@echo off
cls
echo ========================================
echo   CINEMA ERP - Inicializacao Completa
echo ========================================
echo.
echo Este script vai iniciar todos os servicos:
echo   - PostgreSQL (Banco de Dados)
echo   - Backend (FastAPI)
echo   - Frontend (React/Vite)
echo   - Redis (Cache)
echo   - Nginx (Proxy)
echo.
echo ⚠️  IMPORTANTE: Certifique-se de que o Docker Desktop esta rodando!
echo.
pause

echo.
echo 🐳 Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker nao encontrado!
    echo.
    echo Por favor, instale o Docker Desktop:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo ✅ Docker encontrado!
echo.
echo 🚀 Iniciando todos os servicos com Docker Compose...
echo.

docker-compose up -d

echo.
echo ⏳ Aguardando servicos iniciarem...
timeout /t 15 /nobreak > nul

echo.
echo ========================================
echo ✅ SISTEMA INICIADO!
echo ========================================
echo.
echo 📍 URLs para acessar:
echo.
echo    Frontend:     http://localhost:3000
echo    Backend API:  http://localhost:8000
echo    API Docs:     http://localhost:8000/docs
echo    Nginx:        http://localhost
echo.
echo 💡 Dica: Aguarde mais alguns segundos para
echo    todos os servicos carregarem completamente.
echo.
echo 📊 Para ver os logs:
echo    docker-compose logs -f
echo.
echo 🛑 Para parar os servicos:
echo    docker-compose down
echo.
pause









