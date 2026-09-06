@echo off
cd /d %~dp0
if exist .git (
  echo Git repository already exists.
  pause
  exit /b 0
)
git init
git add .
echo.
echo Git initialized and files staged.
echo Review with: git status
echo Then commit with: git commit -m "chore: establish local DEEP LOOT baseline"
pause
