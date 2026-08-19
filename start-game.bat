@echo off
title WORLD TYCOON - Local Server Launcher
echo ===================================================
echo        STARTING WORLD TYCOON LOCAL SERVER
echo ===================================================
echo.

:: Ensure Node.js is in PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

cd /d "D:\World Tycoon"

:: Check if node is accessible
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found in "C:\Program Files\nodejs" or your system PATH.
    echo Please install Node.js from https://nodejs.org or restart your terminal.
    pause
    exit /b 1
)

echo Starting local development server...
echo.
echo Your game will be available at:
echo http://localhost:5173/world-tycoon/
echo.
echo (Press Ctrl+C to stop the server at any time)
echo ===================================================
echo.

:: Launch the default browser after 2 seconds in background
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173/world-tycoon/"

:: Run the dev server
call "C:\Program Files\nodejs\npm.cmd" run dev

pause
