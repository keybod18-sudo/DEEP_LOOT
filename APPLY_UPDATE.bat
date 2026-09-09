@echo off
setlocal EnableExtensions
chcp 65001 >nul
pushd "%~dp0"
title DEEP LOOT - APPLY_UPDATE

set "ROOT=%CD%"
set "BUTTERFLY_GOOD=38795409094f309e3ed041b7049dbe7efcb9ddab"
set "NODE_DIR=%ROOT%\.runtime\node"
set "TMP=%TEMP%\deep_loot_apply_%RANDOM%_%RANDOM%"
set "BACKUP=%TMP%\backup"
set "LOG=%ROOT%\APPLY_UPDATE.log"
set "GITEXE="

echo ============================================================
echo DEEP LOOT - APPLY_UPDATE
echo Monkey / Kyokoki / Butterfly repair
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
>>"%LOG%" echo Butterfly source: %BUTTERFLY_GOOD%

echo [1/8] Backing up current target files...
copy /y "src\enemies\ThreeWiseMonkey.ts" "%BACKUP%\ThreeWiseMonkey.ts" >nul
if errorlevel 1 goto :fatal
copy /y "src\enemies\Kyokoki.ts" "%BACKUP%\Kyokoki.ts" >nul
if errorlevel 1 goto :fatal
copy /y "assets\asset-manifest.json" "%BACKUP%\asset-manifest.json" >nul
if errorlevel 1 goto :fatal

xcopy /E /I /Y "assets\monsters\caterpillar\butterfly_fly" "%BACKUP%\butterfly_fly" >nul
if errorlevel 1 goto :fatal
xcopy /E /I /Y "assets\monsters\caterpillar\butterfly_ram" "%BACKUP%\butterfly_ram" >nul
if errorlevel 1 goto :fatal
xcopy /E /I /Y "assets\monsters\caterpillar\butterfly_powder" "%BACKUP%\butterfly_powder" >nul
if errorlevel 1 goto :fatal

echo [2/8] Loading approved butterfly animation frames...
"%GITEXE%" cat-file -e "%BUTTERFLY_GOOD%^{commit}" >nul 2>&1
if errorlevel 1 (
  "%GITEXE%" fetch origin --prune >>"%LOG%" 2>&1
  if errorlevel 1 goto :restore
)

"%GITEXE%" cat-file -e "%BUTTERFLY_GOOD%^{commit}" >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Approved butterfly revision was not found.
  goto :restore
)

"%GITEXE%" restore --source="%BUTTERFLY_GOOD%" --worktree -- "assets/monsters/caterpillar/butterfly_fly" "assets/monsters/caterpillar/butterfly_ram" "assets/monsters/caterpillar/butterfly_powder" >>"%LOG%" 2>&1
if errorlevel 1 goto :restore

echo [3/8] Fixing monkey and Kyokoki visual sizes...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$p='src\enemies\ThreeWiseMonkey.ts';$s=[IO.File]::ReadAllText($p);$s=$s.Replace('const DRAW_W = 32;','const DRAW_W = 36;');$s=$s.Replace('const DRAW_H = 34;','const DRAW_H = 42;');[IO.File]::WriteAllText($p,$s,(New-Object Text.UTF8Encoding($false)))"
if errorlevel 1 goto :restore

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$p='src\enemies\Kyokoki.ts';$s=[IO.File]::ReadAllText($p);$s=$s.Replace('const DRAW_H = 40;','const DRAW_H = 46;');[IO.File]::WriteAllText($p,$s,(New-Object Text.UTF8Encoding($false)))"
if errorlevel 1 goto :restore

findstr /C:"const DRAW_W = 36;" "src\enemies\ThreeWiseMonkey.ts" >nul
if errorlevel 1 (
  echo [ERROR] Monkey DRAW_W fix was not applied.
  goto :restore
)
findstr /C:"const DRAW_H = 42;" "src\enemies\ThreeWiseMonkey.ts" >nul
if errorlevel 1 (
  echo [ERROR] Monkey DRAW_H fix was not applied.
  goto :restore
)
findstr /C:"const DRAW_H = 46;" "src\enemies\Kyokoki.ts" >nul
if errorlevel 1 (
  echo [ERROR] Kyokoki DRAW_H fix was not applied.
  goto :restore
)

