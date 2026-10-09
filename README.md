# Tira y Afloja: Supervivencia 🎮🔴🔵

Juego interactivo en vivo para **TikTok Live** donde los espectadores se dividen en dos equipos, **Team Rojo 🔴** y **Team Azul 🔵**, compitiendo en tiempo real halando una soga con comentarios, likes y regalos.

Diseño original en estilo **Pixel Art 8-bits** inspirado en un diorama de torneo de supervivencia sobre dos plataformas de roca al borde de un abismo nocturno.

---

## 🚀 Arquitectura y Tecnologías
- **Backend**: Node.js + Express + WebSockets (`ws`).
- **Conector TikTok**: Librería `tiktok-live-connector` con reconexión automática cada 10 s y modo de prueba integrado si no hay usuario configurado.
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4.
- **Audio y Música**: Síntesis procedural 100 % en código con la **Web Audio API** (sin librerías ni archivos externos con copyright).
- **Persistencia**: Contador de victorias históricas y diamantes de usuario en `localStorage` con módulo intercambiable para base de datos en la nube (Firestore / Cloud Run).

---

## ⚙️ Configuración de TIKTOK_USERNAME

1. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Especifica el nombre de usuario de la cuenta de TikTok que está transmitiendo en vivo:
   ```env
   PORT=3000
   TIKTOK_USERNAME="tu_usuario_de_tiktok"
   ```
3. Si `TIKTOK_USERNAME` está vacío o la conexión no está activa, el servidor arranca en **Modo Prueba** permitiendo usar el panel de control del streamer con bots y simulaciones.

---

## 🔊 Cómo capturar el audio en OBS Studio y TikTok LIVE Studio

Por seguridad, los navegadores web requieren una interacción del usuario antes de reproducir audio.

1. Al abrir la página del juego, haz clic en el botón superior **"🔊 Activar Sonido"** (o presiona la tecla **M**).
2. **Para que tus espectadores escuchen la música y efectos en el LIVE**:
   - **En OBS Studio**:
     - Agrega una fuente de tipo **"Captura de ventana"** o **"Navegador"**.
     - Si usas fuente de tipo *Navegador*, marca la casilla **"Controlar audio a través de OBS"** para que el medidor de audio de OBS recoja los sonidos del juego.
     - Si usas *Captura de ventana*, asegúrate de tener una fuente de **"Captura de salida de audio del escritorio"** o **"Captura de audio de la aplicación"** apuntando al navegador donde corre el juego.
   - **En TikTok LIVE Studio**:
     - Agrega la ventana del juego o ventana del navegador como fuente de video.
     - En la sección de Mezclador de audio, habilita **"Audio del sistema"** o agrega una fuente de audio seleccionando la ventana del navegador web.
     - *Nota*: Sin agregar la fuente de audio en tu software de transmisión, solo tú (el streamer) escucharás el sonido por tus auriculares.

---

## 🎮 Mecánica de Juego y Comandos

| Comando / Acción | Efecto |
|---|---|
| `!rojo` o 🔴 🟥 | Unirse a Team Rojo (sujeto a equilibrio de equipos) |
| `!azul` o 🔵 🟦 | Unirse a Team Azul (sujeto a equilibrio de equipos) |
| `!unirme` | Asignación automática al equipo con menos jugadores |
| `!cambio` | Cambiar de equipo (máx 1 vez por ronda si no desbalancea) |
| Comentario | Empuja **+1** hacia su equipo (enfriamiento de 600 ms) |
| Likes (Taps) | Empuja **0.1** por tap |
| 🌹 Rosa (1💎) | **+1 punto completo** y empuje directo sin enfriamiento |
| 🛡️ Escudo (2-4💎) | **+8** de empuje hacia su equipo |
| 🧊 Ralentizar (5-9💎) | Equipo rival empuja al **50 %** durante 5 s |
| ⚡ Doble Fuerza (10+💎)| Empuje **x2** para su equipo durante 8 s |

### Reglas Especiales:
- **Luz Roja, Luz Verde**: Alerta ámbar previa de 1.5 s. Durante la luz roja (4 s), los comentarios no empujan y restan 1 punto al jugador.
- **Caja Fuerte**: Aparece entre el segundo 30 y 80. El primer equipo en llegar a 25 comentarios gana **+20 de empuje**.
- **Equilibrio Máximo**: Diferencia máxima de 1 jugador entre equipos. Si un equipo tiene más espectadores activos, el empuje por jugador se escala proporcionalmente con un tope para mantener la partida competitiva.
- **Ronda de Oro**: Barra colectiva del live que se llena con diamantes y otorga **30 s de puntos dobles** para todos.

---

## 🛠️ Panel del Streamer
- Presiona la tecla **T** o haz clic en el botón flotante inferior **"Panel Streamer"**.
- Incluye:
  - Generador de comentarios, likes y regalos.
  - Simulador de chat continuo con bots.
  - Activadores de combo x10, lluvia de regalos, sincronía, remontada, caja fuerte y luz roja.
  - **Cola de agradecimientos** con botón "✓ Agradecido" para donaciones recientes.

---

## ☁️ Despliegue en Google Cloud Run

1. Construir los assets del frontend:
   ```bash
   npm run build
   ```
2. Iniciar el servidor Express en producción:
   ```bash
   npm start
   ```
   (Escucha en `process.env.PORT` asignado por Cloud Run).
