import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import { CONFIG } from '../config';
import { Player, Team, SafeBoxEvent, RedLightState, CustomGameAssets } from '../types';

interface PixelSceneProps {
  ropeV: number; // -100 to 100 (positive favors Rojo/left, negative favors Azul/right)
  phase: 'lobby' | 'intro' | 'round' | 'ended';
  losingTeam: Team | null;
  rojoPlayers: Player[];
  azulPlayers: Player[];
  rojoCaptain: { name: string; number: string; diamonds: number } | null;
  azulCaptain: { name: string; number: string; diamonds: number } | null;
  safeEvent: SafeBoxEvent | null;
  redLight: RedLightState;
  isGoldenRound: boolean;
  isTension: boolean;
  customAssets?: CustomGameAssets;
  onManualPull?: (team: Team) => void;
  onOpenAssetManager?: () => void;
  onToggleReferenceOverlay?: () => void;
  onToggleMetaLines?: () => void;
}

// 30 cropped frames for Chica, 28 cropped frames for Chico
const CHICA_FRAME_COUNT = 30;
const CHICO_FRAME_COUNT = 28;

const CHICA_FRAMES = Array.from(
  { length: CHICA_FRAME_COUNT },
  (_, i) => `/assets/chica_crop/${String(i).padStart(2, '0')}.png`
);

const CHICO_FRAMES = Array.from(
  { length: CHICO_FRAME_COUNT },
  (_, i) => `/assets/chico_crop/${String(i).padStart(2, '0')}.png`
);

