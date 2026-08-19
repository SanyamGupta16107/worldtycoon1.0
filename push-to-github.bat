@echo off
setlocal
cd /d "D:\World Tycoon"
echo ========================================================
echo   WORLD TYCOON 1.0 - PUSH TO GITHUB REPOSITORY
echo ========================================================
echo.
echo Target Repository: https://github.com/SanyamGupta16107/worldtycoon1.0.git
echo.

"D:\mingit\cmd\git.exe" remote remove origin 2>nul
"D:\mingit\cmd\git.exe" remote add origin https://github.com/SanyamGupta16107/worldtycoon1.0.git
"D:\mingit\cmd\git.exe" branch -M main

echo Adding changes...
"D:\mingit\cmd\git.exe" add .
"D:\mingit\cmd\git.exe" commit -m "Update GitHub Actions workflow fix and build" 2>nul

echo Pushing main branch to GitHub...
"D:\mingit\cmd\git.exe" push -u origin main --force

echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   SUCCESSFULLY PUSHED TO GITHUB!
    echo ========================================================
) else (
    echo.
    echo If GitHub asks for credentials, enter your GitHub Username and Personal Access Token.
)
pause
