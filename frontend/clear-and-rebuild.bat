@echo off
echo ========================================
echo Limpando cache e rebuild do Cinema ERP
echo ========================================

echo.
echo [1/5] Removendo node_modules, dist e cache...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
if exist .vite rmdir /s /q .vite

echo [2/5] Limpando cache do npm...
call npm cache clean --force

echo [3/5] Reinstalando dependencias...
call npm install

echo [4/5] Fazendo build...
call npm run build

echo [5/5] Iniciando servidor de desenvolvimento...
echo.
echo Servidor iniciando... Pressione Ctrl+C para parar.
call npm run dev

echo.
echo ========================================
echo Concluido!
echo ========================================
