@echo off
setlocal

set "NPM_CONFIG_UNICODE=false"
set "NPM_CONFIG_PROGRESS=false"
set "NPM_CONFIG_COLOR=false"
set "FORCE_COLOR=0"
set "NO_COLOR=1"
set "PRISMA_HIDE_UPDATE_MESSAGE=1"

REM Move to the project directory: folder where this script lives.
cd /d "%~dp0"

echo =========================================
echo IA Detector - Windows Local Launcher
echo =========================================
echo.

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm.cmd no esta disponible en PATH. Instala Node.js y vuelve a intentar.
  pause
  exit /b 1
)

where docker >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Docker no esta disponible en PATH. Instala Docker Desktop y vuelve a intentar.
  pause
  exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Docker Desktop no esta abierto o el engine no esta corriendo.
  echo Abre Docker Desktop, espera a que termine de iniciar y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

echo [1/5] Instalando o actualizando dependencias...
call npm.cmd install
if errorlevel 1 goto :fail

echo.
echo [2/5] Iniciando PostgreSQL local en Docker...

docker start ia-detector-postgres >nul 2>nul
if errorlevel 1 (
  echo [INFO] El contenedor ia-detector-postgres no existe o no se pudo iniciar.
  echo [INFO] Intentando crearlo...

  docker run --name ia-detector-postgres ^
    -e POSTGRES_USER=postgres ^
    -e POSTGRES_PASSWORD=postgres ^
    -e POSTGRES_DB=ia_detector ^
    -p 5432:5432 ^
    -d postgres:15

  if errorlevel 1 (
    echo.
    echo [ERROR] No se pudo iniciar ni crear ia-detector-postgres.
    echo Revisa los contenedores existentes con:
    echo docker ps -a
    echo.
    echo Si el contenedor existe, intenta:
    echo docker start ia-detector-postgres
    echo.
    goto :fail
  )
) else (
  echo [INFO] PostgreSQL local listo en Docker.
)

echo.
echo [3/5] Generando Prisma Client...
call npm.cmd run db:generate
if errorlevel 1 goto :fail

echo.
echo [4/5] Aplicando schema Prisma a PostgreSQL local...
call npm.cmd run db:push
if errorlevel 1 goto :fail

echo.
echo [5/5] Abriendo terminales de backend y frontend...

start "IA Detector - Backend" cmd /k "cd /d ""%~dp0"" && set NPM_CONFIG_UNICODE=false && set NPM_CONFIG_PROGRESS=false && set NPM_CONFIG_COLOR=false && set FORCE_COLOR=0 && set NO_COLOR=1 && npm.cmd run dev:backend"

start "IA Detector - Frontend" cmd /k "cd /d ""%~dp0"" && set NPM_CONFIG_UNICODE=false && set NPM_CONFIG_PROGRESS=false && set NPM_CONFIG_COLOR=false && set FORCE_COLOR=0 && set NO_COLOR=1 && npm.cmd run dev:frontend"

echo.
echo =========================================
echo IA Detector iniciado.
echo Frontend:    http://localhost:5173
echo Backend API: http://localhost:3000/api
echo Health:      http://localhost:3000/api/health
echo =========================================
echo.
echo Si cambiaste BACKEND_PORT o el puerto de Vite, ajusta estas URLs.
echo.
pause
exit /b 0

:fail
echo.
echo [ERROR] Ocurrio un problema al preparar o iniciar la app.
echo Revisa el mensaje anterior para identificar el paso que fallo.
pause
exit /b 1