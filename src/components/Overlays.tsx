import React from 'react';
import { GamePhase, Team, Player } from '../types';

interface OverlaysProps {
  phase: GamePhase;
  roundNumber: number;
  introCountdown: number; // 3, 2, 1, 0
  endedCountdown: number; // 9 -> 0
  seriesScore: { rojo: number; azul: number };
  seriesWon: Team | null; // Set if series reached 2 wins
  roundWinner: Team | 'tie' | null;
  rojoMVP: Player | null;
  azulMVP: Player | null;
  duelWinner: { player: Player; team: Team } | null;
  bestComboOfRound: {
    streak: number;
    userName: string;
    userNumber: string;
    team: Team;
    isRose: boolean;
  } | null;
  rojoCount: number;
  azulCount: number;
  onSkipIntro?: () => void;
}

export const Overlays: React.FC<OverlaysProps> = ({
  phase,
  roundNumber,
  introCountdown,
  endedCountdown,
  seriesScore,
  seriesWon,
  roundWinner,
  rojoMVP,
  azulMVP,
  duelWinner,
  bestComboOfRound,
  rojoCount,
  azulCount,
  onSkipIntro,
}) => {
  if (phase !== 'intro' && phase !== 'ended') {
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
      {/* 1. INTRO OVERLAY (3 Seconds) */}
      {phase === 'intro' && (
        <div className="bg-[#0c0c14]/95 border-2 border-yellow-400/80 rounded-2xl p-6 flex flex-col items-center text-center shadow-[0_0_50px_rgba(255,210,74,0.3)] backdrop-blur-md max-w-sm w-full animate-in zoom-in-95 duration-200">
          <div className="text-yellow-400 text-xs sm:text-sm font-bold tracking-widest uppercase font-mono">
            ◯ △ □ TORNEO
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-['Press_Start_2P'] text-white my-2">
            RONDA {roundNumber}
          </h2>

          {/* Giant Countdown */}
          <div className="my-3">
            <span
              className={`text-6xl sm:text-7xl font-black font-['Press_Start_2P'] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] ${
                introCountdown === 0
                  ? 'text-emerald-400 scale-125 animate-pulse'
                  : 'text-amber-400 animate-bounce'
              }`}
            >
              {introCountdown === 0 ? '¡YA!' : introCountdown}
            </span>
          </div>

          <div className="text-xs font-bold text-neutral-300 mb-2">
            Serie al mejor de 3: <span className="text-red-400">🔴 {seriesScore.rojo}</span> –{' '}
            <span className="text-blue-400">{seriesScore.azul} 🔵</span>
          </div>

          <div className="flex items-center justify-between w-full text-xs font-semibold px-4 py-2 bg-white/5 rounded-lg border border-white/10">
            <span className="text-red-400">🔴 {rojoCount} Jugadores</span>
            <span className="text-neutral-500 font-mono">VS</span>
            <span className="text-blue-400">🔵 {azulCount} Jugadores</span>
          </div>

          <div className="text-[10px] text-neutral-400 mt-2 italic">
            ¡Prepárense para halar! Comenta !rojo o !azul
          </div>

          {onSkipIntro && (
            <button
              onClick={onSkipIntro}
              className="mt-3 pointer-events-auto px-4 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <span>¡Comenzar Ronda Ya!</span>
              <span className="font-mono text-sm">⚡</span>
            </button>
          )}
        </div>
      )}

      {/* 2. ENDED OVERLAY (9 Seconds) */}
      {phase === 'ended' && (
        <div className="bg-[#0d0d16]/95 border-2 border-white/20 rounded-2xl p-5 flex flex-col items-center text-center shadow-2xl backdrop-blur-md max-w-md w-full animate-in zoom-in-95 duration-200">
          <div className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-neutral-400">
            RESULTADOS
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-['Press_Start_2P'] text-yellow-400 my-1">
            FIN DE LA RONDA {roundNumber}
          </h2>

          {/* Banner: Winner or Series Winner */}
          <div className="w-full my-2 p-2 rounded-xl border flex flex-col items-center justify-center bg-black/40 border-white/10">
            {seriesWon ? (
              <div className="text-center">
                <div className="text-sm sm:text-base font-black font-['Press_Start_2P'] text-yellow-300 animate-pulse">
                  🏆 ¡TEAM {seriesWon.toUpperCase()} GANA LA SERIE! 🏆
                </div>
                <div className="text-xs text-neutral-300 mt-1">
                  ¡Victoria histórica acumulada! Próxima serie en {endedCountdown}s
                </div>
              </div>
            ) : roundWinner === 'tie' ? (
              <div className="text-sm font-black font-['Press_Start_2P'] text-neutral-300">
                ⚖️ ¡EMPATE! LA SOGA QUEDÓ EN EQUILIBRIO
              </div>
            ) : (
              <div className="text-center">
                <div
                  className={`text-sm sm:text-base font-black font-['Press_Start_2P'] ${
                    roundWinner === 'rojo' ? 'text-red-400' : 'text-blue-400'
                  }`}
                >
                  ¡SOBREVIVE TEAM {roundWinner?.toUpperCase()}! 🎉
                </div>
                <div className="text-[11px] text-neutral-300 mt-0.5">
                  La plataforma contraria cayó al abismo
                </div>
              </div>
            )}
          </div>

          {/* Series Score in Large Format */}
          <div className="text-sm sm:text-base font-black font-['Press_Start_2P'] my-1 text-white">
            SERIE: <span className="text-red-500">🔴 {seriesScore.rojo}</span> –{' '}
            <span className="text-blue-500">{seriesScore.azul} 🔵</span>
          </div>

          {/* MVPs of each team */}
          <div className="grid grid-cols-2 gap-2 w-full my-2 text-xs">
            <div className="bg-red-950/60 border border-red-500/30 p-2 rounded-lg text-left">
              <div className="text-[10px] text-red-300 font-bold uppercase">MVP ROJO</div>
              {rojoMVP ? (
                <div className="font-bold text-white truncate">
                  {rojoMVP.formattedNumber} {rojoMVP.name} ({rojoMVP.points} pts)
                </div>
              ) : (
                <div className="text-neutral-500 text-[10px]">Sin datos</div>
              )}
            </div>

            <div className="bg-blue-950/60 border border-blue-500/30 p-2 rounded-lg text-left">
              <div className="text-[10px] text-blue-300 font-bold uppercase">MVP AZUL</div>
              {azulMVP ? (
                <div className="font-bold text-white truncate">
                  {azulMVP.formattedNumber} {azulMVP.name} ({azulMVP.points} pts)
                </div>
              ) : (
                <div className="text-neutral-500 text-[10px]">Sin datos</div>
              )}
            </div>
          </div>

          {/* Champion Duel Winner */}
          {duelWinner && (
            <div className="w-full text-xs bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-200 mb-1.5 flex items-center justify-between">
              <span>⚔️ Campeón del Duelo:</span>
              <span className="font-bold font-mono">
                {duelWinner.player.formattedNumber} {duelWinner.player.name} ({duelWinner.player.points} pts)
              </span>
            </div>
          )}

          {/* Best combo of the round if reached >= x3 */}
          {bestComboOfRound && bestComboOfRound.streak >= 3 && (
            <div className="w-full text-xs bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-lg text-purple-200 mb-1.5 flex items-center justify-between">
              <span>🔥 Mejor Combo:</span>
              <span className="font-bold font-mono">
                {bestComboOfRound.isRose ? '🌹' : ''} x{bestComboOfRound.streak} · {bestComboOfRound.userNumber}{' '}
                {bestComboOfRound.userName}
              </span>
            </div>
          )}

          {/* Countdown to next round */}
          <div className="text-xs text-neutral-400 font-mono mt-1">
            Siguiente ronda en <span className="text-yellow-400 font-bold">{endedCountdown}s</span>...
          </div>
        </div>
      )}
    </div>
  );
};
