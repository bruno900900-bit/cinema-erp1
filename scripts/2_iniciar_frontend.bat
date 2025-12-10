@echo off
title Frontend - Cinema ERP
echo ========================================
echo   FRONTEND - Cinema ERP
echo ========================================
echo.
echo 🎨 Iniciando servidor frontend...
echo.
pushd frontend

if not exist "node_modules" (
    echo 📥 Instalando dependencias do frontend (npm install)...
    call npm install
)

if not exist ".env.local" (
    echo VITE_API_BASE_URL=http://localhost:8000/api/v1> ".env.local"
    echo 🔧 Criado arquivo .env.local apontando para o backend local.
)

npm run dev

popd
pause
