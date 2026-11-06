@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 20+ is not on PATH. Install it from https://nodejs.org/ and reopen the terminal.
  exit /b 1
)
if not exist node_modules\electron (
  echo Installing npm dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)
call npm start
