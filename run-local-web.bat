@echo off
title He Thong Theo Doi Bo Chi So 766 (Ban Noi Bo)
cd /d "%~dp0"

echo ====================================================
echo   DANG KHOI DONG HE THONG WEB LOCAL 766...
echo   Dia chi: http://localhost:3000
echo   Che do:  Noi bo (Local Only - Khong day len Cloud)
echo ====================================================

:: Mo trinh duyet vao trang web local
start "" http://localhost:3000

:: Chay dev-server
"C:\Program Files\nodejs\node.exe" dev-server.js

pause
