@echo off
cls
echo ========================================
echo   CINEMA ERP - Parando Servicos
echo ========================================
echo.
echo 🛑 Parando todos os servicos Docker...
echo.

docker-compose down

echo.
echo ✅ Todos os servicos foram parados!
echo.
pause









