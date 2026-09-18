@echo off
cd /d "%~dp0"
if not exist "data" mkdir "data"
echo [SYNC START] %date% %time% >> "%~dp0data\sync.log"
"C:\Program Files\nodejs\node.exe" sync-to-cloud.js >> "%~dp0data\sync.log" 2>&1
echo [SYNC END] %date% %time% >> "%~dp0data\sync.log"
echo ---------------------------------------------------- >> "%~dp0data\sync.log"
