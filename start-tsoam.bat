@echo off
echo ================================================
echo  TSOAM Church Management System
echo  Starting Server...
echo ================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if setup has been run
if not exist "node_modules" (
    echo First time setup detected...
    echo Running automated setup...
    npm run setup
    if %errorlevel% neq 0 (
        echo Setup failed! Please check the errors above.
        pause
        exit /b 1
    )
)

REM Start the server
echo Starting TSOAM Church Management System...
echo.
echo Access the system at:
echo  - Local: http://localhost:3001
echo  - Network: http://%COMPUTERNAME%:3001
echo.
echo Press Ctrl+C to stop the server
echo.

cd server
npm start

pause
