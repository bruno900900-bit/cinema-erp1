@echo off
echo Iniciando Backend Cinema ERP...
cd backend
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo Venv nao encontrado, tentando rodar sem venv...
)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8020 --reload
pause
