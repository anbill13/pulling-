# Estudio de Sprites, Activos y Manejador de Fotogramas para Tira y Afloja

Plan arquitectónico para crear el **Estudio de Sprites y Activos Visuales**: subida y calibración de imagen de referencia con overlay y opacidad en la arena, carga modular de elementos estáticos (fondo, pilares/bases, soga, bandana), y un **Manejador de Fotogramas (Sprite Animator)** con soporte dual para animación en loop continuo durante toda la partida.

## Decisiones Confirmadas del Usuario

> [!IMPORTANT]
> - **Método de carga de sprites**: Soporte dual confirmado — Permite subir tanto múltiples imágenes individuales (`00.png`, `01.png`, etc.) como un archivo único de Sprite Sheet continuo con selector de corte de fotogramas (filas/columnas).
> - **Visualización de imagen de referencia**: Overlay semitransparente montado directamente sobre la arena de juego, equipado con control deslizante de opacidad (0% a 100%) y botón de alternancia rápida (ojo).
> - **Ubicación en la interfaz**: Modal completo y dedicado de "Estudio de Sprites y Activos" con pestañas modulares y previsualización en vivo.

---

## 1. Visión General y Valor del Producto

- **Propósito**: Permitir que el creador de contenido o streamer de TikTok Live Studio suba sus propios diseños artísticos con total fidelidad, compare la composición del juego contra su diseño de referencia visual mediante un overlay con opacidad, y gestione con precisión las animaciones en bucle de los personajes (Chica y Chico) sincronizadas con la soga y las capas del juego.
- **Público Objetivo**: Streamers, diseñadores de overlays y operadores del juego interactivo de TikTok.
- **Valor Clave**: Cero dependencia de código para cambiar los gráficos; previsualización instantánea y animación fluida en loop a 18–24 FPS sin bloqueos.

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujo de Usuario Principal
1. **Acceso al Estudio**: El usuario hace clic en el botón `🎨 Estudio de Sprites` en la barra superior de la arena.
2. **Pestaña 1: Imagen de Referencia & Overlay**:
   - Subida de boceto o arte final de referencia (`PNG`/`JPG`).
   - Deslizador de opacidad (0% a 100%) y conmutador `Ver Referencia en la Arena`.
   - Cuando está activo, la arena muestra el overlay superpuesto para comparar píxel a píxel la alineación de manos, soga y plataformas.
3. **Pestaña 2: Elementos Estáticos**:
   - Tarjetas modulares de subida para:
     - **Fondo** (escenario/cielo/abismo)
     - **Pilares / Bases** (capa de plataformas rocosas donde se apoyan los pies)
     - **Soga** (textura horizontal continua)
     - **Bandana** (nudo indicador de equilibrio)
4. **Pestañas 3 y 4: Manejador de Sprites (Chica / Chico)**:
   - **Modo A (Archivos múltiples)**: Seleccionar o arrastrar todos los archivos PNG de la carpeta (`00.png` a `29.png`).
   - **Modo B (Sprite Sheet único)**: Subir imagen combinada y configurar número de cuadros horizontales/verticales.
   - **Controles de animación**:
     - Reproducir / Pausar / Fotograma anterior / Fotograma siguiente.
     - Selector de velocidad (FPS de reposo: 10–18, FPS de tensión: 20–28).
     - Línea de tiempo visual con miniaturas de los fotogramas y depurador paso a paso.
     - Indicador visual de altura de manos para garantizar que cubran la soga.
5. **Guardado y Persistencia**:
   - Guardado automático en almacenamiento local del navegador (`localStorage` / `IndexedDB` para imágenes pesadas).
   - Botón de restablecimiento para volver a los activos oficiales en cualquier momento.

