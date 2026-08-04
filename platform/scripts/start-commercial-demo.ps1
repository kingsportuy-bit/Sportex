param(
  [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $projectRoot 'frontend'
$demoDataFile = Join-Path $projectRoot '.sportex-local\commercial-demo-v1.json'

$env:SPORTEX_ENV = 'development'
$env:SPORTEX_STORE = 'memory'
$env:SPORTEX_DEV_AUTH = 'true'
$env:SPORTEX_FRONTEND_DIR = $frontendRoot
$env:SPORTEX_COMMERCIAL_DEMO_FILE = $demoDataFile
$env:SPORTEX_RELEASE = 'commercial-local-fixture'
$env:HOST = '127.0.0.1'
$env:PORT = [string]$Port

Push-Location $projectRoot
try {
  Write-Host "SPORTEX_DEMO=LOCAL_ONLY"
  Write-Host "SPORTEX_DATA=FICTIONAL_LOCAL_PERSISTENT"
  Write-Host "SPORTEX_DATA_FILE=$demoDataFile"
  Write-Host "SPORTEX_URL=http://127.0.0.1:$Port"
  npm --workspace @sportex/core run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm --workspace @sportex/core run start
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
