@echo off
start http://localhost:5180/

REM Inicia o frontend sem abrir janela
npm run dev

REM Abrir o navegador no frontend
cd backend 
npm start

exit
