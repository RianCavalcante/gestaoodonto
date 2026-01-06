@echo off
echo Iniciando Sistema de Gestao Odonto...
echo.
echo 1. Iniciando Servidor WhatsApp (Porta 3001)...
start "Servidor WhatsApp" cmd /k "cd backend\whatsapp && node server.js"
echo.
echo 2. Iniciando Frontend Next.js (Porta 3006)...
start "Frontend Gestaoodonto" cmd /k "pnpm dev -- -p 3006"
echo.
echo Tudo iniciado! 
echo Dashboard: http://localhost:3006
echo.
pause
