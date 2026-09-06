@echo off
setlocal EnableExtensions
chcp 65001 >nul
pushd "%~dp0"

if not exist ".runtime\node\node.exe" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\tools\bootstrap-node.ps1"
  if errorlevel 1 goto :err
)
set "NODE_DIR=%CD%\.runtime\node"
set "PATH=%NODE_DIR%;%PATH%"
if not exist "node_modules\.bin\vite.cmd" (
  call "%NODE_DIR%\npm.cmd" install
  if errorlevel 1 goto :err
)
call "%NODE_DIR%\npm.cmd" run build
if errorlevel 1 goto :err

echo.
echo [OK] Build complete: dist\
goto :hold

:err
echo.
echo [ERROR] Build failed. See the message above.
:hold
pause
popd
endlocal