echo [4/8] Updating butterfly hashes only...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$p='assets\asset-manifest.json';$raw=[IO.File]::ReadAllText($p);$m=ConvertFrom-Json -InputObject $raw;foreach($prop in $m.hashes.PSObject.Properties){$f=$prop.Name;if($f -like 'assets/monsters/caterpillar/butterfly_*'){if(-not (Test-Path -LiteralPath $f)){throw ('Missing butterfly asset: '+$f)};$hash=(Get-FileHash -Algorithm SHA256 -LiteralPath $f).Hash.ToLowerInvariant();$prop.Value=$hash}};$m.version='butterfly-motionfix-monkey-kyokoki-v3';$j=ConvertTo-Json -InputObject $m -Depth 8;[IO.File]::WriteAllText($p,$j+[Environment]::NewLine,(New-Object Text.UTF8Encoding($false)))"
if errorlevel 1 (
  echo [ERROR] Manifest update failed.
  goto :restore
)

echo [5/8] Preparing Node...
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

echo [6/8] Verifying assets and TypeScript...
"%NODE_DIR%\node.exe" "tools\verify-assets.mjs" >>"%LOG%" 2>&1
if errorlevel 1 (
  echo [ERROR] Asset verification failed. See APPLY_UPDATE.log
  goto :restore
)

call "%NODE_DIR%\npm.cmd" run check >>"%LOG%" 2>&1
if errorlevel 1 (
  echo [ERROR] TypeScript check failed. See APPLY_UPDATE.log
  goto :restore
)

echo [7/8] Running Vite build...
call "%NODE_DIR%\npm.cmd" run build >>"%LOG%" 2>&1
if errorlevel 1 (
  echo [ERROR] Vite build failed. See APPLY_UPDATE.log
  goto :restore
)

echo [8/8] Commit and push...
"%GITEXE%" add -- "src/enemies/ThreeWiseMonkey.ts" "src/enemies/Kyokoki.ts" "assets/asset-manifest.json" "assets/monsters/caterpillar/butterfly_fly" "assets/monsters/caterpillar/butterfly_ram" "assets/monsters/caterpillar/butterfly_powder" "APPLY_UPDATE.bat"
if errorlevel 1 goto :restore

"%GITEXE%" diff --cached --quiet
if errorlevel 1 (
  "%GITEXE%" commit -m "fix: monkey kyokoki and butterfly animation" >>"%LOG%" 2>&1
  if errorlevel 1 goto :restore

  "%GITEXE%" remote get-url origin >nul 2>&1
  if not errorlevel 1 (
    "%GITEXE%" push >>"%LOG%" 2>&1
    if errorlevel 1 echo [WARN] Local commit succeeded but GitHub push failed.
  )
)

echo.
echo ============================================================
echo [OK] APPLY_UPDATE COMPLETE
echo - Monkey visual size: 36 x 42
echo - Kyokoki visual height: 46
echo - Butterfly fly / ram / powder frames restored
echo - Asset verification passed
echo - TypeScript passed
echo - Vite build passed
echo ============================================================

rmdir /S /Q "%TMP%" >nul 2>&1
if exist "%ROOT%\START_LOCAL.bat" start "" "%ROOT%\START_LOCAL.bat"
popd
endlocal
exit /b 0

:restore
echo.
echo [ERROR] Update failed. Restoring the exact pre-update state...

copy /y "%BACKUP%\ThreeWiseMonkey.ts" "src\enemies\ThreeWiseMonkey.ts" >nul
copy /y "%BACKUP%\Kyokoki.ts" "src\enemies\Kyokoki.ts" >nul
copy /y "%BACKUP%\asset-manifest.json" "assets\asset-manifest.json" >nul

if exist "assets\monsters\caterpillar\butterfly_fly" rmdir /S /Q "assets\monsters\caterpillar\butterfly_fly"
if exist "assets\monsters\caterpillar\butterfly_ram" rmdir /S /Q "assets\monsters\caterpillar\butterfly_ram"
if exist "assets\monsters\caterpillar\butterfly_powder" rmdir /S /Q "assets\monsters\caterpillar\butterfly_powder"

xcopy /E /I /Y "%BACKUP%\butterfly_fly" "assets\monsters\caterpillar\butterfly_fly" >nul
xcopy /E /I /Y "%BACKUP%\butterfly_ram" "assets\monsters\caterpillar\butterfly_ram" >nul
xcopy /E /I /Y "%BACKUP%\butterfly_powder" "assets\monsters\caterpillar\butterfly_powder" >nul

"%GITEXE%" restore --staged -- "src/enemies/ThreeWiseMonkey.ts" "src/enemies/Kyokoki.ts" "assets/asset-manifest.json" "assets/monsters/caterpillar/butterfly_fly" "assets/monsters/caterpillar/butterfly_ram" "assets/monsters/caterpillar/butterfly_powder" >nul 2>&1

echo [RESTORED] No partial update was left behind.

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
