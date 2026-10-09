import React, { useEffect, useRef } from 'react';
import { RoundAchievement } from '../types';
import { Sparkles, Trophy, Award } from 'lucide-react';

interface AchievementOverlayProps {
  currentAchievement: RoundAchievement | null;
  onDismiss?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'star';
  alpha: number;
  decay: number;
}

export const AchievementOverlay: React.FC<AchievementOverlayProps> = ({
  currentAchievement,
  onDismiss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas confetti particle animation
  useEffect(() => {
    if (!currentAchievement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors =
      currentAchievement.team === 'rojo'
        ? ['#ef4444', '#f87171', '#f59e0b', '#fbbf24', '#ffffff', '#ec4899']
        : ['#3b82f6', '#60a5fa', '#f59e0b', '#fbbf24', '#ffffff', '#06b6d4'];

    const particleCount = 140;
    const particles: Particle[] = [];

    const originX = canvas.width / 2;
    const originY = canvas.height * 0.35;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 11;
      particles.push({
        x: originX + (Math.random() - 0.5) * 60,
        y: originY + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4, // Upward bias
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        shape: Math.random() > 0.4 ? 'rect' : Math.random() > 0.5 ? 'star' : 'circle',
        alpha: 1,
        decay: 0.008 + Math.random() * 0.012,
      });
    }

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let aliveCount = 0;
      for (const p of particles) {
        if (p.alpha <= 0) continue;
        aliveCount++;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // Gravity
        p.vx *= 0.98; // Air drag
        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // 4-point sparkle star
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.3, -p.size * 0.3);
          ctx.lineTo(p.size, 0);
          ctx.lineTo(p.size * 0.3, p.size * 0.3);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size * 0.3, p.size * 0.3);
          ctx.lineTo(-p.size, 0);
          ctx.lineTo(-p.size * 0.3, -p.size * 0.3);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      if (aliveCount > 0) {
        animationId = requestAnimationFrame(render);
      }
    };

    animationId = requestAnimationFrame(render);

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentAchievement]);

  if (!currentAchievement) return null;

  const isRojo = currentAchievement.team === 'rojo';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-16 sm:pt-20 px-4 overflow-hidden">
      {/* Canvas Confetti */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

      {/* Central Flash / Starburst Flare */}
      <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none z-0 animate-ping opacity-30">
        <div className={`w-full h-full rounded-full blur-3xl ${isRojo ? 'bg-red-500' : 'bg-blue-500'}`} />
      </div>
      <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none z-0">
        <div className="w-full h-full rounded-full bg-yellow-300 blur-2xl opacity-40 animate-pulse" />
      </div>

      {/* Rotating Starburst Ray Flares */}
      <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 pointer-events-none z-0 opacity-40 animate-[spin_10s_linear_infinite]">
        <svg viewBox="0 0 100 100" className="w-full h-full text-amber-300 fill-current opacity-30">
          <polygon points="50,0 52,48 100,50 52,52 50,100 48,52 0,50 48,48" />
          <polygon points="15,15 48,49 85,85 52,51" />
          <polygon points="85,15 51,49 15,85 49,51" />
        </svg>
      </div>

      {/* Achievement Card Popup */}
      <div
        className={`relative z-20 pointer-events-auto flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl border-2 shadow-[0_0_50px_rgba(245,158,11,0.5)] backdrop-blur-xl animate-in zoom-in-75 duration-300 max-w-sm sm:max-w-md w-full text-center ${
          isRojo
            ? 'bg-gradient-to-b from-[#2a1018] via-[#1a0e14] to-[#120a0e] border-amber-400 text-red-100'
            : 'bg-gradient-to-b from-[#101b2f] via-[#0d1525] to-[#080d17] border-amber-400 text-blue-100'
        }`}
      >
        {/* Floating Crown / Sparkle badge */}
        <div className="absolute -top-6 flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-black shadow-lg flex items-center gap-1.5 font-['Press_Start_2P'] border border-yellow-200">
            <Trophy size={12} className="text-black" />
            <span>¡LOGRO DE RONDA!</span>
            <Sparkles size={12} className="text-black" />
          </span>
        </div>

        {/* Big Icon with Glowing Ring */}
        <div className="relative mt-2">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-inner border-2 ${
              isRojo
                ? 'bg-gradient-to-br from-red-600 to-rose-950 border-yellow-400 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                : 'bg-gradient-to-br from-blue-600 to-indigo-950 border-yellow-400 shadow-[0_0_20px_rgba(59,130,246,0.6)]'
            }`}
          >
            <span>{currentAchievement.icon}</span>
          </div>
          <span className="absolute -bottom-1 -right-1 text-xs bg-amber-400 text-black font-black px-1.5 py-0.5 rounded-full border border-black shadow">
            ⭐ HIT
          </span>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-0.5 mt-1">
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-['Press_Start_2P']">
            {currentAchievement.title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 font-medium">
            {currentAchievement.description}
          </p>
        </div>

        {/* User Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold shadow-sm ${
            isRojo
              ? 'bg-red-950/80 border-red-500/50 text-red-200'
              : 'bg-blue-950/80 border-blue-500/50 text-blue-200'
          }`}
        >
          <Award size={16} className={isRojo ? 'text-red-400' : 'text-blue-400'} />
          <span className="font-mono text-yellow-400 font-black">
            {currentAchievement.userFormatted || ''}
          </span>
          <span className="text-white font-extrabold truncate max-w-[150px]">
            @{currentAchievement.userName}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-black font-mono ${
              isRojo ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {isRojo ? '🔴 ROJO' : '🔵 AZUL'}
          </span>
        </div>
      </div>
    </div>
  );
};
