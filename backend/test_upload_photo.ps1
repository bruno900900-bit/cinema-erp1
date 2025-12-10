param(
  [Parameter(Mandatory=$true)][string]$LocationId,
  [Parameter(Mandatory=$true)][string]$FilePath,
  [string]$Server = "http://127.0.0.1:8001"
)

if (-not (Test-Path $FilePath)) { Write-Error "Arquivo não encontrado: $FilePath"; exit 1 }

$uri = "$Server/api/v1/firebase-photos/upload/$LocationId"

try {
  Write-Host "Enviando $FilePath para $uri ..."
  $form = @{ photos = Get-Item -LiteralPath $FilePath }
  $resp = Invoke-RestMethod -Uri $uri -Method Post -Form $form -TimeoutSec 30 -ErrorAction Stop
  $resp | ConvertTo-Json -Depth 6
} catch {
  if ($_.Exception.Response) {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "STATUS $code"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Output $body
  } else {
    Write-Error $_.Exception.Message
  }
}
