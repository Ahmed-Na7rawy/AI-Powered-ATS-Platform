@echo off
echo Creating Python Virtual Environment...
python -m venv .venv

echo Activating Virtual Environment...
call .venv\Scripts\activate.bat

echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing dependencies (including pypdf and PyPDF2) into venv...
pip install -r requirements.txt

echo Virtual environment setup complete!
echo To use this environment, make sure to run: .venv\Scripts\activate
cmd /k
