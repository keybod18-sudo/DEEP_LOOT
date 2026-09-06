@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>nul
title DEEP LOOT - Environment Check
cd /d "%~dp0"

echo ==================================================
echo   DEEP LOOT - Environment Check
echo ==================================================
echo.
echo Project: %CD%
echo.

where node.exe
if errorlevel 1 (
  echo [NG] Node.js not found.
) else (
  echo [OK] Node.js found.
  node -v
)
echo.
where npm.cmd
if errorlevel 1 (
  echo [NG] npm not found.
) else (
  echo [OK] npm found.
  call npm -v
)
echo.
if exist "node_modules\vite\bin\vite.js" (
  echo [OK] Vite is installed in node_modules.
) else (
  echo [INFO] Vite is not installed yet. START_LOCAL.bat will run npm install.
)
echo.
pause
