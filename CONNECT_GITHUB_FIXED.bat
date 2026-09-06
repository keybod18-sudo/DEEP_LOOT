@echo off
setlocal EnableExtensions
pushd "%~dp0"
title DEEP LOOT - Connect GitHub

set "GIT=%CD%\.runtime\git\cmd\git.exe"

if not exist "%GIT%" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\tools\bootstrap-git.ps1"
  if errorlevel 1 goto :error
)

echo ============================================================
echo DEEP LOOT - GITHUB CONNECTION
echo ============================================================
echo.
echo Create an EMPTY GitHub repository named DEEP_LOOT.
echo Do NOT add README, .gitignore, or License on GitHub.
echo.
start "" "https://github.com/new?name=DEEP_LOOT"
echo.
echo After creating it, paste the repository URL below.
echo Example: https://github.com/USERNAME/DEEP_LOOT.git
echo.
set /p "REPO_URL=Repository URL: "

if "%REPO_URL%"=="" goto :error

if not exist ".git" (
  "%GIT%" init
  if errorlevel 1 goto :error
)

"%GIT%" config user.name >nul 2>&1
if errorlevel 1 "%GIT%" config user.name "DEEP LOOT Local"

"%GIT%" config user.email >nul 2>&1
if errorlevel 1 "%GIT%" config user.email "deep-loot-local@users.noreply.github.com"

"%GIT%" add -A
"%GIT%" commit -m "chore: establish DEEP LOOT local baseline" >nul 2>&1

"%GIT%" branch -M main

"%GIT%" remote remove origin >nul 2>&1
"%GIT%" remote add origin "%REPO_URL%"
if errorlevel 1 goto :error

echo.
echo Pushing current project to GitHub...
"%GIT%" push -u origin main
if errorlevel 1 goto :error

echo.
echo [OK] GitHub connection complete.
echo Use UPDATE.bat for future updates.
echo START_LOCAL.bat will also pull updates when connected.
goto :hold

:error
echo.
echo [ERROR] GitHub connection failed.
echo Check the message above.

:hold
echo.
pause
popd
endlocal
