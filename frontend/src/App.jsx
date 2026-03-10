import { useEffect, useRef, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import './index.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [handState, setHandState] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [nailColor, setNailColor] = useState('#e11d48'); // Color de esmalte por defecto (rojo rosa)

  // Función para dibujar el esmalte de uñas
  const drawNails = (ctx, landmarks, width, height, color) => {
    // Definición de los dedos con sus respectivos puntos anatómicos
    // tip: Punta del dedo, prev: DIP (articulación distal), pip: PIP (articulación media)
    const fingers = [
      { tip: 4, prev: 3, pip: 2 },   // Pulgar
      { tip: 8, prev: 7, pip: 6 },   // Índice
      { tip: 12, prev: 11, pip: 10 }, // Medio
      { tip: 16, prev: 15, pip: 14 }, // Anular
      { tip: 20, prev: 19, pip: 18 }  // Meñique
    ];

    // Configurar el modo de mezcla a 'source-over' (normal) para que el color sea 100% sólido y cubriente
    ctx.globalCompositeOperation = 'source-over';

    const wrist = landmarks[0];
    const middleMCP = landmarks[9]; // Nudillo del dedo medio

    // Calcular un factor de escala dinámico basado en el tamaño físico de la mano en pantalla.
    const handLengthPx = Math.hypot(
      (middleMCP.x - wrist.x) * width,
      (middleMCP.y - wrist.y) * height
    );

    // Un valor de referencia estándar
    const scaleFactor = handLengthPx / 100;

    fingers.forEach((finger) => {
      const tipLm = landmarks[finger.tip];
      const prevLm = landmarks[finger.prev];
      const pipLm = landmarks[finger.pip];

      const distToTip = Math.hypot(tipLm.x - wrist.x, tipLm.y - wrist.y);
      const distToPip = Math.hypot(pipLm.x - wrist.x, pipLm.y - wrist.y);

      // Si la distancia a la punta es menor que la distancia a la articulación, 
      // el dedo está doblado, por lo que no dibujamos el filtro.
      if (distToTip < distToPip) return;

      // REGLA DE OCLUSIÓN PARA EL PULGAR
      // Cuando mostramos el dorso y metemos el pulgar "detrás" de la mano (hacia la palma oculta), 
      // MediaPipe a veces lo detecta y lo dibuja transparente sobre la mano.
      // Usamos el eje Z de MediaPipe (profundidad). Valores positivos de Z = más lejos de la cámara.
      if (finger.tip === 4) {
        // Obtenemos la profundidad de la punta del pulgar
        const thumbZ = tipLm.z;
        // Obtenemos la profundidad promedia del "lomo" de la mano (nudillos 5 y 17)
        const palmZ = (landmarks[5].z + landmarks[17].z) / 2;
        
        // Si el pulgar está significativamente "más hondo" (lejos) que el lomo de la mano, 
        // significa físicamente que lo escondimos detrás de la mano en dirección a nuestro pecho.
        // Un umbral empírico de ~0.04 suele funcionar en MediaPipe Z para marcar que cruzó hacia atrás.
        if (thumbZ > palmZ + 0.04) {
          return; // No dibujamos la uña del pulgar porque está ocluido por la propia mano.
        }
      }

      const x = tipLm.x * width;
      const y = tipLm.y * height;
      const px = prevLm.x * width;
      const py = prevLm.y * height;

      const dx = x - px;
      const dy = y - py;
      const segmentLength = Math.hypot(dx, dy);

      // Ajustar las dimensiones de la uña (forma de almendra)
      // Hemos incrementado los multiplicadores para hacerlas significativamente más anchas y largas.
      const radiusX = finger.tip === 4 ? segmentLength * 0.65 : segmentLength * 0.65;
      const radiusY = finger.tip === 4 ? 11 * scaleFactor : 9 * scaleFactor;

      // Calcular el ángulo del dedo
      let angle;
      if (finger.tip === 4) {
        const baseAngle = Math.atan2(y - py, x - px);
        // Desfase más suave para el pulgar
        angle = baseAngle + (Math.PI / 12);
      } else {
        angle = Math.atan2(y - py, x - px);
      }

      // Posición anatómica del nacimiento de la uña (Cutícula)
      // Fijamos la base biológica a un ~25% de la distancia desde la punta hacia el nudillo
      const cuticleShift = 0.25;

      // Calculamos el punto de anclaje de la cutícula (Línea donde se corrige el error del retroceso)
      const cuticleX = x - dx * cuticleShift;
      const cuticleY = y - dy * cuticleShift;

      ctx.save();
      // Nos trasladamos directamente a la cutícula, no al centro de la uña
      ctx.translate(cuticleX, cuticleY);
      ctx.rotate(angle);

      ctx.globalAlpha = 1.0; // Transparencia para efecto de tinte orgánico
      ctx.fillStyle = color;

      // Aplicar el filtro tintando el área
      ctx.beginPath();

      // Dibujamos una uña con forma "almendrada" partiendo desde el nuevo anclaje (0,0)
      const tipExtension = radiusX * 2.6; // Largo total sobresaliendo del dedo

      // Iniciamos estrictamente en el nacimiento de la uña (0,0) que ahora es la cutícula
      ctx.moveTo(0, 0);

      // Lado superior del dibujo
      ctx.bezierCurveTo(
        0, radiusY * 1.5,             // Control 1: Nace redondeada hacia arriba desde la cutícula
        radiusX * 1.2, radiusY * 1.1, // Control 2: Mantiene la anchura a lo largo del dedo
        tipExtension, 0               // Punto final: Punta de la uña sobresaliendo
      );

      // Lado inferior del dibujo
      ctx.bezierCurveTo(
        radiusX * 1.2, -radiusY * 1.1,
        0, -radiusY * 1.5,
        0, 0
      );

      ctx.fill();

      // Restaurar Alpha
      ctx.globalAlpha = 1.0;
      ctx.restore();
    });

    // Restaurar el modo de dibujado normal para el resto de la interfaz
    ctx.globalCompositeOperation = 'source-over';
  };

  // Necesitamos mantener una referencia al color actual para el callback de MediaPipe
  // ya que el cierre (closure) de useEffect captura el valor inicial.
  const nailColorRef = useRef(nailColor);
  useEffect(() => {
    nailColorRef.current = nailColor;
  }, [nailColor]);

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    if (!videoElement || !canvasElement) return;

    const canvasCtx = canvasElement.getContext('2d');

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // Draw video frame horizontally flipped
      canvasCtx.translate(canvasElement.width, 0);
      canvasCtx.scale(-1, 1);
      canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height
      );

      if (results.multiHandLandmarks && results.multiHandedness) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
          const landmarks = results.multiHandLandmarks[i];
          const classification = results.multiHandedness[i];

          // Ocultar líneas guía
          /* 
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: '#6366f1', lineWidth: 4
          });
          drawLandmarks(canvasCtx, landmarks, {
            color: '#c084fc', lineWidth: 2, radius: 4
          });
          */

          // Math logic
          const lm0 = landmarks[0];
          const lm5 = landmarks[5];
          const lm17 = landmarks[17];

          // 2D Vector Projection Cross Product
          // Note: Because Y axis in Canvas is inverted (0 at top, increasing down)
          const v1x = lm5.x - lm0.x;
          const v1y = lm5.y - lm0.y;
          const v2x = lm17.x - lm0.x;
          const v2y = lm17.y - lm0.y;

          const crossZ = (v1x * v2y) - (v1y * v2x);

          // We also have to account for the canvas mirror flip done earlier.
          // MediaPipe inherently returns "Left" or "Right" based on the raw image.
          const label = classification.label;
          let viewType = "Desconocido";

          if (label === "Left") {
            // Using mirror logic
            viewType = crossZ < 0 ? "Palma" : "Dorso";
          } else {
            viewType = crossZ > 0 ? "Palma" : "Dorso";
          }

          setHandState({
            side: label === "Left" ? "Derecha" : "Izquierda", // Flipped conceptually for user
            orientation: viewType,
            confidence: (classification.score * 100).toFixed(1)
          });

          // APLICAR ESMALTE si es el DORSO de la mano
          if (viewType === "Dorso") {
            drawNails(canvasCtx, landmarks, canvasElement.width, canvasElement.height, nailColorRef.current);
          }

        }
      } else {
        setHandState(null);
      }
      canvasCtx.restore();
    });

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        setIsReady(true);
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });
    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
  }, []);

  return (
    <div className="app-container">
      <header>
        <h1>Neural Hand Vision</h1>
        <p className="subtitle">Detección Vectorial en Tiempo Real (Palma / Dorso)</p>
      </header>

      <main className="vision-module">
        <div className="video-card">
          <div className="canvas-container">
            {!isReady && <div className="loader">Iniciando cámara y red neuronal...</div>}
            <video ref={videoRef} className="video-feed" playsInline></video>
            <canvas ref={canvasRef} className="output-canvas" width={640} height={480}></canvas>
          </div>
        </div>

        <aside className="status-panel">
          <div className="info-card">
            <h3>Detección Activa</h3>
            <div style={{ marginTop: '1rem' }}>
              {handState ? (
                <div className={`pill ${handState.orientation.toLowerCase()}`}>
                  {handState.orientation === 'Palma' ? '✋' : '🤚'}
                  <span>{handState.orientation.toUpperCase()}</span>
                </div>
              ) : (
                <div className="pill" style={{ opacity: 0.5 }}>
                  Buscando mano...
                </div>
              )}
            </div>

            {handState && (
              <div className="hand-stats">
                <div className="stat-row">
                  <span style={{ color: 'var(--text-muted)' }}>Mano Detectada</span>
                  <strong style={{ color: '#e2e8f0' }}>{handState.side}</strong>
                </div>
                <div className="stat-row">
                  <span style={{ color: 'var(--text-muted)' }}>Confianza</span>
                  <strong style={{ color: '#e2e8f0' }}>{handState.confidence}%</strong>
                </div>

                {handState.orientation === 'Dorso' && (
                  <div className="stat-row" style={{ marginTop: '0.5rem', borderBottom: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: 'var(--acc-back)', fontWeight: 'bold' }}>Color de Esmalte</span>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {/* 4 Opciones de colores predefinidos (Presets) */}
                      {['#e11d48', '#fb7185', '#881337', '#eab308'].map(color => (
                        <button
                          key={color}
                          onClick={() => setNailColor(color)}
                          style={{
                            backgroundColor: color,
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            border: nailColor === color ? '2px solid white' : '2px solid transparent',
                            cursor: 'pointer',
                            padding: 0,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                          title={`Color ${color}`}
                        />
                      ))}

                      {/* Separador */}
                      <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 5px' }}></div>

                      {/* Opcion Libre (Personalizada) */}
                      <input
                        type="color"
                        value={nailColor}
                        onChange={(e) => setNailColor(e.target.value)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          height: '30px', width: '30px', padding: 0, borderRadius: '50%'
                        }}
                        title="Elegir cualquier color"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="info-card" style={{ opacity: 0.8 }}>
            <h3>¿Cómo funciona?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Al lugar de usar redes neuronales convolucionales complejas, este algoritmo utiliza <strong>álgebra lineal</strong> simple.
              Calcula el producto cruz entre los vectores directores desde la muñeca hacia el índice y el meñique.
              La dirección ortogonal resultante indica si la mano se enfrenta hacia la cámara o si está de espaldas.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
