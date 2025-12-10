# Script PowerShell para configurar o ambiente Firebase
# Execute este script no PowerShell como administrador

Write-Host "🔥 CONFIGURANDO AMBIENTE FIREBASE" -ForegroundColor Green
Write-Host "=" * 40

# Caminho do arquivo de service account
$serviceAccountPath = "C:\Users\werbi\cinema-erp\backend\firebase_service_account.json"

# Verificar se o arquivo existe
if (Test-Path $serviceAccountPath) {
    Write-Host "✅ Arquivo firebase_service_account.json encontrado" -ForegroundColor Green
    Write-Host "   📄 Caminho: $serviceAccountPath" -ForegroundColor Cyan

    # Configurar variável de ambiente para a sessão atual
    $env:GOOGLE_APPLICATION_CREDENTIALS = $serviceAccountPath
    Write-Host "✅ Variável GOOGLE_APPLICATION_CREDENTIALS configurada para esta sessão" -ForegroundColor Green

    # Configurar variável de ambiente permanentemente
    [Environment]::SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", $serviceAccountPath, "User")
    Write-Host "✅ Variável GOOGLE_APPLICATION_CREDENTIALS configurada permanentemente" -ForegroundColor Green

    Write-Host "`n🎉 CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
    Write-Host "✅ Ambiente Firebase configurado" -ForegroundColor Green
    Write-Host "✅ Pronto para usar!" -ForegroundColor Green

    Write-Host "`n🚀 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Execute: py setup_firebase_environment.py" -ForegroundColor White
    Write-Host "2. Execute: py test_complete_integration.py" -ForegroundColor White
    Write-Host "3. Execute: py start_firebase_server.py" -ForegroundColor White

} else {
    Write-Host "❌ Arquivo firebase_service_account.json não encontrado" -ForegroundColor Red
    Write-Host "   📄 Caminho esperado: $serviceAccountPath" -ForegroundColor Yellow

    Write-Host "`n💡 PARA RESOLVER:" -ForegroundColor Yellow
    Write-Host "1. Acesse o Firebase Console" -ForegroundColor White
    Write-Host "2. Vá em Configurações do Projeto → Contas de Serviço" -ForegroundColor White
    Write-Host "3. Clique em 'Gerar nova chave privada'" -ForegroundColor White
    Write-Host "4. Baixe o arquivo JSON" -ForegroundColor White
    Write-Host "5. Renomeie para 'firebase_service_account.json'" -ForegroundColor White
    Write-Host "6. Coloque na pasta backend/" -ForegroundColor White
}

Write-Host "`nPressione qualquer tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")



































