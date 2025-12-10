@echo off
cls
title Cinema ERP - Inicializacao Automatica
color 0A

echo.
echo    ========================================
echo     _____  _                              _____ ____  ____
echo    / ____^|^| ^|                            ^|  ____ ^|  _ \^|  _ \
echo   ^| ^|     ^| ^| _ __    ___  _ __ ___    __ _ ^| ^|__  ^| ^|_) ^| ^|_) ^|
echo   ^| ^|     ^| ^|^| '_ \  / _ \^| '_ ` _ \  / _` ^|  __^| ^|  _ ^<^|  __/
echo   ^| ^|____ ^| ^|^| ^| ^| ^|^|  __/^| ^| ^| ^| ^| ^| (_^| ^| ^|____^| ^|_) ^| ^|
echo    \_____^|^|_^|^|_^| ^|_^| \___^|^|_^| ^|_^| ^|_^|\__,_^|______^|____/^|_^|
echo    ========================================
echo.
echo    Sistema de Gerenciamento de Producao
echo    ========================================
echo.

echo  Detectando ambiente...
echo.

:: Verificar se Docker esta instalado
docker --version >nul 2>&1
if errorlevel 1 (
    goto :sem_docker
) else (
    goto :com_docker
)

:com_docker
echo  ✅ Docker detectado!
echo.
echo  Escolha como iniciar:
echo.
echo  [1] Com Docker ^(Recomendado - tudo automatico^)
echo  [2] Sem Docker ^(manual - requer PostgreSQL^)
echo  [3] Cancelar
echo.
choice /c 123 /n /m "  Digite sua escolha (1, 2 ou 3): "

if errorlevel 3 goto :fim
if errorlevel 2 goto :executar_sem_docker
if errorlevel 1 goto :executar_com_docker

:sem_docker
echo  ⚠️  Docker nao encontrado
echo.
echo  Iniciando em modo manual...
echo  ^(Requer PostgreSQL instalado e rodando^)
echo.
pause
goto :executar_sem_docker

:executar_com_docker
cls
echo.
echo  🐳 Iniciando com Docker...
echo  ========================================
echo.
call INICIAR_SISTEMA_COMPLETO.bat
goto :fim

:executar_sem_docker
cls
echo.
echo  🔧 Iniciando modo manual...
echo  ========================================
echo.
call INICIAR_SEM_DOCKER.bat
goto :fim

:fim
exit /b