export const PixelScene: React.FC<PixelSceneProps> = memo(({
  ropeV,
  phase,
  losingTeam,
  rojoPlayers,
  azulPlayers,
  rojoCaptain,
  azulCaptain,
  safeEvent,
  redLight,
  isGoldenRound,
  isTension,
  customAssets,
  onManualPull,
  onOpenAssetManager,
  onToggleReferenceOverlay,
  onToggleMetaLines,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [chicaFrame, setChicaFrame] = useState<number>(0);
  const [chicoFrame, setChicoFrame] = useState<number>(0);
  const [pullFeedback, setPullFeedback] = useState<{ team: Team; id: number } | null>(null);

  // Preload official assets on mount
  useEffect(() => {
    CHICA_FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    CHICO_FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    const fondo = new Image();
    fondo.src = '/assets/fondo.png';
    const soga = new Image();
    soga.src = '/assets/soga_strip_ext.png';
    const bandana = new Image();
    bandana.src = '/assets/bandana_crop.png';
  }, []);

  // Determine active frame sequences for Chica and Chico
  const activeChicaFrames =
    customAssets?.enabled && customAssets.chicaCustomFrames && customAssets.chicaCustomFrames.length > 0
      ? customAssets.chicaCustomFrames
      : null;
  const chicaTotalFrames = activeChicaFrames ? activeChicaFrames.length : CHICA_FRAME_COUNT;

  const activeChicoFrames =
    customAssets?.enabled && customAssets.chicoCustomFrames && customAssets.chicoCustomFrames.length > 0
      ? customAssets.chicoCustomFrames
      : null;
  const chicoTotalFrames = activeChicoFrames ? activeChicoFrames.length : CHICO_FRAME_COUNT;

  // Sprite animation loop (respects configured FPS and tension acceleration)
  useEffect(() => {
    const chicaBaseFps = customAssets?.chicaFps || 18;
    const chicoBaseFps = customAssets?.chicoFps || 18;
    const speedMultiplier = phase === 'round' ? (isTension ? 1.3 : 1.0) : 0.6;
    const effectiveFps = Math.max(6, Math.round(chicaBaseFps * speedMultiplier));

    const interval = window.setInterval(() => {
      setChicaFrame((prev) => (prev + 1) % chicaTotalFrames);
      setChicoFrame((prev) => (prev + 1) % chicoTotalFrames);
    }, 1000 / effectiveFps);

    return () => window.clearInterval(interval);
  }, [phase, isTension, chicaTotalFrames, chicoTotalFrames, customAssets?.chicaFps, customAssets?.chicoFps]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Manual pull wrapper with visual feedback
  const handlePull = useCallback(
    (team: Team) => {
      setPullFeedback({ team, id: Date.now() });
      onManualPull?.(team);
    },
    [onManualPull]
  );

  // Altura independiente de la cuerda (arriba y abajo)
  const ropeHeightPercent = customAssets?.ropeHeightPercent ?? 50;
  const ropeOffsetY = customAssets?.ropeOffsetYPx ?? 0;
  const effectiveRopeTop = `calc(${ropeHeightPercent}% + ${ropeOffsetY}px)`;

  // Altura independiente de los personajes (arriba y abajo, separada de la cuerda)
  const chicaTop = `${customAssets?.chicaHeightPercent ?? customAssets?.characterHeightPercent ?? customAssets?.handHeightPercent ?? 50}%`;
  const chicoTop = `${customAssets?.chicoHeightPercent ?? customAssets?.characterHeightPercent ?? customAssets?.handHeightPercent ?? 50}%`;

  // Altura independiente de los semáforos (arriba y abajo)
  const semaphoreLeftTop = `${customAssets?.semaphoreLeftHeightPercent ?? customAssets?.semaphoreHeightPercent ?? 32}%`;
  const semaphoreRightTop = `${customAssets?.semaphoreRightHeightPercent ?? customAssets?.semaphoreHeightPercent ?? 32}%`;

  const chicaScale = (customAssets?.chicaScalePercent ?? customAssets?.characterScalePercent ?? 100) / 100;
  const chicoScale = (customAssets?.chicoScalePercent ?? customAssets?.characterScalePercent ?? 100) / 100;
  // Posición de los personajes (alejar o acercar a la meta)
  const chicaPos = customAssets?.chicaPositionPercent ?? 8;
  const chicoPos = customAssets?.chicoPositionPercent ?? 8;
  // Líneas de meta independientes para Rojo y Azul (con opción de ocultarlas)
  const metaRojoPercent = customAssets?.metaRojoPercent ?? 34;
  const metaAzulPercent = customAssets?.metaAzulPercent ?? 66;
  const showMetaLines = customAssets?.showMetaLines ?? true;

  const bandanaScale = (customAssets?.bandanaScalePercent ?? 85) / 100;
  const ropeThicknessPx = customAssets?.ropeThicknessPx ?? 14;
  const ropeWidthPercent = customAssets?.ropeWidthPercent ?? 160;

  // Altura y desplazamiento independiente de la bandana (subir y bajar)
  const bandanaOffsetY = customAssets?.bandanaOffsetYPx ?? 0;
  const bandanaHeightPercent = customAssets?.bandanaHeightPercent;
  const effectiveBandanaTop = bandanaHeightPercent !== undefined
    ? `calc(${bandanaHeightPercent}% + ${bandanaOffsetY}px)`
    : `calc(${effectiveRopeTop} + ${bandanaOffsetY}px)`;

  // Horizontal displacement (-100 to +100)
  // Para que al ganar (+100 o -100), la bandana llegue exactamente a la línea de meta:
  const slidePercent = ropeV >= 0
    ? (ropeV / 100) * (50 - metaRojoPercent)
    : (ropeV / 100) * (metaAzulPercent - 50);

  // Estados de peligro y tensión para animación de vibración (shake al superar el 70% hacia cualquier lado)
  const absRopeV = Math.abs(ropeV);
  const isExtremeDanger = absRopeV >= 85;
  const isMediumDanger = absRopeV >= 70;

  // Animación de vibración CSS para la soga y la bandana
  const ropeShakeClass = isExtremeDanger
    ? 'animate-shake-danger-heavy'
    : isMediumDanger
    ? 'animate-shake-danger-medium'
    : '';

  // Vibración CSS para Chica (Team Rojo) - Esfuerzo y temblor al borde de peligro (>= 70%)
  const chicaShakeClass = ropeV <= -85
    ? 'animate-character-struggle-extreme'
    : ropeV <= -70 || ropeV >= 85
    ? 'animate-character-struggle'
    : '';

  // Vibración CSS para Chico (Team Azul) - Esfuerzo y temblor al borde de peligro (>= 70%)
  const chicoShakeClass = ropeV >= 85
    ? 'animate-character-struggle-extreme'
    : ropeV >= 70 || ropeV <= -85
    ? 'animate-character-struggle'
    : '';

  // Resplandor de peligro y tensión sobre la soga
  const ropeDangerGlow = isExtremeDanger
    ? ropeV > 0
      ? 'drop-shadow-[0_0_16px_rgba(255,59,59,0.95)]'
      : 'drop-shadow-[0_0_16px_rgba(61,165,255,0.95)]'
    : isMediumDanger
    ? ropeV > 0
      ? 'drop-shadow-[0_0_9px_rgba(255,59,59,0.7)]'
      : 'drop-shadow-[0_0_9px_rgba(61,165,255,0.7)]'
    : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]';

  // Platform collapse animations
  const rojoCollapsed = phase === 'ended' && losingTeam === 'rojo';
  const azulCollapsed = phase === 'ended' && losingTeam === 'azul';

  // URLs for background, pilares/bases, rope, bandana
  const fondoSrc = customAssets?.enabled && customAssets.fondoUrl ? customAssets.fondoUrl : '/assets/fondo.png';
  const pilaresSrc = customAssets?.enabled && customAssets.pilaresUrl ? customAssets.pilaresUrl : null;
  const sogaSrc = customAssets?.enabled && customAssets.sogaUrl ? customAssets.sogaUrl : '/assets/soga_strip_ext.png';
  const bandanaSrc = customAssets?.enabled && customAssets.bandanaUrl ? customAssets.bandanaUrl : '/assets/bandana_crop.png';

  // Reference overlay
  const hasReference = Boolean(customAssets?.referenceImageUrl);
  const isReferenceVisible = Boolean(customAssets?.referenceVisible && hasReference);
  const referenceOpacity = (customAssets?.referenceOpacity ?? 50) / 100;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none transition-all duration-300 bg-[#08080c] ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen'
          : 'w-full aspect-[9/10] sm:aspect-[4/3] max-h-[500px] sm:max-h-[550px] mx-auto rounded-2xl border border-white/10 shadow-2xl'
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* BOTÓN PANTALLA COMPLETA (Discreto en esquina para el streamer) */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto opacity-70 hover:opacity-100 transition-opacity">
        <button
          onClick={toggleFullscreen}
          className="px-2.5 py-1 bg-black/60 hover:bg-black/90 text-white/80 hover:text-white text-[10px] font-bold rounded-lg border border-white/10 backdrop-blur-md transition-all shadow flex items-center gap-1 cursor-pointer"
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla Completa'}
        >
          <span>{isFullscreen ? '🗗' : '⛶'}</span>
          <span className="hidden sm:inline">{isFullscreen ? 'Normal' : 'Pantalla'}</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* OVERLAYS VISUALES DE ESTADO (RONDA DE ORO / LUZ ROJA / TENSIÓN)*/}
      {/* ------------------------------------------------------------- */}
      {isGoldenRound && (
        <div className="absolute inset-0 pointer-events-none border-4 border-yellow-400 animate-pulse z-25 shadow-[inset_0_0_40px_rgba(255,215,0,0.5)]" />
      )}

      {redLight.state === 'red' && (
        <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-red-950/40 to-red-600/60 animate-pulse z-25" />
      )}

      {isTension && !isGoldenRound && redLight.state !== 'red' && (
        <div className="absolute inset-0 pointer-events-none border-2 border-amber-500/50 animate-ping z-25" />
      )}

      {/* Alerta flotante de Luz Roja */}
      {redLight.state === 'red' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-25 bg-red-600/95 text-white px-3.5 py-1.5 rounded-lg border border-white/40 font-pixel text-[10px] sm:text-xs animate-bounce shadow-2xl flex items-center gap-2">
          <span>🚨</span>
          <span>¡LUZ ROJA! NO COMENTES</span>
          <span>🚨</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CAPA 1 (FONDO): z-index: 1                                   */}
      {/* Renderizado de la arena y el cañón                            */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none select-none">
        <img
          src={fondoSrc}
          alt="Fondo de Tira y Afloja"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />

        {/* Semáforos animados de Luz Roja / Verde (Mover arriba y abajo independientemente) */}
        <div
          className="absolute left-[3%] z-10 transition-all duration-300"
          style={{
            top: semaphoreLeftTop,
            transform: 'translateY(-50%)',
          }}
        >
          <SemaphoreWidget state={redLight.state} />
        </div>
        <div
          className="absolute right-[3%] z-10 transition-all duration-300"
          style={{
            top: semaphoreRightTop,
            transform: 'translateY(-50%)',
          }}
        >
          <SemaphoreWidget state={redLight.state} />
        </div>

        {/* Línea de equilibrio en el centro */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none border-l-2 border-dashed border-white/40"
          style={{
            top: `calc(${effectiveRopeTop} - 16%)`,
            height: '32%',
          }}
        >
          <span className="absolute -top-4 -translate-x-1/2 text-[7px] font-pixel text-neutral-300 bg-black/75 px-1 py-0.5 rounded border border-white/30 whitespace-nowrap">
            ⚖️ CENTRO
          </span>
        </div>

        {/* Líneas de Límite de Victoria Team Rojo y Azul (Ocultables según preferencia del streamer) */}
        {showMetaLines && (
          <>
            {/* Línea de Límite de Victoria Team Rojo (Independiente) */}
            <div
              className={`absolute pointer-events-none z-10 border-l-2 border-dashed transition-all duration-200 ${
                ropeV >= 90
                  ? 'border-red-400 shadow-[0_0_15px_rgba(255,59,59,0.9)] animate-pulse'
                  : 'border-red-500/80'
              }`}
              style={{
                left: `${metaRojoPercent}%`,
                top: `calc(${effectiveRopeTop} - 16%)`,
                height: '32%',
              }}
            >
              <span
                className={`absolute -top-4 -translate-x-1/2 text-[7px] font-pixel px-1.5 py-0.5 rounded border whitespace-nowrap shadow transition-all ${
                  ropeV >= 95
                    ? 'bg-red-600 text-white border-white animate-bounce shadow-[0_0_10px_rgba(255,59,59,1)]'
                    : 'text-red-400 bg-black/85 border-red-500/50'
                }`}
              >
                🏁 META ROJO ({metaRojoPercent}%)
              </span>
            </div>

            {/* Línea de Límite de Victoria Team Azul (Independiente) */}
            <div
              className={`absolute pointer-events-none z-10 border-l-2 border-dashed transition-all duration-200 ${
                ropeV <= -90
                  ? 'border-blue-400 shadow-[0_0_15px_rgba(61,165,255,0.9)] animate-pulse'
                  : 'border-blue-500/80'
              }`}
              style={{
                left: `${metaAzulPercent}%`,
                top: `calc(${effectiveRopeTop} - 16%)`,
                height: '32%',
              }}
            >
              <span
                className={`absolute -top-4 -translate-x-1/2 text-[7px] font-pixel px-1.5 py-0.5 rounded border whitespace-nowrap shadow transition-all ${
                  ropeV <= -95
                    ? 'bg-blue-600 text-white border-white animate-bounce shadow-[0_0_10px_rgba(61,165,255,1)]'
                    : 'text-blue-400 bg-black/85 border-blue-500/50'
                }`}
              >
                ({metaAzulPercent}%) META AZUL 🏁
              </span>
            </div>
          </>
        )}

        {/* Caja Fuerte suspendida sobre el centro */}
        {safeEvent && safeEvent.active && (
          <div className="absolute top-[18%] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center animate-bounce">
            <div className="w-14 h-14 bg-[#2d3345] border-2 border-yellow-400 rounded-lg shadow-2xl flex items-center justify-center relative">
              <div className="w-7 h-7 rounded-full border-2 border-neutral-400 bg-neutral-900 flex items-center justify-center text-xs">
                🔐
              </div>
            </div>
            <div className="mt-1 px-2 py-0.5 bg-yellow-400 text-black font-pixel text-[8px] font-bold rounded shadow">
              CAJA FUERTE
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CAPA 1.5 (PILARES / BASES): z-index: 2                        */}
      {/* Bases o plataformas estáticas bajo los pies si se configuran  */}
      {/* ------------------------------------------------------------- */}
      {pilaresSrc && (
        <div className="absolute inset-0 z-[2] pointer-events-none select-none overflow-hidden">
          <img
            src={pilaresSrc}
            alt="Pilares y Bases"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CAPA 2 (SOGA): z-index: 3                                     */}
      {/* Se traslada verticalmente con effectiveRopeTop y horizontal   */}
      {/* con transition: left 0.3s ease-out. Incluye vibración shake   */}
      {/* ------------------------------------------------------------- */}
      <div
        className="absolute z-[3] pointer-events-none select-none flex items-center justify-center overflow-visible"
        style={{
          top: effectiveRopeTop,
          left: `calc(50% - ${slidePercent}%)`,
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.3s ease-out, top 0.2s ease-out',
          width: `${ropeWidthPercent}%`,
          height: `${ropeThicknessPx}px`,
        }}
      >
        <div className={`w-full h-full ${ropeShakeClass}`}>
          <img
            src={sogaSrc}
            alt="Soga"
            className={`w-full h-full object-cover filter transition-all duration-200 ${ropeDangerGlow}`}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CAPA 3 (BANDANA): z-index: 4                                  */}
      {/* Nudo rojo atado al centro de la soga con vibración de tensión  */}
      {/* ------------------------------------------------------------- */}
      <div
        className="absolute z-[4] pointer-events-none select-none flex items-center justify-center"
        style={{
          top: effectiveBandanaTop,
          left: `calc(50% - ${slidePercent}%)`,
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.3s ease-out, top 0.2s ease-out',
          width: `${Math.round(36 * bandanaScale)}px`,
          height: `${Math.round(32 * bandanaScale)}px`,
        }}
      >
        <div className={`w-full h-full flex items-center justify-center ${ropeShakeClass}`}>
          <img
            src={bandanaSrc}
            alt="Bandana"
            className={`w-full h-full object-contain filter transition-all duration-200 ${
              isExtremeDanger
                ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse'
                : 'drop-shadow-[0_3px_5px_rgba(0,0,0,0.7)]'
            }`}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CAPA 4 (PERSONAJES): z-index: 5                               */}
      {/* Los personajes están ARRIBA DE TODO para tapar la soga con   */}
      {/* sus manos. Posición configurable para alejarse de la meta.    */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 z-[5] pointer-events-none select-none">
        {/* CHICA (TEAM ROJO - FIJA A LA IZQUIERDA) */}
        <div
          className={`absolute transition-transform duration-700 pointer-events-auto cursor-pointer ${
            rojoCollapsed ? 'translate-y-96 rotate-12 opacity-20' : ''
          }`}
          style={{
            left: `${chicaPos}%`,
            top: chicaTop,
            // Alineación de manos: el 36% de la altura del personaje encaja con la soga
            transform: `translateY(-36%) scale(${chicaScale})`,
            transformOrigin: 'left center',
          }}
          onClick={() => handlePull('rojo')}
          title="Haz clic para halar por Team Rojo"
        >
          {/* Corona y número de Capitana */}
          {rojoCaptain && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-400 text-black font-pixel text-[8px] font-bold rounded shadow-md flex items-center gap-1 animate-pulse pointer-events-none z-10 whitespace-nowrap">
              <span>👑</span>
              <span>{rojoCaptain.number}</span>
            </div>
          )}

          {/* RENDER CHICA (Fotogramas en loop infinito con vibración de esfuerzo/peligro) */}
          <div className={`relative ${chicaShakeClass}`}>
            {ropeV <= -70 && (
              <div className="absolute -top-4 -right-1 text-sm animate-bounce pointer-events-none z-20 select-none">
                💦
              </div>
            )}
            <img
              src={
                activeChicaFrames
                  ? activeChicaFrames[chicaFrame % activeChicaFrames.length]
                  : CHICA_FRAMES[chicaFrame % CHICA_FRAME_COUNT]
              }
              alt="Chica Team Rojo"
              className={`w-auto h-[180px] sm:h-[220px] md:h-[250px] max-w-[210px] sm:max-w-[260px] object-contain transition-all ${
                ropeV <= -75
                  ? 'drop-shadow-[0_0_15px_rgba(255,59,59,0.95)]'
                  : 'drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)]'
              }`}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* CHICO (TEAM AZUL - FIJO A LA DERECHA) */}
        <div
          className={`absolute transition-transform duration-700 pointer-events-auto cursor-pointer ${
            azulCollapsed ? 'translate-y-96 -rotate-12 opacity-20' : ''
          }`}
          style={{
            right: `${chicoPos}%`,
            top: chicoTop,
            // Alineación de manos: el 37% de la altura del personaje encaja con la soga
            transform: `translateY(-37%) scale(${chicoScale})`,
            transformOrigin: 'right center',
          }}
          onClick={() => handlePull('azul')}
          title="Haz clic para halar por Team Azul"
        >
          {/* Corona y número de Capitán */}
          {azulCaptain && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-400 text-black font-pixel text-[8px] font-bold rounded shadow-md flex items-center gap-1 animate-pulse pointer-events-none z-10 whitespace-nowrap">
              <span>👑</span>
              <span>{azulCaptain.number}</span>
            </div>
          )}

          {/* RENDER CHICO (Fotogramas en loop infinito con vibración de esfuerzo/peligro) */}
          <div className={`relative ${chicoShakeClass}`}>
            {ropeV >= 70 && (
              <div className="absolute -top-4 -left-1 text-sm animate-bounce pointer-events-none z-20 select-none">
                💦
              </div>
            )}
            <img
              src={
                activeChicoFrames
                  ? activeChicoFrames[chicoFrame % activeChicoFrames.length]
                  : CHICO_FRAMES[chicoFrame % CHICO_FRAME_COUNT]
              }
              alt="Chico Pose Arrastre Team Azul"
              className={`w-auto h-[180px] sm:h-[220px] md:h-[250px] max-w-[210px] sm:max-w-[260px] object-contain transition-all ${
                ropeV >= 75
                  ? 'drop-shadow-[0_0_15px_rgba(61,165,255,0.95)]'
                  : 'drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)]'
              }`}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Feedback de tirón animado */}
        {pullFeedback && (
          <div
            key={pullFeedback.id}
            className={`absolute top-[48%] ${
              pullFeedback.team === 'rojo' ? 'left-[22%]' : 'right-[22%]'
            } px-3 py-1 font-pixel text-xs font-black text-white rounded-full pointer-events-none animate-ping ${
              pullFeedback.team === 'rojo' ? 'bg-red-500' : 'bg-blue-500'
            }`}
          >
            +0.5
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CAPA 5 (OVERLAY DE IMAGEN DE REFERENCIA): z-index: 6          */}
      {/* Guía semitransparente con opacidad para comparar composición  */}
      {/* ------------------------------------------------------------- */}
      {isReferenceVisible && customAssets?.referenceImageUrl && (
        <div
          className="absolute inset-0 z-[6] pointer-events-none select-none overflow-hidden transition-opacity duration-200"
          style={{ opacity: referenceOpacity }}
        >
          <img
            src={customAssets.referenceImageUrl}
            alt="Overlay de Referencia de Juego"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Rótulos de equipos en la base de las plataformas */}
      <div className="absolute bottom-2.5 inset-x-0 z-20 px-4 flex justify-between pointer-events-none font-pixel text-[9px] sm:text-[10px]">
        <span className="px-2.5 py-1 bg-red-600/90 text-white rounded-lg shadow-md border border-red-400/30">
          🔴 ROJO ({rojoPlayers.length})
        </span>
        <span className="px-2.5 py-1 bg-blue-600/90 text-white rounded-lg shadow-md border border-blue-400/30">
          ({azulPlayers.length}) AZUL 🔵
        </span>
      </div>
    </div>
  );
});

PixelScene.displayName = 'PixelScene';

/** Semáforo para Luz Roja / Verde */
const SemaphoreWidget = memo<{ state: 'green' | 'amber' | 'red' }>(({ state }) => {
  return (
    <div className="w-4 h-11 bg-[#181820] border border-neutral-600 rounded-sm p-0.5 flex flex-col justify-between items-center shadow-lg">
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          state === 'amber' ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]' : 'bg-amber-950'
        }`}
      />
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          state === 'red'
            ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]'
            : state === 'green'
            ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
            : 'bg-emerald-950'
        }`}
      />
    </div>
  );
});
SemaphoreWidget.displayName = 'SemaphoreWidget';
