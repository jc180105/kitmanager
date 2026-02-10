@echo off
setlocal enabledelayedexpansion
echo Starting Kitnet Manager (Frontend Only)...

set "NPM_CMD=npm"

REM Check standard locations
if exist "C:\Program Files\nodejs\npm.cmd" (
    set "NPM_CMD=call \"C:\Program Files\nodejs\npm.cmd\""
    goto :FoundNpm
)

if exist "C:\Program Files (x86)\nodejs\npm.cmd" (
    set "NPM_CMD=call \"C:\Program Files (x86)\nodejs\npm.cmd\""
    goto :FoundNpm
)

REM Check PATH
where npm >nul 2>nul
if %errorlevel% equ 0 (
    set "NPM_CMD=npm"
    goto :FoundNpm
)

echo.
echo ERROR: Node.js / NPM was not found!
echo Double-check if you installed it correctly.
echo.
pause
exit /b

:FoundNpm
echo Using NPM: !NPM_CMD!
echo Connects to Backend at: https://kitmanager-production.up.railway.app
echo Starting Frontend...

start "Kitnet Frontend" cmd /k "cd frontend && !NPM_CMD! run dev"

timeout /t 5 >nul
start http://localhost:5173
