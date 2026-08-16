param(
  [ValidateSet('Context', 'Sync', 'Check', 'Close')]
  [string]$Action = 'Context',

  [ValidateSet('idle', 'guidance', 'documentation', 'architecture', 'feature', 'fix', 'operation', 'incident', 'product', 'quality', 'library', 'deploy', 'runtime', 'tasks')]
  [string]$Intent = 'guidance',

  [string]$TaskId,

  [ValidateSet('auto', 'docs', 'local', 'pilot-release')]
  [string]$Profile = 'auto'
)

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$workflowScript = Join-Path $scriptDirectory 'sportex-workflow.mjs'
$nodeArguments = @($workflowScript, $Action.ToLowerInvariant(), "--intent=$Intent")
$nodeArguments += "--profile=$Profile"

if ($TaskId) {
  $nodeArguments += "--task=$TaskId"
}

& node @nodeArguments
exit $LASTEXITCODE
