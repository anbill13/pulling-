import React from 'react';
import { CollectiveGoal, GamePhase, Team } from '../types';
import { Volume2, VolumeX, Bot } from 'lucide-react';

interface TopBarProps {
  phase: GamePhase;
  timeLeft: number;
  seriesScore: { rojo: number; azul: number };
  seriesHistoricalWins: { rojo: number; azul: number };
  rojoCount: number;
  azulCount: number;
  championDuel: {
    rojoLeader: { name: string; number: string; points: number } | null;
    azulLeader: { name: string; number: string; points: number } | null;
  };
  collectiveGoal: CollectiveGoal;
  isGoldenRound: boolean;
  goldenRoundTimeRemaining: number;
  isAudioUnlocked: boolean;
  isMuted: boolean;
  onToggleSound: () => void;
  activeEffects: {
    rojoDoubleStrengthUntil: number;
    azulDoubleStrengthUntil: number;
    rojoSlowedUntil: number;
    azulSlowedUntil: number;
  };
  tiktokConnected?: boolean;
  tiktokUsername?: string | null;
  isSimulatingChat?: boolean;
  onToggleSimulateChat?: () => void;
  onStartRound?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  phase,
  timeLeft,
  seriesScore,
  seriesHistoricalWins,
  rojoCount,
  azulCount,
  championDuel,
  collectiveGoal,
  isGoldenRound,
  goldenRoundTimeRemaining,
  isAudioUnlocked,
  isMuted,
  onToggleSound,
  activeEffects,
  tiktokConnected = false,
  tiktokUsername = null,
  isSimulatingChat = false,
  onToggleSimulateChat,
  onStartRound,
}) => {
  const goalProgress = Math.min(
    100,
    (collectiveGoal.currentDiamonds / collectiveGoal.targetDiamonds) * 100
  );

  const now = Date.now();
  const rojoHasDouble = activeEffects.rojoDoubleStrengthUntil > now;
  const azulHasDouble = activeEffects.azulDoubleStrengthUntil > now;
  const rojoIsSlowed = activeEffects.rojoSlowedUntil > now;
  const azulIsSlowed = activeEffects.azulSlowedUntil > now;

  return (
    <div className="w-full bg-[#121218]/90 backdrop-blur-md border-b border-white/10 p-3 flex flex-col gap-2 rounded-t-2xl">
      {/* Title & Brand with Tournament Geometric Symbols */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[#ff2d87] text-xs sm:text-sm font-bold tracking-widest font-mono">
            ◯ △ □
          </span>
          <h1 className="text-white text-xs sm:text-sm md:text-base font-black tracking-wider uppercase font-['Press_Start_2P']">
            TIRA Y AFLOJA
          </h1>
          <span className="text-[10px] sm:text-xs text-[#ff2d87] font-bold px-1.5 py-0.5 bg-[#ff2d87]/15 rounded border border-[#ff2d87]/30">
            SUPERVIVENCIA
          </span>
        </div>

        {/* Live TikTok status indicator pill */}
        <div className="flex items-center gap-2">
          {tiktokUsername ? (
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                tiktokConnected
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  tiktokConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>@{tiktokUsername}</span>
              <span className="text-[10px] font-normal opacity-85">
                {tiktokConnected ? 'LIVE' : '(Offline • Modo Prueba)'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-950/60 border border-indigo-500/40 text-indigo-300">
              <Bot size={13} className={isSimulatingChat ? 'text-indigo-400 animate-pulse' : 'text-neutral-500'} />
              <span className="hidden sm:inline">Modo Prueba:</span>
              <span>{isSimulatingChat ? 'Bots ON' : 'Bots PAUSA'}</span>
              {onToggleSimulateChat && (
                <button
                  onClick={onToggleSimulateChat}
                  className="ml-1 text-[10px] bg-indigo-700/80 hover:bg-indigo-600 text-white px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  title={isSimulatingChat ? 'Pausar interacción de bots' : 'Reanudar interacción de bots'}
                >
                  {isSimulatingChat ? 'Pausar' : 'Activar'}
                </button>
              )}
            </div>
          )}

          {/* Audio Toggle & Mute Control */}
          <button
            onClick={onToggleSound}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              !isAudioUnlocked || isMuted
                ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                : 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
            }`}
            title="Presiona 'M' para silenciar"
          >
            {!isAudioUnlocked || isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{!isAudioUnlocked ? 'Activar Sonido' : isMuted ? 'Silenciado' : 'Sonido ON'}</span>
          </button>
        </div>
      </div>

      {/* Collective Live Diamond Goal Bar */}
      <div className="relative w-full bg-[#1c1c24] rounded-full h-5 p-0.5 border border-yellow-500/40 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isGoldenRound
              ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 animate-pulse'
              : 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-300'
          }`}
          style={{ width: `${goalProgress}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-['Outfit']">
          {isGoldenRound ? (
            <span className="text-yellow-200 animate-pulse font-extrabold flex items-center justify-center gap-2">
              <span className="text-sm">👑</span>
              <span>¡RONDA DE ORO ACTIVA! PUNTOS x2</span>
              <span className="font-mono bg-black/60 px-2 py-0.5 rounded border border-yellow-400 text-yellow-300 font-black text-xs sm:text-sm">
                {goldenRoundTimeRemaining}s
              </span>
            </span>
          ) : (
            <span>
              🎁 Meta del live: {collectiveGoal.currentDiamonds}/{collectiveGoal.targetDiamonds} 💎 → Ronda de Oro (30s)
            </span>
          )}
        </div>
      </div>

      {/* Main Scoreboard & Timer Row */}
      <div className="grid grid-cols-3 items-center pt-1">
        {/* Team Rojo Count & Active Status */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff3b3b] shadow-[0_0_8px_#ff3b3b]" />
            <span className="text-white text-xs sm:text-sm font-black font-['Press_Start_2P']">
              ROJO: {rojoCount}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] text-neutral-400">Series: {seriesHistoricalWins.rojo}</span>
            {rojoHasDouble && (
              <span className="text-[9px] bg-red-600/40 text-red-200 px-1 rounded font-bold border border-red-500">
                x2 FUERZA
              </span>
            )}
            {rojoIsSlowed && (
              <span className="text-[9px] bg-blue-900/60 text-blue-200 px-1 rounded font-bold border border-blue-400">
                50% LENTO
              </span>
            )}
          </div>
        </div>

        {/* Center Timer & Match Status */}
        <div className="flex flex-col items-center justify-center text-center">
          {phase === 'lobby' ? (
            <div className="flex flex-col items-center gap-1">
              <div className="text-[#ffd24a] text-xs sm:text-sm font-extrabold uppercase font-['Press_Start_2P'] animate-pulse">
                ESPERANDO
              </div>
              {onStartRound && (
                <button
                  onClick={onStartRound}
                  className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-[10px] rounded shadow cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                >
                  <span>▶ Iniciar Ronda</span>
                </button>
              )}
            </div>
          ) : (
            <div
              className={`text-2xl sm:text-3xl font-black font-['Press_Start_2P'] ${
                timeLeft <= 20
                  ? 'text-red-500 animate-pulse scale-105 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]'
                  : 'text-[#ffd24a]'
              }`}
            >
              {timeLeft}s
            </div>
          )}

          {/* Series best of 3 score */}
          <div className="text-[10px] sm:text-xs font-bold text-neutral-300 mt-0.5">
            Serie al mejor de 3: <span className="text-[#ff3b3b]">🔴 {seriesScore.rojo}</span> –{' '}
            <span className="text-[#3da5ff]">{seriesScore.azul} 🔵</span>
          </div>

          {/* Champion Duel Line */}
          {phase === 'round' && championDuel.rojoLeader && championDuel.azulLeader && (
            <div className="text-[9px] sm:text-[10px] text-amber-200/90 font-medium truncate max-w-full">
              ⚔️ Duelo: {championDuel.rojoLeader.number} {championDuel.rojoLeader.name} ({championDuel.rojoLeader.points}) vs{' '}
              {championDuel.azulLeader.number} {championDuel.azulLeader.name} ({championDuel.azulLeader.points})
            </div>
          )}
        </div>

        {/* Team Azul Count & Active Status */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xs sm:text-sm font-black font-['Press_Start_2P']">
              {azulCount} :AZUL
            </span>
            <span className="w-3 h-3 rounded-full bg-[#3da5ff] shadow-[0_0_8px_#3da5ff]" />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {azulHasDouble && (
              <span className="text-[9px] bg-cyan-600/40 text-cyan-200 px-1 rounded font-bold border border-cyan-400">
                x2 FUERZA
              </span>
            )}
            {azulIsSlowed && (
              <span className="text-[9px] bg-red-900/60 text-red-200 px-1 rounded font-bold border border-red-400">
                50% LENTO
              </span>
            )}
            <span className="text-[10px] text-neutral-400">Series: {seriesHistoricalWins.azul}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
