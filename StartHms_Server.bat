@echo off
rem —– FINESTRA 1: backend
start "Backend" cmd /k "cd /d backend && npm start"

rem —– FINESTRA 2: frontend
start "Frontend" cmd /k "cd /d frontend && npm run dev -- --host"

rem opzionale: chiudi la finestra madre
exit
