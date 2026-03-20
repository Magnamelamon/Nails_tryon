@echo off
echo ========================================
echo   INSTALADOR - Python 3.11
echo ========================================
echo.

echo Descargando Python 3.11...
echo Esto puede tomar unos minutos...

powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe' -OutFile 'python-installer.exe'"

echo.
echo Ejecurando instalador...
echo.
echo DURANTE LA INSTALACION:
echo 1. Marca "Add Python 3.11 to PATH"
echo 2. Click en "Install Now"
echo.
pause

start python-installer.exe

echo.
echo Despues de instalar, presiona cualquier tecla...
pause

echo.
echo Verificando Python 3.11...
"C:\Users\crism\AppData\Local\Programs\Python\Python311\python.exe" --version

if exist "C:\Users\crism\AppData\Local\Programs\Python\Python311\python.exe" (
    echo.
    echo Python 3.11 instalado correctamente!
    echo.
    echo Instalando librerias...
    "C:\Users\crism\AppData\Local\Programs\Python\Python311\python.exe" -m pip install tensorflow opencv-python numpy pillow scikit-learn mediapipe
    echo.
    echo Listo!
) else (
    echo.
    echo Error: Python 3.11 no se encontro en la ruta esperada.
    echo Intenta ejecutar: py -3.11 --version
)

del python-installer.exe
pause
