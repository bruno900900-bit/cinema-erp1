@echo off
echo 🚀 Iniciando Cinema ERP - Modo Publico
echo =====================================================

echo.
echo 🔧 Verificando processos anteriores...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo 🗄️ Iniciando Backend (porta 8000 - acesso publico)...
start "Backend Cinema ERP" cmd /k "cd /d %~dp0backend && .\venv\Scripts\activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo ⏳ Aguardando backend inicializar...
timeout /t 10 /nobreak > nul

echo.
echo 🎨 Iniciando Frontend (porta 5173 - acesso publico)...
start "Frontend Cinema ERP" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 0.0.0.0 --port 5173"

echo.
echo ⏳ Aguardando frontend inicializar...
timeout /t 5 /nobreak > nul

echo.
echo ✅ Sistema Cinema ERP iniciado!
echo.
echo 🌐 ACESSOS:
echo    Backend API:  http://localhost:8000
echo    Frontend:     http://localhost:5173
echo    API Docs:     http://localhost:8000/docs
echo.
echo 🔓 ACESSO EXTERNO (substitua SEU_IP pelo IP da maquina):
echo    Backend API:  http://SEU_IP:8000
echo    Frontend:     http://SEU_IP:5173
echo.
echo 💡 Para descobrir seu IP local: ipconfig
echo 💡 Para descobrir seu IP publico: curl ifconfig.me
echo.
echo 📝 IMPORTANTE:
echo    - Libere as portas 8000 e 5173 no Firewall do Windows
echo    - Configure o roteador para port forwarding (se necessario)
echo.
echo Pressione qualquer tecla para ver informacoes de rede...
pause > nul

ipconfig | findstr /i "IPv4"

echo.
echo Pressione qualquer tecla para fechar...
pause > nul









