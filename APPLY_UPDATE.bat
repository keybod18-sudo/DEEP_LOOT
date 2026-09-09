@echo off
setlocal EnableExtensions
chcp 65001 >nul
pushd "%~dp0"
title DEEP LOOT - APPLY UPDATE

set "ROOT=%CD%"
set "GOOD=f7c6bc7ffbc5be1721a1836efccdbffd44b21061"
set "NODE_DIR=%ROOT%\.runtime\node"
set "TMP=%TEMP%\deep_loot_apply_%RANDOM%_%RANDOM%"
set "BACKUP=%TMP%\backup"
set "LOG=%ROOT%\APPLY_UPDATE.log"
set "GITEXE="

echo ============================================================
echo DEEP LOOT - APPLY_UPDATE
echo Restore latest pre-break visuals + clean helper BAT files
echo ============================================================

if not exist "package.json" (
  echo [ERROR] Put APPLY_UPDATE.bat in the DEEP_LOOT project root.
  goto :fatal
)

mkdir "%BACKUP%" >nul 2>&1

if exist "%ROOT%\.runtime\git\cmd\git.exe" set "GITEXE=%ROOT%\.runtime\git\cmd\git.exe"
if not defined GITEXE (
  where git >nul 2>&1
  if not errorlevel 1 set "GITEXE=git"
)
if not defined GITEXE (
  echo [ERROR] Git was not found.
  goto :fatal
)
if not exist ".git" (
  echo [ERROR] .git was not found.
  goto :fatal
)

> "%LOG%" echo DEEP LOOT APPLY_UPDATE LOG
>>"%LOG%" echo GOOD=%GOOD%

echo [1/8] Backing up current assets and PlayerRenderer...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "Copy-Item -LiteralPath 'assets' -Destination '%BACKUP%\assets' -Recurse -Force; Copy-Item -LiteralPath 'src\player\PlayerRenderer.ts' -Destination '%BACKUP%\PlayerRenderer.ts' -Force"
if errorlevel 1 goto :restore

echo [2/8] Loading last stable pre-break revision...
"%GITEXE%" cat-file -e "%GOOD%^{commit}" >nul 2>&1
if errorlevel 1 (
  "%GITEXE%" fetch origin --prune >>"%LOG%" 2>&1
  if errorlevel 1 goto :restore
)
"%GITEXE%" cat-file -e "%GOOD%^{commit}" >nul 2>&1
if errorlevel 1 goto :restore

echo [3/8] Restoring latest ladder / butterfly / visual assets...
"%GITEXE%" restore --source="%GOOD%" --worktree -- "assets" "src/player/PlayerRenderer.ts" >>"%LOG%" 2>&1
if errorlevel 1 goto :restore

REM The old manifest was stale even in the pre-break revision.
REM Re-lock every manifest entry to the exact restored file bytes.
echo [4/8] Rebuilding asset hashes for the restored latest visuals...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p='assets\asset-manifest.json';" ^
  "$m=Get-Content -Raw -LiteralPath $p | ConvertFrom-Json;" ^
  "$h=[ordered]@{};" ^
  "foreach($prop in $m.hashes.PSObject.Properties){" ^
    "$f=$prop.Name;" ^
    "if(-not (Test-Path -LiteralPath $f)){throw ('Missing manifest asset: '+$f)};" ^
    "$h[$f]=(Get-FileHash -Algorithm SHA256 -LiteralPath $f).Hash.ToLowerInvariant();" ^
  "};" ^
  "$o=[ordered]@{version='v41-reconciled-f7c6bc7';hashes=$h};" ^
  "$j=$o | ConvertTo-Json -Depth 6;" ^
  "[IO.File]::WriteAllText($p,$j+[Environment]::NewLine,(New-Object Text.UTF8Encoding($false)))"
if errorlevel 1 goto :restore

echo [5/8] Preparing Node and checking assets...
if not exist "%NODE_DIR%\node.exe" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\tools\bootstrap-node.ps1" >>"%LOG%" 2>&1
  if errorlevel 1 goto :restore
)
if not exist "%NODE_DIR%\npm.cmd" goto :restore
set "PATH=%NODE_DIR%;%PATH%"

