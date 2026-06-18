@echo off
setlocal

set "NPM_CONFIG_UNICODE=false"
set "NPM_CONFIG_PROGRESS=false"
set "NPM_CONFIG_COLOR=false"
set "FORCE_COLOR=0"
set "NO_COLOR=1"
set "PRISMA_HIDE_UPDATE_MESSAGE=1"

REM Move to the project directory (folder where this script lives)
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm no esta disponible en PATH. Instala Node.js y vuelve a intentar.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [INFO] Instalando dependencias con npm install...
  call npm install >nul 2>&1
  if errorlevel 1 goto :fail
)

echo [INFO] Iniciando base local de Prisma (si no esta activa)...
call npx prisma dev -d -n ia-detector >nul 2>&1
if errorlevel 1 goto :fail

echo [INFO] Preparando base de datos (Prisma)...
call npm run db:generate >nul 2>&1
if errorlevel 1 goto :fail

call npm run db:push >nul 2>&1
if errorlevel 1 goto :fail

echo [INFO] Abriendo terminal para backend...
start "IA Detector - Backend" cmd /k "cd /d ""%~dp0"" && set NPM_CONFIG_UNICODE=false && set NPM_CONFIG_PROGRESS=false && set NPM_CONFIG_COLOR=false && set FORCE_COLOR=0 && set NO_COLOR=1 && npm run dev:backend"

echo [INFO] Abriendo terminal para frontend...
start "IA Detector - Frontend" cmd /k "cd /d ""%~dp0"" && set NPM_CONFIG_UNICODE=false && set NPM_CONFIG_PROGRESS=false && set NPM_CONFIG_COLOR=false && set FORCE_COLOR=0 && set NO_COLOR=1 && npm run dev:frontend"

echo.
echo =========================================
echo IA Detector iniciado.
echo Frontend:   http://localhost:5173
echo Backend API: http://localhost:3000/api
echo Health:     http://localhost:3000/api/health
echo =========================================
echo.
echo Si cambiaste BACKEND_PORT o el puerto de Vite, ajusta estas URLs.
echo.
pause
exit /b 0

:fail
echo.
echo [ERROR] Ocurrio un problema al preparar o iniciar la app.
echo Revisa los mensajes anteriores.
pause
exit /b 1
