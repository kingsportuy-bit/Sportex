[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [ValidateSet('PILOTO_DELTA','PRODUCCION_COMERCIAL')]
  [string]$Mode,
  [Parameter(Mandatory=$true)][string]$TaskId,
  [Parameter(Mandatory=$true)][string]$ReleaseCommit,
  [Parameter(Mandatory=$true)][string[]]$ScopePaths,
  [Parameter(Mandatory=$true)][string]$Approval,
  [Parameter(Mandatory=$true)][string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = (& git -C $projectRoot rev-parse --show-toplevel).Trim()
$repoRootPath = [IO.Path]::GetFullPath($repoRoot).TrimEnd('\','/')
$projectRootPath = [IO.Path]::GetFullPath($projectRoot).TrimEnd('\','/')
if (-not $projectRootPath.StartsWith($repoRootPath, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'La raiz del proyecto no pertenece al repositorio Git.'
}
$projectPrefix = $projectRootPath.Substring($repoRootPath.Length).TrimStart('\','/').Replace('\','/')

& (Join-Path $PSScriptRoot 'release-governance-guard.ps1') -Mode $Mode -TaskId $TaskId -ReleaseCommit $ReleaseCommit -ScopePaths $ScopePaths -Approval $Approval
if (-not $?) { throw 'Release governance guard fallo.' }

$resolved = (& git -C $repoRoot rev-parse "${ReleaseCommit}^{commit}").Trim().ToLowerInvariant()
$scope = @($ScopePaths | ForEach-Object { $_.Replace('\','/').Trim().TrimStart('./').TrimEnd('/') } | Select-Object -Unique)
$repoScope = @($scope | ForEach-Object { if ($projectPrefix) { "$projectPrefix/$_" } else { $_ } })
$output = [IO.Path]::GetFullPath($OutputDirectory)
if (Test-Path -LiteralPath $output) { throw "El bundle ya existe: $output" }

$source = Join-Path $output 'source'
$archive = Join-Path $output 'release-source.zip'
New-Item -ItemType Directory -Path $source -Force | Out-Null
& git -C $repoRoot archive --format=zip --output $archive $resolved -- $repoScope
if ($LASTEXITCODE -ne 0) { throw 'git archive fallo.' }
Expand-Archive -LiteralPath $archive -DestinationPath $source -Force

$hash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
$manifest = [ordered]@{
  task_id = $TaskId
  mode = $Mode
  source_commit = $resolved
  scope_paths = $scope
  archive_file = 'release-source.zip'
  archive_sha256 = $hash
  approval = $Approval
  created_at_utc = (Get-Date).ToUniversalTime().ToString('o')
  source = 'git archive'
} | ConvertTo-Json -Depth 5
Set-Content -LiteralPath (Join-Path $output 'release-manifest.json') -Value $manifest -Encoding utf8

Write-Output "SPORTEX_RELEASE_BUNDLE=$output"
Write-Output "SPORTEX_RELEASE_SHA256=$hash"
