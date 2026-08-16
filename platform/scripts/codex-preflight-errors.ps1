param(
  [ValidateSet('Ranked','All')]
  [string]$Match = 'Ranked',

  [Parameter(Mandatory=$true, Position=0, ValueFromRemainingArguments=$true)]
  [string[]]$Query
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$queries = @($Query | Where-Object { $_ -and $_.Trim() })
if (-not $queries.Count) { throw 'Indicar una o mas palabras de busqueda.' }
$mode = $Match.ToLowerInvariant()
& node (Join-Path $root 'scripts\error-search.mjs') "--mode=$mode" -- @queries
exit $LASTEXITCODE
