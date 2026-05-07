@echo off
echo Setting up Flask backend for Mental Wellness Chatbot...
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo.
    echo Please create a .env file with your Groq API key:
    echo GROQ_API_KEY=your_api_key_here
    echo.
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting Flask server...
echo Backend will be available at http://localhost:5000
echo.
python app.py

pause
