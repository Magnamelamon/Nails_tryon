import cv2
import mediapipe as mp

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)

cap = cv2.VideoCapture(0)

print("Presiona 'q' para salir")

while cap.isOpened():
    success, image = cap.read()
    if not success:
        print("No se pudo acceder a la cámara")
        break

    image = cv2.flip(image, 1)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)

    if results.multi_hand_landmarks and results.multi_handedness:
        for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
            mp_drawing.draw_landmarks(
                image,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS,
                mp_drawing_styles.get_default_hand_landmarks_style(),
                mp_drawing_styles.get_default_hand_connections_style()
            )
            
            # Obtener landmarks necesarios (Muñeca=0, Indice MCP=5, Meñique MCP=17)
            lm_0 = hand_landmarks.landmark[0]
            lm_5 = hand_landmarks.landmark[5]
            lm_17 = hand_landmarks.landmark[17]

            # Vectores 0->5 y 0->17
            v1 = [lm_5.x - lm_0.x, lm_5.y - lm_0.y]
            v2 = [lm_17.x - lm_0.x, lm_17.y - lm_0.y]

            # Producto cruz
            cross_z = v1[0] * v2[1] - v1[1] * v2[0]

            label = handedness.classification[0].label 
            
            estado = "Desconocido"
            if label == "Left": 
                if cross_z > 0:
                    estado = "Palma"
                else:
                    estado = "Dorso"
            else: 
                if cross_z < 0:
                    estado = "Palma"
                else:
                    estado = "Dorso"
            
            h, w, c = image.shape
            pos_x, pos_y = int(lm_0.x * w), int(lm_0.y * h)
            
            cv2.putText(image, f'{label} - {estado}', (pos_x, pos_y - 20), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    cv2.putText(image, 'Reconocimiento de Mano', (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.imshow('Reconocimiento de Mano', image)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
