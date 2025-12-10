# Script para corrigir problemas com variáveis de ambiente
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CORRECAO DE AMBIENTE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Limpar PATH de entradas vazias
Write-Host "🧹 Limpando PATH de entradas vazias..." -ForegroundColor Yellow
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$pathParts = $currentPath -split ';' | Where-Object { $_ -ne '' -and $_ -ne $null }
$cleanPath = $pathParts -join ';'

if ($currentPath -ne $cleanPath) {
    [Environment]::SetEnvironmentVariable("PATH", $cleanPath, "User")
    Write-Host "   ✅ PATH limpo e atualizado" -ForegroundColor Green
} else {
    Write-Host "   ✅ PATH já está limpo" -ForegroundColor Green
}

# Verificar e configurar HOME se necessário
Write-Host ""
Write-Host "🏠 Verificando variável HOME..." -ForegroundColor Yellow
$homeVar = [Environment]::GetEnvironmentVariable("HOME", "User")
if (-not $homeVar) {
    $userProfile = [Environment]::GetEnvironmentVariable("USERPROFILE", "User")
    if ($userProfile) {
        [Environment]::SetEnvironmentVariable("HOME", $userProfile, "User")
        Write-Host "   ✅ HOME configurado para: $userProfile" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ HOME já configurado: $homeVar" -ForegroundColor Green
}

# Verificar variáveis temporárias
Write-Host ""
Write-Host "📁 Verificando variáveis temporárias..." -ForegroundColor Yellow
$temp = [Environment]::GetEnvironmentVariable("TEMP", "User")
$tmp = [Environment]::GetEnvironmentVariable("TMP", "User")

if (-not $temp) {
    $temp = "$env:USERPROFILE\AppData\Local\Temp"
    [Environment]::SetEnvironmentVariable("TEMP", $temp, "User")
    Write-Host "   ✅ TEMP configurado: $temp" -ForegroundColor Green
} else {
    Write-Host "   ✅ TEMP: $temp" -ForegroundColor Green
}

if (-not $tmp) {
    $tmp = $temp
    [Environment]::SetEnvironmentVariable("TMP", $tmp, "User")
    Write-Host "   ✅ TMP configurado: $tmp" -ForegroundColor Green
} else {
    Write-Host "   ✅ TMP: $tmp" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CORRECAO CONCLUIDA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   Reinicie o Cursor/VS Code para que as" -ForegroundColor White
Write-Host "   mudanças tenham efeito!" -ForegroundColor White
Write-Host ""


