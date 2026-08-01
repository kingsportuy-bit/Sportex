param(
  [Parameter(Mandatory=$true, Position=0, ValueFromRemainingArguments=$true)]
  [string[]]$Query
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$entries = Join-Path $root 'docs\errors\entries'
$queries = @($Query | Where-Object { $_ -and $_.Trim() })
if (-not $queries.Count) { throw 'Indicar una o mas palabras de busqueda.' }

$found = @()
Get-ChildItem -LiteralPath $entries -File -Filter '*.md' | ForEach-Object {
  $text = Get-Content -Raw -LiteralPath $_.FullName -Encoding UTF8
  $matches = $true
  foreach ($query in $queries) {
    if ($text -notmatch [regex]::Escape($query)) { $matches = $false; break }
  }
  if ($matches) { $found += [PSCustomObject]@{ File=$_.Name; Text=$text } }
}

if (-not $found.Count) {
  Write-Output "PRECHECK OK: sin entradas conocidas para $($queries -join ', ')"
  exit 0
}

Write-Output "PRECHECK ALERTA: entradas conocidas para $($queries -join ', ')"
foreach ($entry in $found | Select-Object -First 6) {
  Write-Output "- $($entry.File)"
  $entry.Text -split "`r?`n" | Where-Object { $_ -match 'Sintoma:|Causa raiz|Solucion|Prevencion/guardia' } | ForEach-Object { Write-Output "  $($_.Trim())" }
}
