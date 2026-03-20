# Reconocimiento de Palma/Dorso con Red Neuronal

## Instalación Automática (Windows)

### Opción 1: Ejecutar el instalador
```bash
cd python
install.bat
```

### Opción 2: Instalación manual

1. **Descarga Python** desde: https://www.python.org/downloads/
   - Durante la instalación, marca **"Add Python to PATH"**

2. **Abre una terminal** y ejecuta:
```bash
pip install tensorflow opencv-python numpy pillow scikit-learn
```

## Estructura del Proyecto

```
python/
├── reconocimiento_palma/
│   ├── dataset/
│   │   ├── palm/          # Agrega aquí imágenes de palmas
│   │   └── dorso/         # Agrega aquí imágenes de dorsos
│   ├── train_model.py     # Entrena la red neuronal
│   ├── predict.py         # Predicción en tiempo real con cámara
│   ├── requirements.txt   # Dependencias
│   └── palm_dorso_model.h5  # Modelo entrenado (se genera después)
└── install.bat           # Instalador automático
```

## Cómo usar

### 1. Agregar imágenes de entrenamiento

Crea carpetas y agrega imágenes:
- `reconocimiento_palma/dataset/palm/` - fotos de palmas (mínimo 20)
- `reconocimiento_palma/dataset/dorso/` - fotos de dorsos (mínimo 20)

**Consejos:**
- Fondo uniforme (oscuro)
- Buena iluminación
- Mano completa visible
- Formato: JPG o PNG

### 2. Entrenar el modelo
```bash
cd reconocimiento_palma
python train_model.py
```

Esto genera: `palm_dorso_model.h5`

### 3. Ejecutar reconocimiento
```bash
python predict.py
```

## El modelo CNN

- **Entrada**: 64x64 píxeles, escala de grises
- **Capas**: Conv2D → MaxPooling → Conv2D → MaxPooling → Dense
- **Salida**: Palma (0) o Dorso (1)

## Requisitos

- Windows 10/11
- Python 3.8+
- Cámara web
- ~3GB libre para TensorFlow
