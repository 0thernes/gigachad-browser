# Prints what this machine can see. It does not download models or start a GPU server.
$ErrorActionPreference = "Continue"
Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Node:" -ForegroundColor Cyan
node -v
Write-Host "Python:" -ForegroundColor Cyan
if (Get-Command py -ErrorAction SilentlyContinue) { py -3 -V } elseif (Get-Command python -ErrorAction SilentlyContinue) { python -V } else { Write-Host "Python was not found on PATH" }
$pyRoot = Join-Path $env:LOCALAPPDATA "Programs\Python"
if (Test-Path $pyRoot) {
  Get-ChildItem $pyRoot -Filter python.exe -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "Python install: $($_.FullName)" }
}
$ollama = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"
if (Test-Path $ollama) { Write-Host "Ollama: $ollama" -ForegroundColor Green }

$llama = Get-Command llama-server -ErrorAction SilentlyContinue
if ($llama) { Write-Host "llama-server: $($llama.Source)" -ForegroundColor Green } else { Write-Host "llama-server is not on PATH. Ollama or LM Studio can still serve http://127.0.0.1:11434/v1 or http://127.0.0.1:1234/v1." }

foreach ($url in @("http://127.0.0.1:8000/health", "http://127.0.0.1:11434/v1/models", "http://127.0.0.1:1234/v1/models")) {
  try {
    $res = Invoke-WebRequest -Uri $url -TimeoutSec 2 -UseBasicParsing
    Write-Host "UP $url ($($res.StatusCode))" -ForegroundColor Green
  } catch {
    Write-Host "DOWN $url" -ForegroundColor Yellow
  }
}

if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
  nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv
} else {
  Write-Host "nvidia-smi is not installed. GPU telemetry in the toolbar stays empty."
}

Write-Host "Next: copy config.example.json to config.json, then run npm start or .\LAUNCH_BROWSER.bat"
