@echo off
echo ============================================
echo  RAG Studio - Setup
echo ============================================
echo.

echo [1/4] Instalando dependencias del backend...
cd backend
call npm install
cd ..
echo.

echo [2/4] Instalando dependencias del frontend...
cd frontend
call npm install
cd ..
echo.

echo [3/4] Configurando variables de entorno...
if not exist backend\.env (
  copy backend\.env.example backend\.env
  echo Archivo backend\.env creado. Edita las variables segun tu configuracion.
)
echo.

echo [4/4] Setup completo!
echo.
echo ============================================
echo  Para iniciar el proyecto:
echo.
echo  Terminal 1 (Backend):
echo    cd backend
echo    npm run dev
echo.
echo  Terminal 2 (Frontend):
echo    cd frontend
echo    npm run dev
echo.
echo  Abre: http://localhost:5173
echo ============================================
pause
