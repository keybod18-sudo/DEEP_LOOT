@echo off
setlocal EnableExtensions
chcp 65001 >nul
pushd "%~dp0"
title DEEP LOOT - Update

if not exist ".runtime\git\cmd\git.exe" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\tools\bootstrap-git.ps1"
  if errorlevel 1 goto :error
)

set "GIT=%CD%\.runtime\git\cmd\git.exe"

if not exist ".git" (
  echo [ERROR] GitHub connection has not been set up yet.
  echo Run CONNECT_GITHUB.bat once first.
  goto :hold
)

"%GIT%" remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo [ERROR] GitHub remote "origin" is not configured.
  echo Run CONNECT_GITHUB.bat once first.
  goto :hold
)

echo [UPDATE] Pulling the latest DEEP LOOT...
"%GIT%" pull --ff-only
if errorlevel 1 goto :error

echo.
echo [OK] Updated.
echo If Vite is already running, the browser should refresh automatically.
timeout /t 2 /nobreak >nul
popd
endlocal
exit /b 0

:error
echo.
echo [ERROR] Update failed. See the message above.
:hold
echo.
pause
popd
endlocal
