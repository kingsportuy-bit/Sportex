[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [ValidateSet('PILOTO_DELTA','PRODUCCION_COMERCIAL')]
  [string]$Mode,

  [Parameter(Mandatory=$true)]
  [ValidatePattern('^TASK-[0-9]{8}-[0-9]{3}(-[a-z0-9-]+)?$')]
  [string]$TaskId,

  [Parameter(Mandatory=$true)]
  [ValidatePattern('^[0-9a-fA-F]{7,64}$')]
  [string]$ReleaseCommit,

  [Parameter(Mandatory=$true)]
  [string[]]$ScopePaths,

  [Parameter(Mandatory=$true)]
  [string]$Approval
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = (& git -C $projectRoot rev-parse --show-toplevel).Trim()
if (-not $repoRoot) { throw 'No se encontro repositorio Git.' }
$repoRootPath = [IO.Path]::GetFullPath($repoRoot).TrimEnd('\','/')
$projectRootPath = [IO.Path]::GetFullPath($projectRoot).TrimEnd('\','/')
if (-not $projectRootPath.StartsWith($repoRootPath, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'La raiz del proyecto no pertenece al repositorio Git.'
}
$projectPrefix = $projectRootPath.Substring($repoRootPath.Length).TrimStart('\','/').Replace('\','/')

function Invoke-Git([string[]]$Arguments) {
  $result = @(& git -C $repoRoot @Arguments)
  if ($LASTEXITCODE -ne 0) { throw "Git fallo: git $($Arguments -join ' ')" }
  return $result
}
function Normalize-Scope([string]$Value) {
  $normalized = $Value.Replace('\','/').Trim().TrimStart('./').TrimEnd('/')
  if (-not $normalized -or $normalized.StartsWith('/') -or $normalized -match '(^|/)\.\.(/|$)') {
    throw "Scope invalido: $Value"
  }
  return $normalized
}

$resolved = (Invoke-Git @('rev-parse',"${ReleaseCommit}^{commit}") | Select-Object -First 1).Trim().ToLowerInvariant()
$expectedApproval = "GO SPORTEX $TaskId $resolved $Mode"
$taskFile = Get-ChildItem -LiteralPath (Join-Path $projectRoot 'docs\TASKS\active') -Filter "$TaskId-*.md" | Select-Object -First 1
$planApproved = $null -ne $taskFile -and ((Get-Content -Raw -LiteralPath $taskFile.FullName) -match '(?m)^plan_authorization:\s*PLAN_APPROVED_AUTHORIZED\s*$')
if ($Approval -ne 'PLAN_APPROVED_AUTHORIZED' -and $Approval -cne $expectedApproval) {
  throw "Aprobacion invalida: se requiere GO exacto o un plan aprobado registrado."
}
if ($Approval -eq 'PLAN_APPROVED_AUTHORIZED' -and -not $planApproved) {
  throw 'El plan aprobado no está registrado en la tarea activa.'
}

if ($Mode -eq 'PRODUCCION_COMERCIAL') {
  $environment = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'docs\state\PROJECT_STATE.json') | ConvertFrom-Json
  if ($environment.operatingTarget -ne 'PRODUCCION_COMERCIAL') {
    throw 'PRODUCCION_COMERCIAL sigue bloqueado en PROJECT_STATE.'
  }
}

& (Join-Path $PSScriptRoot 'codex-scan-text-nul.ps1')
if (-not $?) { throw 'Scan anti-NUL fallo.' }

$origin = (Invoke-Git @('remote','get-url','origin') | Select-Object -First 1).Trim()
if (-not $origin) { throw 'Falta remote origin.' }
Invoke-Git @('ls-remote','--exit-code','origin','HEAD') | Out-Null
$remoteRefs = @(Invoke-Git @('branch','-r','--contains',$resolved) | Where-Object { $_.Trim() })
if ($remoteRefs.Count -eq 0) { throw "El commit $resolved no esta publicado en origin." }

$localScope = @($ScopePaths | ForEach-Object { Normalize-Scope $_ } | Select-Object -Unique)
$repoScope = @($localScope | ForEach-Object { if ($projectPrefix) { "$projectPrefix/$_" } else { $_ } })
$commitFiles = @(Invoke-Git @('diff-tree','--no-commit-id','--name-only','-r',$resolved) | ForEach-Object { $_.Trim() } | Where-Object { $_ })
if ($commitFiles.Count -eq 0) { throw 'El commit no contiene cambios.' }
foreach ($file in $commitFiles) {
  if (-not @($repoScope | Where-Object { $file -eq $_ -or $file.StartsWith("$_/") }).Count) {
    throw "El commit contiene $file fuera del scope declarado."
  }
}

$worktreeDiff = @(Invoke-Git (@('diff','--name-only',$resolved,'--') + $repoScope) | Where-Object { $_.Trim() })
if ($worktreeDiff.Count) { throw "El worktree difiere del commit: $($worktreeDiff -join ', ')" }
$indexDiff = @(Invoke-Git (@('diff','--cached','--name-only',$resolved,'--') + $repoScope) | Where-Object { $_.Trim() })
if ($indexDiff.Count) { throw "El index difiere del commit: $($indexDiff -join ', ')" }
$untracked = @(Invoke-Git (@('ls-files','--others','--exclude-standard','--') + $repoScope) | Where-Object { $_.Trim() })
if ($untracked.Count) { throw "Hay archivos no versionados: $($untracked -join ', ')" }

Write-Output "SPORTEX_RELEASE_COMMIT=$resolved"
Write-Output "SPORTEX_RELEASE_SCOPE=$($localScope -join ',')"
Write-Output "SPORTEX_RELEASE_ORIGIN=$origin"
Write-Output 'SPORTEX_RELEASE_SOURCE=git-archive'
Write-Output 'SPORTEX_RELEASE_GUARD_RESULT=pass'
