import React from 'react';
import { Player } from '../types';
import { CONFIG } from '../config';

interface LeaderboardsProps {
  rojoPlayers: Player[];
  azulPlayers: Player[];
  rojoCaptain: { name: string; number: string } | null;
  azulCaptain: { name: string; number: string } | null;
}

export const Leaderboards: React.FC<LeaderboardsProps> = ({
  rojoPlayers,
  azulPlayers,
  rojoCaptain,
  azulCaptain,
}) => {
  // Sort players by round points descending
  const topRojo = [...rojoPlayers].sort((a, b) => b.points - a.points).slice(0, 5);
  const topAzul = [...azulPlayers].sort((a, b) => b.points - a.points).slice(0, 5);

  const getRankInfo = (points: number) => {
    let currentRank = CONFIG.ranks[0];
    for (const r of CONFIG.ranks) {
      if (points >= r.min) {
        currentRank = r;
      }
    }
    return currentRank;
  };

  const getBadgeIcon = (badge: string) => {
    if (badge === 'myth') return '💎';
    if (badge === 'legend') return '🏅';
    if (badge === 'ally') return '🎖️';
    return '';
  };

  return (
    <div className="w-full grid grid-cols-2 gap-2 text-xs">
      {/* Team Rojo Leaderboard */}
      <div className="bg-[#181216]/90 border border-red-500/20 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-md">
        <div className="flex items-center justify-between border-b border-red-500/30 pb-1">
          <span className="text-[#ff3b3b] font-black font-['Press_Start_2P'] text-[10px]">
            🔴 TOP ROJO
          </span>
          <span className="text-[10px] text-neutral-400">Pts</span>
        </div>
        <div className="flex flex-col gap-1 min-h-[110px]">
          {topRojo.length === 0 ? (
            <div className="text-neutral-500 text-[10px] italic py-4 text-center">
              Comenta !rojo para unirte
            </div>
          ) : (
            topRojo.map((player) => {
              const rank = getRankInfo(player.points);
              const badgeIcon = getBadgeIcon(player.badge);
              const isCaptain = rojoCaptain && rojoCaptain.number === player.formattedNumber;

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-black/30 px-1.5 py-1 rounded border border-white/5"
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {player.formattedNumber}
                    </span>
                    {isCaptain && <span title="Capitán de la ronda">👑</span>}
                    {badgeIcon && <span title={`Insignia ${player.badge}`}>{badgeIcon}</span>}
                    <span className="text-white font-bold truncate max-w-[70px] sm:max-w-[100px]">
                      {player.name}
                    </span>
                    <span className="text-[10px]" title={rank.name}>
                      {rank.icon}
                    </span>
                  </div>
                  <span className="text-[#ff3b3b] font-extrabold font-mono text-[11px]">
                    {player.points}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Team Azul Leaderboard */}
      <div className="bg-[#10151c]/90 border border-blue-500/20 rounded-xl p-2.5 flex flex-col gap-1.5 shadow-md">
        <div className="flex items-center justify-between border-b border-blue-500/30 pb-1">
          <span className="text-[#3da5ff] font-black font-['Press_Start_2P'] text-[10px]">
            🔵 TOP AZUL
          </span>
          <span className="text-[10px] text-neutral-400">Pts</span>
        </div>
        <div className="flex flex-col gap-1 min-h-[110px]">
          {topAzul.length === 0 ? (
            <div className="text-neutral-500 text-[10px] italic py-4 text-center">
              Comenta !azul para unirte
            </div>
          ) : (
            topAzul.map((player) => {
              const rank = getRankInfo(player.points);
              const badgeIcon = getBadgeIcon(player.badge);
              const isCaptain = azulCaptain && azulCaptain.number === player.formattedNumber;

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-black/30 px-1.5 py-1 rounded border border-white/5"
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {player.formattedNumber}
                    </span>
                    {isCaptain && <span title="Capitán de la ronda">👑</span>}
                    {badgeIcon && <span title={`Insignia ${player.badge}`}>{badgeIcon}</span>}
                    <span className="text-white font-bold truncate max-w-[70px] sm:max-w-[100px]">
                      {player.name}
                    </span>
                    <span className="text-[10px]" title={rank.name}>
                      {rank.icon}
                    </span>
                  </div>
                  <span className="text-[#3da5ff] font-extrabold font-mono text-[11px]">
                    {player.points}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