```
┌────────────────────────────────────────────────────────────────────────┐
│ ESTUDIO DE SPRITES Y ACTIVOS VISUALES                     [X Cerrar]   │
├────────────────────────────────────────────────────────────────────────┤
│ [🖼️ Referencia] [🧩 Estáticos] [👧 Chica Rojo] [👦 Chico Azul] [📏 Ajustes] │
├────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐  ┌──────────────────────────┐ │
│ │ PREVISUALIZADOR DE FOTOGRAMAS        │  │ CONTROLES DE CARGA       │ │
│ │                                      │  │ (•) Múltiples PNGs       │ │
│ │        [ Sprite Frame Preview ]      │  │ ( ) Sprite Sheet Strip   │ │
│ │                                      │  │                          │ │
│ │ ◀  ▶  [ ▶ Play ]  FPS: [ 18 ]       │  │ [ 📁 Seleccionar Carpeta] │ │
│ │ Fotograma: 14 / 30                   │  │ 30 cuadros cargados      │ │
│ └──────────────────────────────────────┘  └──────────────────────────┘ │
│                                                                        │
│ Tira de fotogramas: [00][01][02][03][04][05][06][07][08][09]...       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Decisiones Técnicas y Arquitectura

```
                     ┌───────────────────────────────┐
                     │         App Principal         │
                     └───────────────┬───────────────┘
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
┌─────────────────────────────┐             ┌────────────────────────────────┐
│   PixelScene (Arena Juego)  │             │   SpriteStudioModal (Estudio)   │
├─────────────────────────────┤             ├────────────────────────────────┤
│ Capa 1: Fondo               │             │ Pestaña Referencia & Overlay   │
│ Capa 1.5: Pilares / Bases   │             │ Pestaña Elementos Estáticos    │
│ Capa 2: Soga                │             │ Pestaña Chica (Sprite Manager) │
│ Capa 3: Bandana             │             │ Pestaña Chico (Sprite Manager) │
│ Capa 4: Chica & Chico Sprites│            │ Calibración de Altura & Escala │
│ Capa 5: Overlay Referencia  │             └───────────────┬────────────────┘
└─────────────▲───────────────┘                             │
              │                                             │
              └──────────── Actualiza Estado de Activos ────┘
```

### 1. Gestión de Capas (Z-Index Actualizado)
- **Capa 1 (`z-index: 1`)**: Fondo del escenario.
- **Capa 1.5 (`z-index: 2`)**: Pilares / Bases estáticas donde se paran los personajes.
- **Capa 2 (`z-index: 3`)**: Soga móvil (`transition: left 0.3s ease-out`).
- **Capa 3 (`z-index: 4`)**: Bandana roja en el centro de la soga.
- **Capa 4 (`z-index: 5`)**: Personajes animados con manos que tapan la soga.
- **Capa 5 (`z-index: 6`)**: Overlay de Imagen de Referencia (con opacidad regulable del 0% al 100%, con `pointer-events-none`).

### 2. Motor de Animación de Sprites en Loop
- Utilizará un bucle `requestAnimationFrame` con marcas de tiempo en milisegundos (`performance.now()`) para garantizar que la animación mantenga su velocidad exacta (FPS configurable) sin degradación cuando el navegador o la transmisión de TikTok tengan alta carga.
- Aceleración dinámica de FPS cuando la soga entre en estado de tensión o tirón rápido.

---

## 4. Fases de Ejecución

1. **Estructura de Datos & Almacenamiento**:
   - Ampliar `CustomGameAssets` en `types.ts` con `referenceImageUrl`, `referenceOpacity`, `referenceVisible`, `pilaresUrl`, y las listas de cuadros `chicaFrames?: string[]` y `chicoFrames?: string[]` con sus metadatos de animación.
   - Proveer persistencia robusta para blobs/base64 de las imágenes cargadas.

2. **Desarrollo del `SpriteStudioModal`**:
   - Crear el modal modular con las 5 secciones especializadas.
   - Lector de archivos por lotes (procesador de carpetas y múltiples archivos PNG ordenados por nombre numérico `00`, `01`, etc.).
   - Slicer / cortador de Sprite Sheets en Canvas para dividir tiras continuas en cuadros individuales automáticamente.
   - Depurador visual de fotogramas con barra deslizante y reproducción interactiva.

3. **Integración en `PixelScene.tsx`**:
   - Agregar la capa de **Pilares / Bases** fija debajo de los pies de los personajes.
   - Agregar la capa de **Overlay de Referencia** con control de opacidad en vivo y alternador rápido de visibilidad.
   - Conectar los fotogramas dinámicos de Chica y Chico al motor de animación de la arena.

4. **Verificación y Pruebas**:
   - Probar la carga de imágenes de prueba, la animación en bucle a 18 FPS, el deslizador de opacidad de referencia y verificar con `lint_applet` y `compile_applet`.
