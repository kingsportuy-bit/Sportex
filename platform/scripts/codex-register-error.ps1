param(
  [Parameter(Mandatory=$true)][string]$Title,
  [Parameter(Mandatory=$true)][string]$Sintoma,
  [string]$Causa = 'Pendiente confirmar.',
  [Parameter(Mandatory=$true)][string]$Solucion,
  [Parameter(Mandatory=$true)][string]$Prevencion,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$entries = [IO.Path]::GetFullPath((Join-Path $root 'docs\errors\entries'))
$workspace = [IO.Path]::GetFullPath($root)
if (-not $entries.StartsWith($workspace, [StringComparison]::OrdinalIgnoreCase)) { throw 'Ruta de entradas fuera del workspace.' }
$date = Get-Date -Format 'yyyyMMdd'
$maximum = 0
Get-ChildItem -LiteralPath $entries -File -Filter "SPX-ERR-$date-*.md" | ForEach-Object {
  if ($_.Name -match "^SPX-ERR-$date-(\d{3})-") { $maximum = [Math]::Max($maximum, [int]$Matches[1]) }
}
$id = "SPX-ERR-$date-$('{0:D3}' -f ($maximum + 1))"
$slug = ($Title.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}', '' -replace '[^A-Za-z0-9]+', '-').Trim('-').ToLowerInvariant()
$content = @"
# $id - $Title

- Fecha: $(Get-Date -Format 'yyyy-MM-dd').
- Sintoma: $Sintoma
- Causa raiz: $Causa
- Solucion: $Solucion
- Prevencion/guardia: $Prevencion
"@
if ($DryRun) { Write-Output $content; exit 0 }
$target = Join-Path $entries "$id-$slug.md"
if (Test-Path -LiteralPath $target) { throw "La entrada ya existe: $target" }
[IO.File]::WriteAllText($target, $content.TrimEnd() + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
& node (Join-Path $root 'scripts\documentation\generate-documentation-views.mjs') | Out-Null
Write-Output "Registrado $id y regenerado el indice."
