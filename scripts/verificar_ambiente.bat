@echo off
echo ========================================
echo   VERIFICACAO DE AMBIENTE
echo ========================================
echo.

echo Verificando Python...
python --version
if errorlevel 1 (
    echo [ERRO] Python nao encontrado!
) else (
    echo [OK] Python encontrado
)

echo.
echo Verificando Node.js...
node --version
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
) else (
    echo [OK] Node.js encontrado
)

echo.
echo Verificando npm...
npm --version
if errorlevel 1 (
    echo [ERRO] npm nao encontrado!
) else (
    echo [OK] npm encontrado
)

echo.
echo Verificando pip...
python -m pip --version
if errorlevel 1 (
    echo [ERRO] pip nao encontrado!
) else (
    echo [OK] pip encontrado
)

echo.
echo ========================================
pause


