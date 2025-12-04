@echo off
REM Chrome with Remote Debugging for Claude Code
REM Close existing Chrome instances first
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak >nul

REM Start Chrome with debugging enabled
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=C:\Temp\chrome-debug --no-first-run --no-default-browser-check
