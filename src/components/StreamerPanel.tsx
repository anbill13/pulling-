import React, { useState } from 'react';
import { ThankYouItem, Team } from '../types';
import { Check, Trash2, Bot, Play, Settings2, Sparkles, Music, Volume2, Users, Zap } from 'lucide-react';
import { audio, RetroTrackId } from '../audio';
import { BotIntensity, BotThemeId, BOT_THEMES } from '../testBotSimulator';

interface StreamerPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onSimulateEvent: (event: {
    type: 'comment' | 'like' | 'gift';
    user: string;
    text?: string;
    count?: number;
    value?: number;
    giftName?: string;
  }) => void;
  onForceStart: () => void;
  onClearVictories: () => void;
  isSimulatingChat: boolean;
  onToggleSimulateChat: () => void;
  botIntensity?: BotIntensity;
  onSetBotIntensity?: (intensity: BotIntensity) => void;
  botTheme?: BotThemeId;
  onSelectBotTheme?: (theme: BotThemeId) => void;
  onSpawnBots?: () => void;
  onTriggerCombo10: () => void;
  onTriggerGiftRain: () => void;
  onTriggerSync: () => void;
  onTriggerComeback: () => void;
  onTriggerSafeBox: () => void;
  onTriggerRedLight: () => void;
  onTriggerGoldenRound?: () => void;
  onTriggerSurge?: (team: Team) => void;
  thankYouQueue: ThankYouItem[];
  onAcknowledgeDonor: (id: string) => void;
  onClearThankYouQueue: () => void;
  tiktokConnected: boolean;
  tiktokUsername: string | null;
  tiktokMode?: string;
  onUpdateTikTokUsername?: (newUsername: string) => Promise<void>;
  retroTrack?: RetroTrackId;
  onSelectRetroTrack?: (track: RetroTrackId) => void;
  customBgmUrl?: string | null;
  onUploadCustomBgm?: (file: File) => Promise<void>;
  onClearCustomBgm?: () => void;
  isMuted?: boolean;
  onToggleSound?: () => void;
  masterVolume?: number;
  onChangeMasterVolume?: (volume: number) => void;
  onTriggerTestAchievement?: () => void;
  onOpenAssetManager?: () => void;
  showMetaLines?: boolean;
  onToggleMetaLines?: () => void;
  difficultyMode?: 'normal' | 'hard' | 'extreme';
  onSelectDifficultyMode?: (mode: 'normal' | 'hard' | 'extreme') => void;
  isReferenceVisible?: boolean;
  onToggleReferenceOverlay?: () => void;
}

