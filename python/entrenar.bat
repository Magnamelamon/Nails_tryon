@echo off
chcp 65001 >nul
echo ========================================
echo   ENTRENAMIENTO CNN - PALMA vs DORSO
echo ========================================
echo.

cd /d "%~dp0python"

echo [1/2] Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python no encontrado
    pause
    exit /b 1
)

echo [2/2] Ejecutando entrenamiento...
echo.

python train_cnn.py

echo.
echo ========================================
echo   COMPLETADO
echo ========================================
echo.
pause
