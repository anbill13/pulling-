import React from 'react';
import { BigAnnouncement, MiniComboAlert, SideNotice } from '../types';

interface AnnouncementsProps {
  currentAnnouncement: BigAnnouncement | null;
  currentMiniCombo?: MiniComboAlert | null;
  sideNotices: SideNotice[];
  onDismissAnnouncement?: () => void;
  onDismissMiniCombo?: () => void;
}

export const Announcements: React.FC<AnnouncementsProps> = ({
  currentAnnouncement,
  currentMiniCombo,
  sideNotices,
  onDismissAnnouncement,
  onDismissMiniCombo,
}) => {
  // Strip any trailing or leading emojis and extra whitespace from the title
  // so text characters are strictly centered without any asymmetrical emoji widths
  const cleanTitle = currentAnnouncement
    ? currentAnnouncement.title
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .trim()
    : '';

  return (
    <>
      {/* 1. Central Big Announcement Banner (First-time ability modal, strictly centered) */}
      {currentAnnouncement && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
          <div
            onClick={onDismissAnnouncement}
            className={`pointer-events-auto cursor-pointer w-full max-w-sm sm:max-w-md flex flex-col items-center justify-center text-center p-6 sm:p-7 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.85)] border-2 backdrop-blur-xl animate-in zoom-in-95 duration-200 hover:scale-[1.01] transition-transform ${
              currentAnnouncement.team === 'rojo'
                ? 'bg-red-950/95 border-red-500 text-white shadow-red-500/40'
                : currentAnnouncement.team === 'azul'
                ? 'bg-blue-950/95 border-blue-500 text-white shadow-blue-500/40'
                : 'bg-amber-950/95 border-yellow-400 text-white shadow-yellow-500/40'
            }`}
            title="Click para cerrar aviso"
          >
            {/* Big Centered Icon */}
            <div className="w-full flex items-center justify-center text-5xl sm:text-6xl mb-3 text-center select-none filter drop-shadow-md animate-bounce">
              {currentAnnouncement.icon}
            </div>

            {/* Centered Content Block - Shared Width & Strict Center Alignment */}
            <div className="w-full max-w-xs sm:max-w-sm flex flex-col items-center justify-center text-center mx-auto">
              <div className="inline-flex items-center justify-center text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase font-mono px-3 py-0.5 rounded-full bg-white/10 text-yellow-300 mb-2.5 border border-white/15">
                HABILIDAD DESPLEGADA
              </div>

              {/* Title: Pixel Font, perfectly centered, NO tracking offset */}
              <h3 className="w-full text-center text-base sm:text-lg md:text-xl font-black font-['Press_Start_2P'] uppercase text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-relaxed m-0 p-0">
                {cleanTitle}
              </h3>

              {/* Subtitle: Sits directly below, perfectly centered in identical container */}
              <p className="w-full text-center text-xs sm:text-sm font-semibold text-white/95 mt-2.5 leading-relaxed m-0 p-0">
                {currentAnnouncement.subtitle}
              </p>

              {/* User badge: Centered */}
              {currentAnnouncement.userName && (
                <div className="inline-flex items-center justify-center text-center text-xs font-mono font-bold mt-3 text-white bg-black/60 px-3.5 py-1 rounded-full border border-white/20 gap-1.5 shadow-md">
                  <span className="text-yellow-300">{currentAnnouncement.userFormatted}</span>
                  <span className="truncate max-w-[150px]">{currentAnnouncement.userName}</span>
                </div>
              )}

              <div className="text-[10px] text-white/50 mt-3 font-mono">
                Toca para cerrar
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Mini Combo Floating Modal (Shown for repeated ability sends) */}
      {currentMiniCombo && (
        <div className="absolute inset-x-0 top-20 sm:top-16 flex items-center justify-center z-40 pointer-events-none px-4">
          <div
            onClick={onDismissMiniCombo}
            className={`pointer-events-auto cursor-pointer max-w-xs w-auto flex items-center justify-center gap-2.5 px-4 py-2 rounded-xl shadow-xl border-2 backdrop-blur-md animate-in slide-in-from-top-4 zoom-in-95 duration-150 ${
              currentMiniCombo.team === 'rojo'
                ? 'bg-red-950/95 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : 'bg-blue-950/95 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
            }`}
            title="Click para cerrar"
          >
            <div className="text-2xl sm:text-3xl filter drop-shadow animate-pulse">
              {currentMiniCombo.icon}
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black font-['Press_Start_2P'] uppercase text-yellow-300">
                <span>COMBO x{currentMiniCombo.comboCount}</span>
                <span className="text-[10px] text-white/80 font-mono">({currentMiniCombo.abilityName})</span>
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-white/90 flex items-center justify-center gap-1 mt-0.5">
                <span className="font-mono text-yellow-200">{currentMiniCombo.userFormatted}</span>
                <span className="truncate max-w-[110px]">{currentMiniCombo.userName}</span>
                {currentMiniCombo.bonusText && (
                  <span className="text-emerald-300 font-mono">· {currentMiniCombo.bonusText}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Side Alerts / Sliding Notices (Bottom-Left, Max 4 Visible, 4.5s expiry) */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 z-30 pointer-events-none max-w-[280px]">
        {sideNotices.slice(-4).map((notice) => (
          <div
            key={notice.id}
            className="flex items-center gap-1.5 bg-[#14141c]/95 border border-white/15 text-white px-2.5 py-1.5 rounded-lg shadow-lg text-[11px] font-medium backdrop-blur-sm animate-in slide-in-from-left duration-200"
          >
            {notice.icon && <span className="text-sm">{notice.icon}</span>}
            <span className="truncate">{notice.text}</span>
          </div>
        ))}
      </div>
    </>
  );
};
