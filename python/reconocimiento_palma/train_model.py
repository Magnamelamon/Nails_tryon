import os
import cv2
import numpy as np
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
import pickle

DATA_DIR = "dataset"
IMG_SIZE = 64

def load_dataset():
    images = []
    labels = []
    
    for label, class_name in enumerate(["palm", "dorso"]):
        class_dir = os.path.join(DATA_DIR, class_name)
        if not os.path.exists(class_dir):
            print(f" Carpeta no encontrada: {class_dir}")
            continue
            
        for filename in os.listdir(class_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                img_path = os.path.join(class_dir, filename)
                img = cv2.imread(img_path)
                if img is not None:
                    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
                    img = img / 255.0
                    images.append(img)
                    labels.append(label)
    
    if len(images) == 0:
        print("No se encontraron imagenes. Agrega imagenes a dataset/palm y dataset/dorso")
        return None, None
    
    images = np.array(images).reshape(-1, IMG_SIZE, IMG_SIZE, 1)
    labels = np.array(labels)
    
    return images, labels

def create_model():
    model = keras.Sequential([
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=(IMG_SIZE, IMG_SIZE, 1)),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Flatten(),
        layers.Dropout(0.5),
        layers.Dense(128, activation='relu'),
        layers.Dense(2, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train():
    print("Cargando dataset...")
    X, y = load_dataset()
    
    if X is None:
        return
    
    print(f"Imagenes cargadas: {len(X)}")
    print(f"   - Palma: {sum(y == 0)}")
    print(f"   - Dorso: {sum(y == 1)}")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("\nCreando modelo...")
    model = create_model()
    model.summary()
    
    print("\nEntrenando modelo...")
    history = model.fit(
        X_train, y_train,
        epochs=15,
        batch_size=16,
        validation_data=(X_test, y_test),
        verbose=1
    )
    
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nPrecision en prueba: {test_acc*100:.2f}%")
    
    model.save("palm_dorso_model.h5")
    print("\nModelo guardado como 'palm_dorso_model.h5'")
    
    with open("history.pkl", "wb") as f:
        pickle.dump(history.history, f)
    
    return model

if __name__ == "__main__":
    train()
