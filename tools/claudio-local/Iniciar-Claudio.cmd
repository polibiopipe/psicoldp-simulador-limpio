@echo off
setlocal
cd /d "%~dp0"
py -3.12 --version >nul 2>&1
if errorlevel 1 (
  echo Instala Python 3.12 desde python.org y vuelve a abrir este archivo.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" py -3.12 -m venv .venv
if errorlevel 1 goto error
if not exist ".venv\claudio-ready" (
  .venv\Scripts\python.exe -m pip install torch==2.6.0 --index-url https://download.pytorch.org/whl/cpu
  if errorlevel 1 goto error
  .venv\Scripts\python.exe -m pip install -r requirements.txt
  if errorlevel 1 goto error
  .venv\Scripts\python.exe download_models.py
  if errorlevel 1 goto error
  echo ready > .venv\claudio-ready
)
.venv\Scripts\python.exe server.py --device CPU
if errorlevel 1 goto error
exit /b 0
:error
echo No se pudo iniciar Claudio. Conserva el mensaje anterior para revisar el problema.
pause
exit /b 1
