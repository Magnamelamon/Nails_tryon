import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import numpy as np
import json

print("=" * 60)
print("  ENTRENAMIENTO CNN - RECONOCIMIENTO PALMA/DORSO")
print("  Basado en pliegues de la mano")
print("=" * 60)

np.random.seed(42)
tf.random.set_seed(42)

def generate_hand_image(hand_type, img_size=64):
    """
    Genera imagen sintética de mano basándose en pliegues
    - Palma: Tiene líneas (pliegues) horizontales
    - Dorso: Es más uniforme, sin líneas
    """
    img = np.ones((img_size, img_size, 1), dtype=np.float32) * 0.8
    
    center_y = img_size // 2
    
    if hand_type == 'palm':
        for i in range(img_size):
            for j in range(img_size):
                noise = np.random.uniform(-0.15, 0.15)
                
                crease_line = 0
                
                if 12 <= i <= 18:
                    crease_line = 0.35 * np.exp(-((j - img_size//2) ** 2) / 200)
                if 28 <= i <= 34:
                    crease_line = 0.30 * np.exp(-((j - img_size//2) ** 2) / 180)
                if 42 <= i <= 48:
                    crease_line = 0.25 * np.exp(-((j - img_size//2) ** 2) / 150)
                if 52 <= i <= 58:
                    crease_line = 0.20 * np.exp(-((j - img_size//2) ** 2) / 120)
                
                img[i, j, 0] = np.clip(0.3 + noise + crease_line, 0.05, 0.95)
                
    else:
        for i in range(img_size):
            for j in range(img_size):
                noise = np.random.uniform(-0.08, 0.08)
                img[i, j, 0] = np.clip(0.75 + noise, 0.5, 0.95)
    
    return img

NUM_SAMPLES = 1000

print(f"\n[1/5] Generando {NUM_SAMPLES} muestras...")
print(f"       - Palma: {NUM_SAMPLES} imágenes con pliegues")
print(f"       - Dorso: {NUM_SAMPLES} imágenes sin pliegues")

palm_images = np.array([generate_hand_image('palm') for _ in range(NUM_SAMPLES)])
dorso_images = np.array([generate_hand_image('dorso') for _ in range(NUM_SAMPLES)])

X = np.concatenate([palm_images, dorso_images], axis=0)
y = np.array([0] * NUM_SAMPLES + [1] * NUM_SAMPLES)

indices = np.random.permutation(len(X))
X = X[indices]
y = y[indices]

print(f"       ✓ Dataset listo: {X.shape}")

print("\n[2/5] Dividiendo datos (80% entrenamiento, 20% prueba)...")
split = int(0.8 * len(X))
X_train, X_test = X[:split], X[split:]
y_train, y_test = y[:split], y[split:]
print(f"       ✓ Entrenamiento: {len(X_train)} | Prueba: {len(X_test)}")

print("\n[3/5] Creando modelo CNN...")

model = keras.Sequential([
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(64, 64, 1)),
    layers.BatchNormalization(),
    layers.MaxPooling2D((2, 2)),
    
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling2D((2, 2)),
    
    layers.Conv2D(128, (3, 3), activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling2D((2, 2)),
    
    layers.Flatten(),
    layers.Dropout(0.5),
    
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(2, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

print(model.summary())

print("\n[4/5] Entrenando modelo...")

history = model.fit(
    X_train, y_train,
    epochs=30,
    batch_size=32,
    validation_data=(X_test, y_test),
    verbose=1
)

print("\n[5/5] Resultados y guardado...")

test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
print(f"\n  📊 RESULTADOS:")
print(f"     Precisión en entrenamiento: {history.history['accuracy'][-1]*100:.2f}%")
print(f"     Precisión en prueba: {test_acc*100:.2f}%")

model.save('palm_dorso_model.keras')
print(f"\n  ✓ Modelo guardado: palm_dorso_model.keras")

weights = model.get_weights()
weights_list = [w.tolist() for w in weights]

with open('model_weights.json', 'w') as f:
    json.dump(weights_list, f)
print(f"  ✓ Pesos guardados: model_weights.json")

with open('model_architecture.json', 'w') as f:
    f.write(model.to_json())
print(f"  ✓ Arquitectura guardada: model_architecture.json")

print("\n" + "=" * 60)
print("  ✅ ENTRENAMIENTO COMPLETADO")
print("=" * 60)
print(f"\nPara usar en React, convierte el modelo a TensorFlow.js:")
print("  npx @tensorflow/tfjs-converter --input_format keras palm_dorso_model.keras --output_path ../public/model")
