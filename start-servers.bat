@echo off
REM Quick launcher: starts the local RSS proxy and a static server
REM Requires: Node 18+ (for the proxy) and Python (for static server)

SETLOCAL ENABLEDELAYEDEXPANSION

REM Start RSS proxy in a new window
start "RSS Proxy" cmd /c "cd /d %~dp0server && if not exist node_modules npm install && npm start"

REM Give the proxy a moment to start
timeout /t 2 >nul

REM Start static server on port 8000 in a new window
start "Static Server" cmd /c "cd /d %~dp0 && python -m http.server 8000"

echo.
echo Launched:
echo  - RSS Proxy: http://localhost:3000 (or next free port)
echo  - Static Site: http://localhost:8000
echo.
echo Tip: In VS Code, use Tasks > Run Task > Start RSS Proxy / Start Static Server

ENDLOCAL