export const StreamerPanel: React.FC<StreamerPanelProps> = ({
  isOpen,
  onToggleOpen,
  onSimulateEvent,
  onForceStart,
  onClearVictories,
  isSimulatingChat,
  onToggleSimulateChat,
  botIntensity = 'normal',
  onSetBotIntensity,
  botTheme = 'gaming',
  onSelectBotTheme,
  onSpawnBots,
  onTriggerCombo10,
  onTriggerGiftRain,
  onTriggerSync,
  onTriggerComeback,
  onTriggerSafeBox,
  onTriggerRedLight,
  onTriggerGoldenRound,
  onTriggerSurge,
  thankYouQueue,
  onAcknowledgeDonor,
  onClearThankYouQueue,
  tiktokConnected,
  tiktokUsername,
  tiktokMode = 'test',
  onUpdateTikTokUsername,
  retroTrack = 'battle',
  onSelectRetroTrack,
  customBgmUrl = null,
  onUploadCustomBgm,
  onClearCustomBgm,
  isMuted = false,
  onToggleSound,
  masterVolume = 0.6,
  onChangeMasterVolume,
  onTriggerTestAchievement,
  onOpenAssetManager,
  showMetaLines = true,
  onToggleMetaLines,
  difficultyMode = 'hard',
  onSelectDifficultyMode,
  isReferenceVisible = false,
  onToggleReferenceOverlay,
}) => {
  const [simUser, setSimUser] = useState('JugadorPro');
  const [simText, setSimText] = useState('!rojo');
  const [editUsername, setEditUsername] = useState(tiktokUsername || '');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const audioInputRef = React.useRef<HTMLInputElement>(null);

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAudio(true);
    try {
      if (onUploadCustomBgm) {
        await onUploadCustomBgm(file);
      }
    } finally {
      setIsUploadingAudio(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  const handleSaveUsername = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onUpdateTikTokUsername) return;
    setIsUpdatingUser(true);
    try {
      await onUpdateTikTokUsername(editUsername.trim().replace(/^@+/, ''));
    } finally {
      setIsUpdatingUser(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed bottom-4 right-4 z-50 bg-[#1e1e28] hover:bg-[#2b2b3a] text-white p-3 rounded-full border border-white/20 shadow-xl cursor-pointer flex items-center gap-2 text-xs font-bold transition-all hover:scale-105"
        title="Abrir Panel de Pruebas (Tecla T)"
      >
        <Settings2 size={18} className="text-[#ff2d87]" />
        <span>Panel Streamer</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[#14141e]/98 border border-white/20 rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-w-sm w-full text-white text-xs flex flex-col gap-3 max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Settings2 size={16} className="text-[#ff2d87]" />
          <span className="font-black uppercase tracking-wider font-['Press_Start_2P'] text-[10px]">
            PANEL DE PRUEBAS
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenAssetManager && (
            <button
              onClick={onOpenAssetManager}
              className="px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-400/50 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Subir carpetas de sprites, ajustar tamaños y capas visuales"
            >
              <span>📁</span>
              <span>Sprites & Activos</span>
            </button>
          )}
          <button
            onClick={onToggleOpen}
            className="text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-white/5 cursor-pointer text-xs"
          >
            Cerrar (T)
          </button>
        </div>
      </div>

      {/* TikTok Status Banner & Username Switcher */}
      <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-neutral-300 font-medium">Conexión TikTok:</span>
          <span
            className={`font-bold flex items-center gap-1.5 ${
              tiktokConnected
                ? 'text-emerald-400'
                : tiktokUsername
                ? tiktokMode === 'offline'
                  ? 'text-amber-400'
                  : 'text-yellow-400'
                : 'text-neutral-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                tiktokConnected
                  ? 'bg-emerald-400 animate-pulse'
                  : tiktokUsername
                  ? 'bg-amber-400'
                  : 'bg-neutral-500'
              }`}
            />
            {tiktokConnected
              ? `@${tiktokUsername} (EN VIVO)`
              : tiktokUsername
              ? tiktokMode === 'offline'
                ? `@${tiktokUsername} (Offline)`
                : `@${tiktokUsername} (Reconectando)`
              : 'Modo Prueba (Sin usuario)'}
          </span>
        </div>

        {/* Informative notice when offline */}
        {!tiktokConnected && tiktokUsername && (
          <div className="text-[10px] text-amber-300/80 bg-amber-950/40 p-1.5 rounded border border-amber-500/20 leading-relaxed">
            @{tiktokUsername} no está transmitiendo en vivo ahora. El juego está en <strong>Modo Prueba</strong> (listo para jugar con bots) y se reconectará automáticamente cada 10 s al iniciar el LIVE.
          </div>
        )}

        {/* Change TikTok Username form */}
        <form onSubmit={handleSaveUsername} className="flex items-center gap-1.5 mt-0.5">
          <input
            type="text"
            placeholder="Cambiar @usuario de TikTok"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
            className="flex-1 bg-[#1e1e2c] border border-white/10 rounded px-2 py-1 text-white text-[11px] outline-none focus:border-[#ff2d87]"
          />
          <button
            type="submit"
            disabled={isUpdatingUser}
            className="bg-[#ff2d87] hover:bg-[#e02677] disabled:opacity-50 text-white font-bold px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer"
          >
            {isUpdatingUser ? 'Conectando...' : 'Guardar'}
          </button>
        </form>
      </div>

      {/* Manual Input Controls */}
      <div className="flex flex-col gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-neutral-400 block mb-0.5">Usuario</label>
            <input
              type="text"
              value={simUser}
              onChange={(e) => setSimUser(e.target.value)}
              className="w-full bg-[#1e1e2c] border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-[#ff2d87]"
            />
          </div>
          <div>
            <label className="text-[10px] text-neutral-400 block mb-0.5">Mensaje</label>
            <input
              type="text"
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              placeholder="!rojo, !azul, !cambio..."
              className="w-full bg-[#1e1e2c] border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-[#ff2d87]"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            onClick={() => onSimulateEvent({ type: 'comment', user: simUser, text: simText })}
            className="bg-neutral-700 hover:bg-neutral-600 px-2 py-1.5 rounded font-bold transition-colors cursor-pointer"
          >
            💬 Comentario
          </button>
          <button
            onClick={() => onSimulateEvent({ type: 'like', user: simUser, count: 10 })}
            className="bg-neutral-700 hover:bg-neutral-600 px-2 py-1.5 rounded font-bold transition-colors cursor-pointer"
          >
            ❤️ Like x10
          </button>
          <button
            onClick={() =>
              onSimulateEvent({
                type: 'gift',
                user: simUser,
                giftName: 'Rosa',
                count: 1,
                value: 1,
              })
            }
            className="bg-rose-900/80 hover:bg-rose-800 border border-rose-500/50 px-2 py-1.5 rounded font-bold transition-colors cursor-pointer"
          >
            🌹 Rosa (1💎)
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() =>
              onSimulateEvent({
                type: 'gift',
                user: simUser,
                giftName: 'Escudo',
                count: 1,
                value: 3,
              })
            }
            className="bg-blue-900/60 hover:bg-blue-800 border border-blue-500/40 px-2 py-1 rounded text-[11px] font-bold cursor-pointer"
          >
            🛡️ Escudo (3💎)
          </button>
          <button
            onClick={() =>
              onSimulateEvent({
                type: 'gift',
                user: simUser,
                giftName: 'Ralentizar',
                count: 1,
                value: 7,
              })
            }
            className="bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 px-2 py-1 rounded text-[11px] font-bold cursor-pointer"
          >
            🧊 Lento (7💎)
          </button>
          <button
            onClick={() =>
              onSimulateEvent({
                type: 'gift',
                user: simUser,
                giftName: 'Doble Fuerza',
                count: 1,
                value: 15,
              })
            }
            className="bg-amber-900/60 hover:bg-amber-800 border border-amber-500/40 px-2 py-1 rounded text-[11px] font-bold cursor-pointer"
          >
            ⚡ Doble (15💎)
          </button>
        </div>
      </div>

      {/* Special Triggers & Combo Buttons */}
      <div className="flex flex-col gap-1.5 bg-black/30 p-2.5 rounded-xl border border-white/5">
        <span className="text-[10px] text-neutral-400 font-bold uppercase">
          Simulaciones de Combos y Eventos
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onTriggerCombo10}
            className="bg-neutral-800 hover:bg-neutral-700 px-2 py-1.5 rounded text-left font-bold cursor-pointer flex items-center gap-1.5"
          >
            <span>🌹 x10 Combo</span>
          </button>
          <button
            onClick={onTriggerGiftRain}
            className="bg-neutral-800 hover:bg-neutral-700 px-2 py-1.5 rounded text-left font-bold cursor-pointer flex items-center gap-1.5"
          >
            <span>🌧️ Lluvia</span>
          </button>
          <button
            onClick={onTriggerSync}
            className="bg-neutral-800 hover:bg-neutral-700 px-2 py-1.5 rounded text-left font-bold cursor-pointer flex items-center gap-1.5"
          >
            <span>🤝 Sincronía</span>
          </button>
          <button
            onClick={onTriggerComeback}
            className="bg-neutral-800 hover:bg-neutral-700 px-2 py-1.5 rounded text-left font-bold cursor-pointer flex items-center gap-1.5"
          >
            <span>🔄 Remontada</span>
          </button>
          <button
            onClick={onTriggerSafeBox}
            className="bg-amber-950/70 hover:bg-amber-900 border border-yellow-500/40 px-2 py-1.5 rounded text-left font-bold cursor-pointer flex items-center gap-1.5 text-yellow-300"
          >
            <span>🔐 Caja Fuerte</span>
          </button>
          <button
            onClick={onTriggerRedLight}
            className="bg-red-950/70 hover:bg-red-900 border border-red-500/40 px-2 py-1.5 rounded text-left font-bold cursor-pointer flex items-center gap-1.5 text-red-300"
          >
            <span>🚨 Luz Roja</span>
          </button>
          {onTriggerGoldenRound && (
            <button
              onClick={onTriggerGoldenRound}
              className="bg-yellow-950/80 hover:bg-yellow-900 border border-yellow-500/50 px-2 py-1.5 rounded text-left font-bold cursor-pointer flex items-center gap-1.5 text-yellow-300 col-span-2 shadow-[0_0_12px_rgba(255,210,74,0.15)]"
            >
              <span>👑 Ronda de Oro (30s Puntos x2)</span>
            </button>
          )}
          {onTriggerTestAchievement && (
            <button
              onClick={onTriggerTestAchievement}
              className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-white border border-yellow-300/50 px-2 py-1.5 rounded text-left font-black cursor-pointer flex items-center gap-1.5 col-span-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.01]"
            >
              <span>🎉 Probar Logro (Confeti + Destello)</span>
            </button>
          )}
          {onTriggerSurge && (
            <>
              <button
                onClick={() => onTriggerSurge('rojo')}
                className="bg-red-900/60 hover:bg-red-800 border border-red-500/30 px-2 py-1.5 rounded text-left font-bold cursor-pointer flex items-center gap-1.5 text-red-200"
              >
                <span>🔥 Oleada Rojo</span>
              </button>
              <button
                onClick={() => onTriggerSurge('azul')}
                className="bg-blue-900/60 hover:bg-blue-800 border border-blue-500/30 px-2 py-1.5 rounded text-left font-bold cursor-pointer flex items-center gap-1.5 text-blue-200"
              >
                <span>⚡ Oleada Azul</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Estudio de Sprites, Metas y Referencia (Controles de Streamer) */}
      <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-gradient-to-br from-[#1d172e] via-[#161426] to-[#0e0d18] border border-purple-500/40 shadow-xl">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
          <span className="text-purple-300 font-bold text-[11px] flex items-center gap-1.5 font-['Press_Start_2P']">
            <span>🎨</span> ESTUDIO & METAS
          </span>
          <span className="text-[9px] bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/30 font-mono">
            Panel Streamer
          </span>
        </div>

        {/* Botón Principal: Abrir Estudio de Sprites */}
        {onOpenAssetManager && (
          <button
            type="button"
            onClick={onOpenAssetManager}
            className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white font-black rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-white/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 text-[10px] font-['Press_Start_2P']"
          >
            <span>🎨</span>
            <span>ABRIR ESTUDIO SPRITES</span>
          </button>
        )}

        {/* Fila de Botones: Metas y Referencia */}
        <div className="grid grid-cols-2 gap-2">
          {/* Toggle Metas */}
          {onToggleMetaLines && (
            <button
              type="button"
              onClick={onToggleMetaLines}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                showMetaLines
                  ? 'bg-amber-950/50 border-amber-500/60 text-amber-200 shadow-sm'
                  : 'bg-black/50 border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1">
                  <span>🏁</span> Metas
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    showMetaLines ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {showMetaLines ? 'VISIBLES' : 'OCULTAS'}
                </span>
              </div>
              <span className="text-[9px] text-neutral-400 leading-tight">
                {showMetaLines ? 'Líneas rojas y azules en arena' : 'Arena 100% limpia'}
              </span>
            </button>
          )}

          {/* Toggle Referencia */}
          {onToggleReferenceOverlay && (
            <button
              type="button"
              onClick={onToggleReferenceOverlay}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                isReferenceVisible
                  ? 'bg-purple-950/60 border-purple-500/70 text-purple-200 shadow-sm'
                  : 'bg-black/50 border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1">
                  <span>👁️</span> Referencia
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    isReferenceVisible ? 'bg-purple-500 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {isReferenceVisible ? 'ON' : 'OFF'}
                </span>
              </div>
              <span className="text-[9px] text-neutral-400 leading-tight">
                {isReferenceVisible ? 'Overlay sobre escena activo' : 'Overlay apagado'}
              </span>
            </button>
          )}
        </div>

        {/* Selector de Dificultad Competitiva */}
        <div className="flex flex-col gap-1 pt-1.5 border-t border-white/10">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-neutral-300 font-bold uppercase">Dificultad de Puntos & Empuje:</span>
            <span className="text-amber-300 font-mono font-bold">
              {difficultyMode === 'extreme' ? 'Titán (0.02)' : difficultyMode === 'normal' ? 'Estándar (0.010)' : 'Competitivo (0.05)'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-0.5">
            <button
              type="button"
              onClick={() => onSelectDifficultyMode?.('normal')}
              className={`py-1.5 px-1 rounded text-[10px] font-bold cursor-pointer text-center border transition-all ${
                difficultyMode === 'normal'
                  ? 'bg-blue-600/30 text-blue-300 border-blue-400 shadow-sm'
                  : 'bg-neutral-800 text-neutral-400 border-white/10 hover:bg-neutral-700'
              }`}
            >
              ⚡ Estándar (0.010)
            </button>
            <button
              type="button"
              onClick={() => onSelectDifficultyMode?.('hard')}
              className={`py-1.5 px-1 rounded text-[10px] font-bold cursor-pointer text-center border transition-all ${
                (difficultyMode ?? 'hard') === 'hard'
                  ? 'bg-amber-600/30 text-amber-300 border-amber-400 shadow-sm'
                  : 'bg-neutral-800 text-neutral-400 border-white/10 hover:bg-neutral-700'
              }`}
            >
              🔥 Competitivo (0.05)
            </button>
            <button
              type="button"
              onClick={() => onSelectDifficultyMode?.('extreme')}
              className={`py-1.5 px-1 rounded text-[10px] font-bold cursor-pointer text-center border transition-all ${
                difficultyMode === 'extreme'
                  ? 'bg-red-600/30 text-red-300 border-red-400 shadow-sm'
                  : 'bg-neutral-800 text-neutral-400 border-white/10 hover:bg-neutral-700'
              }`}
            >
              💀 Titán (0.02)
            </button>
          </div>
          <p className="text-[9px] text-neutral-400 leading-tight mt-0.5">
            Estándar: 0.010 • Competitivo: 0.05 • Titán: 0.02 (Regalos y comentarios proporcionales)
          </p>
        </div>
      </div>

      {/* Música de Fondo & Volumen General (Controles Streamer) */}
      <div className="flex flex-col gap-2.5 bg-gradient-to-br from-[#181528] via-[#12111c] to-[#0c0b14] p-3 rounded-xl border border-yellow-500/30 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-yellow-300 font-bold text-[11px] font-['Press_Start_2P']">
            <Music size={13} className="text-yellow-400" />
            <span>MÚSICA DE FONDO</span>
          </div>
          <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30 font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            BUCLE CONTINUO
          </span>
        </div>

        {/* Cargar Canción Oficial (Archivo de Audio) */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-black/40 border border-white/10">
          <input
            type="file"
            ref={audioInputRef}
            onChange={handleAudioFileChange}
            accept="audio/*,.mp3,.wav,.ogg,.m4a"
            className="hidden"
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-300 font-bold">
              Pista Oficial de la Transmisión:
            </span>
            {customBgmUrl ? (
              <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Canción Oficial Activa
              </span>
            ) : (
              <span className="text-[9px] text-yellow-400 font-mono font-bold">
                8-Bit Retro Activo
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              disabled={isUploadingAudio}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-black text-[10px] rounded-lg border border-yellow-400/40 shadow cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Music size={13} />
              <span>{isUploadingAudio ? 'Cargando Audio...' : customBgmUrl ? 'Cambiar Canción (MP3 / WAV)' : 'Subir Canción de Fondo (MP3)'}</span>
            </button>

            {customBgmUrl && onClearCustomBgm && (
              <button
                type="button"
                onClick={onClearCustomBgm}
                className="py-2 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg border border-white/10 text-[10px] cursor-pointer font-bold transition-colors"
                title="Quitar canción personalizada y volver a 8-Bit por defecto"
              >
                Restaurar
              </button>
            )}
          </div>
        </div>

        {/* Control de Volumen General */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-black/40 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-300 font-bold flex items-center gap-1.5">
              <Volume2 size={13} className="text-yellow-400" />
              <span>Volumen General:</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-yellow-300">
                {isMuted ? 'MUTE' : `${Math.round((masterVolume ?? 0.6) * 100)}%`}
              </span>
              {onToggleSound && (
                <button
                  type="button"
                  onClick={onToggleSound}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all border ${
                    isMuted
                      ? 'bg-red-950 text-red-300 border-red-500/40 hover:bg-red-900'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                  }`}
                >
                  {isMuted ? 'Silenciado' : 'Activo'}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[9px] text-neutral-500 font-mono">0%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : masterVolume ?? 0.6}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onChangeMasterVolume?.(val);
                if (isMuted && val > 0 && onToggleSound) {
                  onToggleSound();
                }
              }}
              className="w-full accent-yellow-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
            />
            <span className="text-[9px] text-neutral-500 font-mono">100%</span>
          </div>

          <p className="text-[9px] text-neutral-400 leading-tight pt-1 border-t border-white/5">
            💡 La música suena en bucle infinito continuo. Cuando un equipo supera el 70% de la soga o entra en peligro, el juego baja automáticamente el volumen y superpone los efectos de tensión de la batalla.
          </p>
        </div>
      </div>

      {/* Streamer Match Controls & Bot Simulator */}
      <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
            <Bot size={14} />
            <span>SISTEMA DE BOTS EN MODO PRUEBA</span>
          </div>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
              isSimulatingChat
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {isSimulatingChat ? '● ACTIVOS' : '○ PAUSADOS'}
          </span>
        </div>

        <p className="text-[10px] text-neutral-300 leading-tight">
          Los bots se unen a los equipos, halan la soga, envían likes, donan rosas y poderes, compiten por la Caja Fuerte y respetan la Luz Roja.
        </p>

        {/* Bot Intensity Selector */}
        <div className="flex items-center justify-between gap-1 pt-1">
          <span className="text-[9px] text-neutral-400 font-bold uppercase">Ritmo de Bots:</span>
          <div className="flex items-center gap-1">
            {(['calm', 'normal', 'intense'] as BotIntensity[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onSetBotIntensity?.(mode)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                  botIntensity === mode
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {mode === 'calm' ? 'Tranquilo' : mode === 'normal' ? 'Normal' : 'Intenso ⚡'}
              </button>
            ))}
          </div>
        </div>

        {/* Bot Themes Selector (Requested: agregar bots en diferentes temas para pruebas reales) */}
        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-indigo-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-indigo-300 font-bold uppercase flex items-center gap-1">
              <span>🎭 Tema de Bots:</span>
            </span>
            <span className="text-[9px] text-neutral-400 font-mono">
              {BOT_THEMES.find((t) => t.id === botTheme)?.rojoTeamName} vs {BOT_THEMES.find((t) => t.id === botTheme)?.azulTeamName}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {BOT_THEMES.map((theme) => {
              const isSelected = botTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => onSelectBotTheme?.(theme.id)}
                  className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col ${
                    isSelected
                      ? 'bg-indigo-600/40 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.25)]'
                      : 'bg-neutral-900/80 border-white/5 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <span>{theme.icon}</span>
                    <span className="truncate">{theme.name}</span>
                  </div>
                  <span className="text-[8.5px] text-neutral-400 leading-tight line-clamp-1 mt-0.5">
                    {theme.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Match Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onForceStart}
            className="bg-emerald-700 hover:bg-emerald-600 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md text-xs"
          >
            <Play size={14} />
            <span>Iniciar Partida</span>
          </button>
          <button
            onClick={onToggleSimulateChat}
            className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors text-xs ${
              isSimulatingChat
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <Bot size={14} />
            <span>{isSimulatingChat ? 'Pausar Bots' : 'Reanudar Bots'}</span>
          </button>
        </div>

        {onSpawnBots && (
          <button
            onClick={onSpawnBots}
            className="w-full bg-neutral-800 hover:bg-neutral-700 py-1.5 rounded text-[11px] font-bold text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer border border-white/5 transition-colors"
          >
            <Users size={12} className="text-indigo-400" />
            <span>Repoblar Escuadras (Rojo vs Azul)</span>
          </button>
        )}
      </div>

      <button
        onClick={onClearVictories}
        className="text-[10px] text-neutral-400 hover:text-red-400 py-1 text-center cursor-pointer transition-colors"
      >
        Borrar victorias históricas
      </button>

      {/* COLA DE AGRADECIMIENTOS (Streamer Only) */}
      <div className="border-t border-white/10 pt-2 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="font-bold text-[11px] text-yellow-300 uppercase">
              Cola de Agradecimientos ({thankYouQueue.length})
            </span>
          </div>
          {thankYouQueue.length > 0 && (
            <button
              onClick={onClearThankYouQueue}
              className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={11} /> Limpiar
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
          {thankYouQueue.length === 0 ? (
            <div className="text-neutral-500 text-[10px] italic py-2 text-center">
              No hay donaciones pendientes
            </div>
          ) : (
            thankYouQueue.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-1.5 rounded border transition-opacity ${
                  item.acknowledged
                    ? 'opacity-35 bg-black/20 border-white/5'
                    : 'bg-black/40 border-yellow-500/30'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {item.isFirstGift && <span title="¡Primer regalo!">🎉</span>}
                  <span className="font-mono text-[10px] text-neutral-400">
                    {item.userNumber}
                  </span>
                  <span
                    className={`font-bold truncate max-w-[80px] ${
                      item.team === 'rojo' ? 'text-red-400' : 'text-blue-400'
                    }`}
                  >
                    {item.userName}
                  </span>
                  <span className="text-yellow-300 text-[10px] font-mono">
                    {item.diamonds}💎 ({item.lastGiftName})
                  </span>
                </div>
                <button
                  onClick={() => onAcknowledgeDonor(item.id)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer ${
                    item.acknowledged
                      ? 'bg-neutral-800 text-neutral-400'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  }`}
                >
                  <Check size={11} />
                  <span>Agradecido</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
