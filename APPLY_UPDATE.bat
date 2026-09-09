@echo off
setlocal EnableExtensions
chcp 65001 >nul
pushd "%~dp0"
title DEEP LOOT - Recovery Apply Update

echo ============================================================
echo DEEP LOOT - RECOVERY APPLY UPDATE
echo ============================================================

if not exist "package.json" (
  echo [ERROR] APPLY_UPDATE.bat must be in the DEEP_LOOT project root.
  goto :error
)

set "ROOT=%CD%"
set "NODE_DIR=%ROOT%\.runtime\node"
set "GITEXE="

echo [1/7] Preparing Node...
if not exist "%NODE_DIR%\node.exe" (
  if not exist "%ROOT%\tools\bootstrap-node.ps1" (
    echo [ERROR] tools\bootstrap-node.ps1 was not found.
    goto :error
  )
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\tools\bootstrap-node.ps1"
  if errorlevel 1 goto :error
)

if not exist "%NODE_DIR%\npm.cmd" (
  echo [ERROR] npm.cmd was not found under .runtime\node.
  goto :error
)

set "PATH=%NODE_DIR%;%PATH%"

echo [2/7] Installing dependencies if needed...
if not exist "node_modules\.bin\tsc.cmd" (
  call "%NODE_DIR%\npm.cmd" install
  if errorlevel 1 goto :error
)

echo [3/7] Checking TypeScript...
call "%NODE_DIR%\npm.cmd" run check
if errorlevel 1 goto :error

echo [4/7] Verifying locked assets...
if exist "%ROOT%\tools\verify-assets.mjs" (
  "%NODE_DIR%\node.exe" "%ROOT%\tools\verify-assets.mjs"
  if errorlevel 1 goto :error
) else (
  echo [WARN] tools\verify-assets.mjs was not found. Skipping asset verifier.
)

echo [5/7] Preparing Git...
if exist "%ROOT%\.runtime\git\cmd\git.exe" set "GITEXE=%ROOT%\.runtime\git\cmd\git.exe"

if not defined GITEXE (
  where git >nul 2>&1
  if not errorlevel 1 set "GITEXE=git"
)

if not defined GITEXE (
  echo [WARN] Git was not found. Local repair is complete, but commit/push is skipped.
  goto :launch
)

if not exist ".git" (
  echo [WARN] .git was not found. Local repair is complete, but commit/push is skipped.
  goto :launch
)

echo [6/7] Committing current recovered changes...
"%GITEXE%" status --short
"%GITEXE%" add -A
if errorlevel 1 goto :error

"%GITEXE%" diff --cached --quiet
if errorlevel 1 (
  "%GITEXE%" commit -m "fix: recover failed apply update"
  if errorlevel 1 goto :error

  "%GITEXE%" remote get-url origin >nul 2>&1
  if not errorlevel 1 (
    "%GITEXE%" push
    if errorlevel 1 (
      echo [WARN] Local commit succeeded, but GitHub push failed.
      echo [WARN] Your changes are still locally in Git.
    )
  ) else (
    echo [WARN] origin is not configured. Commit is local only.
  )
) else (
  echo [INFO] No uncommitted changes were found.
)

:launch
echo [7/7] Launching DEEP LOOT...
if exist "%ROOT%\START_LOCAL.bat" (
  start "" "%ROOT%\START_LOCAL.bat"
) else (
  echo [WARN] START_LOCAL.bat was not found.
)

echo.
echo ============================================================
echo [OK] RECOVERY COMPLETE
echo No :mustfind label is used.
echo No local files were reset or deleted.
echo ============================================================
timeout /t 3 /nobreak >nul
popd
endlocal
exit /b 0

:error
echo.
echo ============================================================
echo [FAILED] RECOVERY NOT COMPLETE
echo Nothing was reset or deleted.
echo Read the first error shown above.
echo ============================================================
pause
popd
endlocal
exit /b 1
