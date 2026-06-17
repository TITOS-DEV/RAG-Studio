@echo off
echo Starting RAG Studio...
echo.

start "RAG Studio - Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 2 /nobreak > nul
start "RAG Studio - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Ambos servidores iniciados en ventanas separadas.
