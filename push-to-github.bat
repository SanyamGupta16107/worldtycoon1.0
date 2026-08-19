@echo off
setlocal
cd /d "D:\World Tycoon"
echo ========================================================
echo   WORLD TYCOON 1.0 - PUSH TO GITHUB REPOSITORY
echo ========================================================
echo.
echo Please create a new GitHub repository named: WorldTycoon-1.0
echo at: https://github.com/new
echo.
set /p REPO_URL="Enter your GitHub Repository URL (or press Enter for default): "
if "%REPO_URL%"=="" set REPO_URL=https://github.com/SanyamGupta16107/WorldTycoon-1.0.git

echo.
echo Setting remote origin to: %REPO_URL%
"D:\mingit\cmd\git.exe" remote remove origin 2>nul
"D:\mingit\cmd\git.exe" remote add origin %REPO_URL%
"D:\mingit\cmd\git.exe" branch -M main

echo Pushing main branch to GitHub...
"D:\mingit\cmd\git.exe" push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   SUCCESSFULLY PUSHED TO GITHUB!
    echo ========================================================
) else (
    echo.
    echo If GitHub requested credentials, sign in with your GitHub Personal Access Token.
)
pause
