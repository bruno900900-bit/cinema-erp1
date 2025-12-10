@echo off
echo 🔥 Configurando Firewall do Windows para Cinema ERP
echo =====================================================
echo.
echo Este script precisa ser executado como Administrador!
echo.
pause

echo.
echo 📝 Liberando porta 8000 (Backend API)...
netsh advfirewall firewall add rule name="Cinema ERP Backend" dir=in action=allow protocol=TCP localport=8000

echo.
echo 📝 Liberando porta 5173 (Frontend)...
netsh advfirewall firewall add rule name="Cinema ERP Frontend" dir=in action=allow protocol=TCP localport=5173

echo.
echo ✅ Firewall configurado com sucesso!
echo.
echo As portas 8000 e 5173 agora estao liberadas.
echo.
echo Pressione qualquer tecla para fechar...
pause > nul









