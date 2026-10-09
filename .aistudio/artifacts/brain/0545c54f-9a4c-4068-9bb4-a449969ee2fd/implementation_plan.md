# Sistema de Música de Fondo Continua y Efectos de Tensión Automáticos

Plan de implementación para garantizar que la canción de fondo subida por el usuario suene ininterrumpidamente en bucle continuo durante toda la transmisión, eliminar los selectores manuales de pistas del panel de pruebas, y automatizar las alertas sonoras y efectos de tensión según el desarrollo dinámico del juego.

---

### Decisiones Críticas Confirmadas

> [!IMPORTANT]
> Decisiones confirmadas con el usuario durante la fase interactiva:
> - **Música Continua en Bucle**: La canción de fondo (subida por el usuario) sonará de forma ininterrumpida e infinita durante toda la transmisión (tanto en sala de espera como durante las rondas y transiciones).
> - **Mezcla Dinámica con Peligro**: Al entrar en momentos críticos (soga superando el 70% o tiempo de tensión final), el volumen de la música de fondo se reducirá automáticamente (ducking al 40%) mientras se superponen los efectos sonoros y la tensión musical de advertencia.
> - **Panel Simplificado**: Se eliminan todos los botones manuales de selección de pistas (Batalla, Arcade, Boss). El panel mantendrá exclusivamente el botón para subir la canción de fondo, el control de volumen general y el indicador de reproducción activa.

---

### 1. Visión General & Causa Raíz Identificada

- **Problema Detectado en la Subida**: Anteriormente, el elemento de audio se enrutaba a través de un nodo `createMediaElementSource` sobre un `AudioContext` que podía estar suspendido por políticas de autoplay del navegador o fallar por restricciones de origen en data URLs.
- **Solución Robusta**:
  1. Implementar un reproductor de audio dedicado (`HTMLAudioElement`) desacoplado de bloqueos de contexto, con desbloqueo universal en el primer clic o toque de pantalla.
  2. Almacenar el archivo de audio tanto en memoria/Object URL como en IndexedDB y el backend `/api/upload-bgm`, asegurando persistencia permanente.
  3. Automatizar la reactividad sonora: el juego controla los momentos dramáticos sin requerir intervención manual del streamer.

---

### 2. Experiencia de Usuario & Comportamiento Sonoro

```
┌────────────────────────────────────────────────────────┐
│                   MÚSICA DE FONDO                      │
│   Canción Oficial subida ("Un dos tres jalamos ya...") │
│   ═════════════════ LOOP CONTINUO ═════════════════════│
└──────────────────────────┬─────────────────────────────┘
                           │
                 ¿Sucede un evento crítico?
          (Peligro |ropeV| >= 70% o Tensión <= 20s)
                           │
              ┌────────────┴────────────┐
              │ SÍ                      │ NO
              ▼                         ▼
   ┌───────────────────────┐   ┌──────────────────────┐
   │ Ducking: Volumen -50% │   │ Volumen normal (100%)│
   │ Superponer alertas y  │   │ Música limpia en     │
   │ efectos de tensión    │   │ primer plano         │
   └───────────────────────┘   └──────────────────────┘
```

#### Eventos Dinámicos que Modifican el Audio Automáticamente
- **Juego Normal (0% a 69% soga)**: La canción suena a volumen completo en bucle continuo.
- **Zona de Peligro (≥ 70% soga)**: La canción se atenúa automáticamente al 45% y se superponen latidos de tensión y alertas sonoras de advertencia.
- **Luz Roja**: Atenuación de fondo y pitidos intermitentes de peligro.
- **Victoria / Fin de Ronda**: La música de fondo baja suavemente mientras suena la fanfarria de victoria y vuelve a su volumen normal al continuar.

---

### 3. Ajustes en el Panel de Pruebas

- **Eliminación**: Retirar botones manuales "Batalla", "Arcade" y "Boss".
- **Nueva Sección Compacta de Audio**:
  - Botón principal: `📁 Cargar Canción de Fondo (MP3 / WAV)`
  - Control deslizante / barra de Volumen General.
  - Indicador de estado: `● Reproduciendo Canción Oficial en Bucle`.
  - Botón discreto para cambiar o restaurar audio.

---

### 4. Arquitectura Técnica & Plan de Archivos

1. **`src/audio.ts`**:
   - Crear un reproductor nativo robusto para la canción de fondo (`bgmAudio`) con `loop = true`, `preload = 'auto'` y eventos de desbloqueo garantizados.
   - Conectar el ducking automático a los parámetros del juego (`ropeV >= 70`, `isTension`, alertas).
   - Eliminar los modos manuales y automatizar las capas sonoras basadas en el estado del juego.
2. **`src/components/StreamerPanel.tsx`**:
   - Simplificar la tarjeta de audio eliminando los selectores de pistas manuales.
   - Dejar únicamente el cargador de archivo de audio y el slider de volumen maestro.
3. **`src/App.tsx`**:
   - Asegurar que al seleccionar el archivo de audio se inicie inmediatamente la reproducción y se guarde en almacenamiento.
