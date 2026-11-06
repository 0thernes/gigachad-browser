# Runs the same checks as npm test/smoke: syntax, sidecar honesty, and an Electron boot.
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not (Test-Path -LiteralPath ".\node_modules\electron")) {
  npm install
}
node scripts/smoke.js
exit $LASTEXITCODE
