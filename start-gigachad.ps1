# Starts the browser. Electron launches the Python sidecar when python is found.
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js 20+ is not on PATH."
}
if (-not (Test-Path -LiteralPath ".\node_modules\electron")) {
  npm install
}
npm start
