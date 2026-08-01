[CmdletBinding()]
param(
  [string[]]$Roots = @('core','frontend','deploy','docs','scripts','AGENTS.md','README.md','package.json','.gitattributes','.editorconfig'),
  [switch]$IncludeBinary
)

$binaryExtensions = @('.png','.jpg','.jpeg','.gif','.webp','.ico','.pdf','.zip','.gz','.mp3','.mp4','.woff','.woff2')
$excludedSegments = '\\(node_modules|dist|dist-test|\.git|\.npm-cache|coverage|\.next)\\'
$findings = @()

foreach ($root in $Roots) {
  if (-not (Test-Path -LiteralPath $root)) { continue }
  $item = Get-Item -LiteralPath $root
  $files = if ($item.PSIsContainer) { Get-ChildItem -LiteralPath $root -File -Recurse -Force } else { @($item) }
  foreach ($file in $files) {
    if ($file.FullName -match $excludedSegments) { continue }
    if (-not $IncludeBinary -and $binaryExtensions -contains $file.Extension.ToLowerInvariant()) { continue }
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $firstNul = [Array]::IndexOf($bytes, [byte]0)
    if ($firstNul -ge 0) {
      $nulCount = @($bytes | Where-Object { $_ -eq 0 }).Count
      $findings += [PSCustomObject]@{
        Path = $file.FullName.Substring((Get-Location).Path.Length + 1)
        Bytes = $bytes.Length
        NulBytes = $nulCount
      }
    }
  }
}

if ($findings.Count -gt 0) {
  $findings | Format-Table -AutoSize
  exit 1
}

Write-Output 'NUL_SCAN_RESULT=clean'
