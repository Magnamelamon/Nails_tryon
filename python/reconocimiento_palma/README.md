# Reconocimiento de Palma/Dorso con Red Neuronal

## Estructura del Proyecto

```
reconocimiento_palma/
├── dataset/
│   ├── palm/          # Agrega aquí imágenes de palmas
│   └── dorso/         # Agrega aquí imágenes de dorsos
├── train_model.py     # Entrena la red neuronal
├── predict.py         # Predicción en tiempo real con cámara
├── requirements.txt  # Dependencias
└── palm_dorso_model.h5  # Modelo entrenado (se genera después)
```

## Instrucciones

### 1. Instalación de dependencias
```bash
pip install -r requirements.txt
```

### 2. Agregar imágenes de entrenamiento

Crea una carpeta `dataset/palm/` y agrega imágenes de palmas (mínimo 20).
Crea una carpeta `dataset/dorso/` y agrega imágenes de dorsos (mínimo 20).

**Consejos para las imágenes:**
- Fondo uniforme (preferiblemente oscuro)
- Mano bien iluminada
- Various posiciones y orientaciones
- Formato: JPG o PNG

### 3. Entrenar el modelo
```bash
python train_model.py
```

Esto generará el archivo `palm_dorso_model.h5`

### 4. Ejecutar reconocimiento en tiempo real
```bash
python predict.py
```

## El modelo

- **Arquitectura**: CNN (Convolutional Neural Network)
- **Entradas**: Imágenes de 64x64 en escala de grises
- **Clases**: Palma, Dorso

## Requisitos

- Python 3.8+
- Cámara web
-~2GB de espacio para TensorFlow
