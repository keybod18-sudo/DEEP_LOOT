@echo off
setlocal EnableExtensions
chcp 65001 >nul
pushd "%~dp0"
title DEEP LOOT - Connect GitHub

if not exist ".runtime\git\cmd\git.exe" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\tools\bootstrap-git.ps1"
  if errorlevel 1 goto :error
)
set "GIT=%CD%\.runtime\git\cmd\git.exe"

echo ============================================================
echo  DEEP LOOT - ONE TIME GITHUB CONNECTION
echo ============================================================
echo.
echo 1. GitHubで空のリポジトリ "DEEP_LOOT" を1個作成してください。
echo    README / .gitignore / License は追加しないでください。
echo.
echo GitHubの新規リポジトリ画面を開きます。
start "" "https://github.com/new?name=DEEP_LOOT"
echo.
echo 作成後、そのリポジトリURLをここへ貼り付けて Enter。
echo 例: https://github.com/USERNAME/DEEP_LOOT.git
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
echo [PUSH] Uploading the current DEEP LOOT project...
echo GitHub login may open once on the first push.
"%GIT%" push -u origin main
if errorlevel 1 goto :error

echo.
echo [OK] GitHub connection complete.
echo From now on:
echo   UPDATE.bat      = get latest changes
echo   START_LOCAL.bat = update + start the game
echo.
goto :hold

:error
echo.
echo [ERROR] GitHub connection failed. See the message above.
:hold
pause
popd
endlocal
