@echo off
setlocal EnableExtensions
chcp 65001 >nul
pushd "%~dp0"

title DEEP LOOT - Local Development

echo ============================================================
echo  DEEP LOOT - ONE CLICK LOCAL START
echo ============================================================
echo Project: %CD%
echo.


REM ------------------------------------------------------------
REM 0) Pull latest GitHub version when this folder is connected.
REM    A network failure does NOT prevent local development.
REM ------------------------------------------------------------
if exist ".git" (
    if not exist ".runtime\git\cmd\git.exe" (
        powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\tools\bootstrap-git.ps1"
    )
    if exist ".runtime\git\cmd\git.exe" (
        set "GIT=%CD%\.runtime\git\cmd\git.exe"
        "%GIT%" remote get-url origin >nul 2>&1
        if not errorlevel 1 (
            echo [UPDATE] Checking GitHub...
            "%GIT%" pull --ff-only
            if errorlevel 1 echo [WARN] GitHub update failed. Starting the local version anyway.
            echo.
        )
    )
)

REM ------------------------------------------------------------
REM 1) Ensure a private Node.js runtime exists inside this project.
REM    No global Node.js installation is required.
REM ------------------------------------------------------------
if not exist ".runtime\node\node.exe" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\tools\bootstrap-node.ps1"
    if errorlevel 1 goto :bootstrap_error
)

set "NODE_DIR=%CD%\.runtime\node"
set "PATH=%NODE_DIR%;%PATH%"

if not exist "%NODE_DIR%\node.exe" goto :bootstrap_error
if not exist "%NODE_DIR%\npm.cmd" goto :bootstrap_error

echo [OK] Node:
"%NODE_DIR%\node.exe" --version
if errorlevel 1 goto :runtime_error

echo [OK] npm:
call "%NODE_DIR%\npm.cmd" --version
if errorlevel 1 goto :runtime_error

echo.

REM ------------------------------------------------------------
REM 2) Install project packages only when needed.
REM ------------------------------------------------------------
if not exist "node_modules\.bin\vite.cmd" (
    echo [SETUP] Installing project packages. First run may take a few minutes...
    call "%NODE_DIR%\npm.cmd" install
    if errorlevel 1 goto :npm_error
) else (
    echo [OK] Project packages already installed.
)

echo.
echo [START] Opening DEEP LOOT in your browser...
echo [START] Keep this window open while developing.
echo [START] Press Ctrl+C here to stop the local server.
echo.

REM Open browser after giving Vite a moment to start.
start "" cmd /c "timeout /t 2 /nobreak ^>nul ^& start ^"^" http://127.0.0.1:5173/"

call "%NODE_DIR%\npm.cmd" run dev -- --host 127.0.0.1 --port 5173
set "SERVER_EXIT=%ERRORLEVEL%"

echo.
if "%SERVER_EXIT%"=="0" (
    echo [STOPPED] Local server stopped.
) else (
    echo [ERROR] Local server exited with code %SERVER_EXIT%.
)
goto :hold

:bootstrap_error
echo.
echo [ERROR] Automatic Node.js setup failed.
echo.
echo This starter does NOT require you to install Node.js manually.
echo Check that this PC can access https://nodejs.org/ and run START_LOCAL.bat again.
goto :hold

:runtime_error
echo.
echo [ERROR] The local Node.js runtime exists but could not be started.
goto :hold

:npm_error
echo.
echo [ERROR] npm install failed.
echo Check the error message above. This window will stay open.
goto :hold

:hold
echo.
echo ------------------------------------------------------------
echo Press any key to close this window.
pause >nul
popd
endlocal
