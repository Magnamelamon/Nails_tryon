@echo off
echo ========================================
echo   INSTALADOR - Python y Librerias
echo ========================================
echo.

echo [1/4] Verificando Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Python ya esta instalado
    goto :check_pip
)

echo.
echo Python no encontrado. Abriendo descarga...
echo Por favor descarga Python desde: https://www.python.org/downloads/
echo.
echo IMPORTANTE: Durante la instalacion, marca "Add Python to PATH"
echo.
pause
exit /b 1

:check_pip
echo.
echo [2/4] Verificando pip...
python -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Reinstallando pip...
    python -m ensurepip --upgrade
)

echo.
echo [3/4] Instalando librerias...
echo Esto puede tomar varios minutos...

python -m pip install --upgrade pip
python -m pip install tensorflow
python -m pip install opencv-python
python -m pip install numpy
python -m pip install pillow
python -m pip install scikit-learn

echo.
echo [4/4] Verificando instalacion...
python -c "import tensorflow; import cv2; import numpy; print('Todas las librerias instaladas correctamente!')"

echo.
echo ========================================
echo   INSTALACION COMPLETA
echo ========================================
echo.
echo Ahora puedes ejecutar:
echo   python train_model.py
echo   python predict.py
echo.
pause
