@echo off
setlocal EnableExtensions
chcp 65001 >nul
pushd "%~dp0"
title DEEP LOOT - Fix Build V2

echo ============================================================
echo DEEP LOOT - FIX BUILD V2
echo ============================================================

if not exist "package.json" (
  echo [ERROR] Put this BAT in the DEEP_LOOT project root.
  goto :error
)

set "ROOT=%CD%"
set "NODE_DIR=%ROOT%\.runtime\node"
set "BACKUP=%TEMP%\deep_loot_fix_v2_%RANDOM%_%RANDOM%"
mkdir "%BACKUP%" >nul 2>&1

echo [1/6] Backing up current broken files...
copy /y "src\player\PlayerRenderer.ts" "%BACKUP%\PlayerRenderer.ts" >nul
if errorlevel 1 goto :error
copy /y "src\stage\Stage.ts" "%BACKUP%\Stage.ts" >nul
if errorlevel 1 goto :error

echo [2/6] Repairing PlayerRenderer.ts...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p='src\player\PlayerRenderer.ts';" ^
  "$s=[IO.File]::ReadAllText($p);" ^
  "$s=[Text.RegularExpressions.Regex]::Replace($s,'(?m)^[ \t]*const[ \t]+attackBodyImage[ \t]*=.*?;\r?\n','');" ^
  "$s=$s.Replace('attackBodyImage','image');" ^
  "[IO.File]::WriteAllText($p,$s,(New-Object Text.UTF8Encoding($false)))"
if errorlevel 1 goto :restore

echo [3/6] Removing only the second duplicate drawLadder in Stage.ts...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p='src\stage\Stage.ts';" ^
  "$s=[IO.File]::ReadAllText($p);" ^
  "$m='  private drawLadder(ctx: CanvasRenderingContext2D, ladder: StageLadder): void {';" ^
  "$first=$s.IndexOf($m);" ^
  "if($first -lt 0){throw 'drawLadder not found'};" ^
  "$second=$s.IndexOf($m,$first+$m.Length);" ^
  "if($second -ge 0){" ^
    "$next=$s.IndexOf('  private drawPlatformUnderside(', $second);" ^
    "if($next -lt 0){throw 'drawPlatformUnderside not found after duplicate drawLadder'};" ^
    "$s=$s.Remove($second,$next-$second);" ^
    "[IO.File]::WriteAllText($p,$s,(New-Object Text.UTF8Encoding($false)));" ^
  "}else{Write-Host '[INFO] Stage drawLadder duplicate already gone.'}"
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

echo [6/6] Commit, push, then launch...
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
    "%GITEXE%" commit -m "fix: repair failed update build"
    if errorlevel 1 goto :error
    "%GITEXE%" remote get-url origin >nul 2>&1
    if not errorlevel 1 (
      "%GITEXE%" push
      if errorlevel 1 echo [WARN] Commit succeeded locally, but GitHub push failed.
    )
  ) else (
    echo [INFO] No new changes to commit.
  )
)

echo.
echo ============================================================
echo [OK] TYPESCRIPT CHECK PASSED
echo Backup: %BACKUP%
echo ============================================================

if exist "%ROOT%\START_LOCAL.bat" start "" "%ROOT%\START_LOCAL.bat"
timeout /t 3 /nobreak >nul
popd
endlocal
exit /b 0

:restore
echo.
echo [ERROR] Verification failed. Restoring the two files...
copy /y "%BACKUP%\PlayerRenderer.ts" "src\player\PlayerRenderer.ts" >nul
copy /y "%BACKUP%\Stage.ts" "src\stage\Stage.ts" >nul
echo [RESTORED] Original files restored.
goto :error

:error
echo.
echo ============================================================
echo [FAILED] FIX V2 NOT COMPLETE
echo No git reset was used.
echo ============================================================
pause
popd
endlocal
exit /b 1