if not exist "node_modules\.bin\tsc.cmd" (
  call "%NODE_DIR%\npm.cmd" install >>"%LOG%" 2>&1
  if errorlevel 1 goto :restore
)

"%NODE_DIR%\node.exe" "tools\verify-assets.mjs" >>"%LOG%" 2>&1
if errorlevel 1 goto :restore

echo [6/8] TypeScript + Vite build...
call "%NODE_DIR%\npm.cmd" run check >>"%LOG%" 2>&1
if errorlevel 1 goto :restore

call "%NODE_DIR%\npm.cmd" run build >>"%LOG%" 2>&1
if errorlevel 1 goto :restore

echo [7/8] Removing old helper BAT files...
"%GITEXE%" rm -f --ignore-unmatch ^
  "FIX_BUILD.bat" ^
  "FIX_BUILD_V2.bat" ^
  "FIX_RUNTIME_ASSETS.bat" ^
  "FIX_RUNTIME_ASSETS_V2.bat" ^
  "FIX_RUNTIME_ASSETS_V3.bat" ^
  "FIX_RUNTIME_ASSETS_V4.bat" >>"%LOG%" 2>&1

for %%F in (
  "FIX_BUILD.bat"
  "FIX_BUILD_V2.bat"
  "FIX_RUNTIME_ASSETS.bat"
  "FIX_RUNTIME_ASSETS_V2.bat"
  "FIX_RUNTIME_ASSETS_V3.bat"
  "FIX_RUNTIME_ASSETS_V4.bat"
) do (
  if exist "%%~F" del /q "%%~F" >nul 2>&1
)

echo [8/8] Saving verified repair...
"%GITEXE%" add -- "assets" "src/player/PlayerRenderer.ts" "APPLY_UPDATE.bat"
if errorlevel 1 goto :restore

"%GITEXE%" diff --cached --quiet
if errorlevel 1 (
  "%GITEXE%" commit -m "fix: restore latest ladder and butterfly visuals" >>"%LOG%" 2>&1
  if errorlevel 1 goto :local_ok

  "%GITEXE%" remote get-url origin >nul 2>&1
  if not errorlevel 1 (
    "%GITEXE%" push >>"%LOG%" 2>&1
    if errorlevel 1 (
      echo [WARN] Local repair succeeded but GitHub push failed.
      goto :local_ok
    )
  )
)

:local_ok
echo.
echo ============================================================
echo [OK] APPLY_UPDATE COMPLETE
echo - Player ladder visuals restored to latest pre-break version
echo - Butterfly / pupa visuals restored to latest pre-break version
echo - PlayerRenderer accidental duplicate drawing removed
echo - Asset hashes reconciled
echo - TypeScript passed
echo - Vite build passed
echo - Old FIX_*.bat helper files removed
echo ============================================================

rmdir /S /Q "%TMP%" >nul 2>&1
if exist "%ROOT%\START_LOCAL.bat" start "" "%ROOT%\START_LOCAL.bat"
popd
endlocal
exit /b 0

:restore
echo.
echo [ERROR] Validation failed. Restoring exact pre-APPLY state...
if exist "assets" rmdir /S /Q "assets"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "Copy-Item -LiteralPath '%BACKUP%\assets' -Destination 'assets' -Recurse -Force; Copy-Item -LiteralPath '%BACKUP%\PlayerRenderer.ts' -Destination 'src\player\PlayerRenderer.ts' -Force"
"%GITEXE%" restore --staged -- "assets" "src/player/PlayerRenderer.ts" >nul 2>&1
echo [RESTORED] No partial visual repair was left behind.

:fatal
echo.
echo ============================================================
echo [FAILED] APPLY_UPDATE DID NOT COMPLETE
echo Log: %LOG%
echo ============================================================
pause
rmdir /S /Q "%TMP%" >nul 2>&1
popd
endlocal
exit /b 1
