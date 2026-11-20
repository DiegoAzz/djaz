@echo off
title MiniDJ - Servidor de Desarrollo
cd /d "%~dp0"
echo ====================================================
echo  Iniciando MiniDJ (Web + API Backend)...
echo ====================================================
npm.cmd run dev
pause
