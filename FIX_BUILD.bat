@echo off
setlocal EnableExtensions
chcp 65001 >nul
pushd "%~dp0"
title DEEP LOOT - Fix Build Errors

echo ============================================================
echo DEEP LOOT - FIX CURRENT 6 TYPESCRIPT ERRORS
echo ============================================================

if not exist "package.json" (
  echo [ERROR] Put this BAT in the DEEP_LOOT project root.
  goto :error
)

set "ROOT=%CD%"
set "NODE_DIR=%ROOT%\.runtime\node"
set "BACKUP=%TEMP%\deep_loot_recovery_%RANDOM%_%RANDOM%"
mkdir "%BACKUP%" >nul 2>&1

echo [1/6] Backing up the two broken files...
copy /y "src\player\PlayerRenderer.ts" "%BACKUP%\PlayerRenderer.ts" >nul
if errorlevel 1 goto :error
copy /y "src\stage\Stage.ts" "%BACKUP%\Stage.ts" >nul
if errorlevel 1 goto :error

echo [2/6] Fixing PlayerRenderer.ts undefined attackBodyImage...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p='src\player\PlayerRenderer.ts';" ^
  "$s=[IO.File]::ReadAllText($p);" ^
  "if($s.Contains('attackBodyImage')){$s=$s.Replace('attackBodyImage','image');[IO.File]::WriteAllText($p,$s,(New-Object Text.UTF8Encoding($false)))}else{Write-Host '[INFO] attackBodyImage was already absent.'}"
if errorlevel 1 goto :restore

echo [3/6] Removing duplicate drawLadder from Stage.ts...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p='src\stage\Stage.ts';" ^
  "$s=[IO.File]::ReadAllText($p);" ^
  "$m='  private drawLadder(ctx: CanvasRenderingContext2D, ladder: StageLadder): void {';" ^
  "$a=$s.IndexOf($m);" ^
  "if($a -lt 0){throw 'drawLadder was not found'};" ^
  "$b=$s.IndexOf($m,$a+$m.Length);" ^
  "if($b -ge 0){" ^
    "$next=$s.IndexOf('  private drawPlatformUnderside(', $b);" ^
    "if($next -lt 0){throw 'Could not find drawPlatformUnderside after duplicate drawLadder'};" ^
    "$s=$s.Remove($b,$next-$b);" ^
    "[IO.File]::WriteAllText($p,$s,(New-Object Text.UTF8Encoding($false)));" ^
  "}else{Write-Host '[INFO] Duplicate drawLadder was already absent.'}"
if errorlevel 1 goto :restore

echo [4/6] Preparing Node...
if not exist "%NODE_DIR%\node.exe" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\tools\bootstrap-node.ps1"
  if errorlevel 1 goto :restore
)
if not exist "%NODE_DIR%\npm.cmd" goto :restore
set "PATH=%NODE_DIR%;%PATH%"

if not exist "node_modules\.bin\tsc.cmd" (
  call "%NODE_DIR%\npm.cmd" install
  if errorlevel 1 goto :restore
)

echo [5/6] Running TypeScript check...
call "%NODE_DIR%\npm.cmd" run check
if errorlevel 1 goto :restore

echo [6/6] Commit, push, and launch...
set "GITEXE="
if exist "%ROOT%\.runtime\git\cmd\git.exe" set "GITEXE=%ROOT%\.runtime\git\cmd\git.exe"
if not defined GITEXE (
  where git >nul 2>&1
  if not errorlevel 1 set "GITEXE=git"
)

if defined GITEXE if exist ".git" (
  "%GITEXE%" add -A
  "%GITEXE%" diff --cached --quiet
  if errorlevel 1 (
    "%GITEXE%" commit -m "fix: repair PlayerRenderer and duplicate ladder method"
    if errorlevel 1 goto :error
    "%GITEXE%" remote get-url origin >nul 2>&1
    if not errorlevel 1 (
      "%GITEXE%" push
      if errorlevel 1 echo [WARN] Build is fixed and committed locally, but GitHub push failed.
    )
  )
)

echo.
echo ============================================================
echo [OK] BUILD FIXED
echo - PlayerRenderer attackBodyImage error repaired
echo - Duplicate Stage.drawLadder removed
echo - TypeScript check passed
echo Backup: %BACKUP%
echo ============================================================

if exist "%ROOT%\START_LOCAL.bat" start "" "%ROOT%\START_LOCAL.bat"
timeout /t 3 /nobreak >nul
popd
endlocal
exit /b 0

:restore
echo.
echo [ERROR] Fix did not pass verification. Restoring both original files...
copy /y "%BACKUP%\PlayerRenderer.ts" "src\player\PlayerRenderer.ts" >nul
copy /y "%BACKUP%\Stage.ts" "src\stage\Stage.ts" >nul
echo [RESTORED] No broken partial fix was left behind.
goto :error

:error
echo.
echo ============================================================
echo [FAILED] FIX NOT COMPLETE
echo Nothing was reset with git.
echo ============================================================
pause
popd
endlocal
exit /b 1
