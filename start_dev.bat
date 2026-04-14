@echo off
echo ==========================================
echo Starting ATS Development Environment...
echo ==========================================

:: Start the FastAPI backend in a new command window
echo Starting Backend (FastAPI)...
start "ATS Backend" cmd /k "uvicorn app.main:app --reload"

:: Start the React frontend in a new command window
echo Starting Frontend (Vite)...
start "ATS Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services have been launched in separate windows!
echo - Backend API: http://localhost:8000
echo - Frontend SPA: http://localhost:5173 (default)
echo.
pause
