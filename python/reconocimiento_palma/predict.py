import cv2
import numpy as np
import mediapipe as mp
from tensorflow import keras
import os

MODEL_PATH = "palm_dorso_model.h5"
IMG_SIZE = 64

def load_model():
    if not os.path.exists(MODEL_PATH):
        print(f"Modelo no encontrado: {MODEL_PATH}")
        print("   Ejecuta primero: python train_model.py")
        return None
    return keras.models.load_model(MODEL_PATH)

def preprocess_hand(landmarks, img_width, img_height):
    points = []
    for lm in landmarks:
        x = int(lm.x * img_width)
        y = int(lm.y * img_height)
        points.append((x, y))
    
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    padding = 20
    min_x = max(0, min_x - padding)
    min_y = max(0, min_y - padding)
    max_x = min(img_width, max_x + padding)
    max_y = min(img_height, max_y + padding)
    
    return min_x, min_y, max_x, max_y

def predict_hand(model, frame, hand_landmarks):
    if model is None:
        return None, 0
    
    h, w = frame.shape[:2]
    
    min_x, min_y, max_x, max_y = preprocess_hand(hand_landmarks, w, h)
    
    hand_img = frame[min_y:max_y, min_x:max_x]
    
    if hand_img.size == 0:
        return None, 0
    
    hand_img = cv2.cvtColor(hand_img, cv2.COLOR_BGR2GRAY)
    hand_img = cv2.resize(hand_img, (IMG_SIZE, IMG_SIZE))
    hand_img = hand_img / 255.0
    hand_img = np.expand_dims(hand_img, axis=(0, -1))
    
    prediction = model.predict(hand_img, verbose=0)[0]
    class_idx = np.argmax(prediction)
    confidence = prediction[class_idx]
    
    class_names = ["Palma", "Dorso"]
    return class_names[class_idx], confidence

def detect_hand_side(landmarks):
    wrist = landmarks[0]
    thumb = landmarks[4]
    indexMCP = landmarks[5]
    pinkyMCP = landmarks[17]
    
    thumbIsRight = thumb.x > wrist.x
    indexIsRight = indexMCP.x > pinkyMCP.x
    
    isRight = thumbIsRight or indexIsRight
    return "derecha" if isRight else "izquierda"

def main():
    print("Cargando modelo...")
    model = load_model()
    
    if model is None:
        return
    
    print("Iniciando camara...")
    cap = cv2.VideoCapture(0)
    
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.5
    )
    
    print("Listo! Presiona 'q' para salir")
    
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break
        
        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_frame)
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    frame,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS
                )
                
                hand_type, confidence = predict_hand(model, frame, hand_landmarks.landmark)
                side = detect_hand_side(hand_landmarks.landmark)
                
                if hand_type:
                    color = (0, 255, 0) if hand_type == "Palma" else (0, 165, 255)
                    text = f"{hand_type} ({side}) - {confidence*100:.1f}%"
                    cv2.putText(frame, text, (10, 40), 
                               cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
        
        cv2.putText(frame, "Presiona 'q' para salir", (10, frame.shape[0]-20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 1)
        cv2.imshow("Reconocimiento Palma/Dorso", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
