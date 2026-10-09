import React, { useState } from 'react';
import { ActiveEffects, Team } from '../types';
import { Zap, Shield, Snowflake, Flame, Gift, Users, Lock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface PowersDisplayProps {
  activeEffects?: ActiveEffects;
  className?: string;
}

interface PowerItem {
  id: string;
  name: string;
  cost: string;
  effect: string;
  duration?: string;
  badge: string;
  icon: string;
  color: 'rose' | 'amber' | 'cyan' | 'yellow' | 'purple' | 'emerald';
  category: 'gift' | 'team';
  description: string;
}

const POWERS: PowerItem[] = [
  {
    id: 'rosa',
    name: 'Rosa',
    cost: '1 💎',
    effect: '+0.3 Empuje Directo',
    badge: 'Rápido',
    icon: '🌹',
    color: 'rose',
    category: 'gift',
    description: 'Empuje instantáneo competitivo sin enfriamiento. ¡Requiere ráfagas!',
  },
  {
    id: 'escudo',
    name: 'Escudo',
    cost: '2 - 4 💎',
    effect: '+2.5 Súper Empuje',
    badge: 'Impacto',
    icon: '🛡️',
    color: 'amber',
    category: 'gift',
    description: 'Empujón calibrado para remontadas reñidas sin romper la partida.',
  },
  {
    id: 'ralentizar',
    name: 'Hielo / Slow',
    cost: '5 - 9 💎',
    effect: '-50% Fuerza Rival',
    duration: '5 s',
    badge: 'Control',
    icon: '❄️',
    color: 'cyan',
    category: 'gift',
    description: 'Reduce la fuerza de los comentarios del rival a la mitad durante 5s.',
  },
  {
    id: 'doble',
    name: 'Doble Fuerza',
    cost: '10+ 💎',
    effect: 'Fuerza x2 (Doble)',
    duration: '8 s',
    badge: 'Poder Máx',
    icon: '⚡',
    color: 'yellow',
    category: 'gift',
    description: 'Duplica el empuje de todos los comentarios y likes de tu equipo por 8s.',
  },
  {
    id: 'caja',
    name: 'Caja Fuerte',
    cost: '35 comentarios',
    effect: '+6 Gran Empuje',
    badge: 'Evento',
    icon: '🔐',
    color: 'purple',
    category: 'team',
    description: 'Aparece en la ronda. Exige 35 comentarios coordinados para abrirla.',
  },
  {
    id: 'lluvia',
    name: 'Lluvia Regalos',
    cost: '5 Donadores',
    effect: '+1.8 Empuje Equipo',
    badge: 'Equipo',
    icon: '🌧️',
    color: 'emerald',
    category: 'team',
    description: '5 donantes distintos de tu equipo en menos de 10 segundos.',
  },
  {
    id: 'sync',
    name: 'Sincronía',
    cost: '10 Comentarios',
    effect: '+1.2 Empuje Extra',
    badge: 'Equipo',
    icon: '👥',
    color: 'emerald',
    category: 'team',
    description: '10 comentarios del mismo equipo coordinados en 3 segundos.',
  },
  {
    id: 'racha',
    name: 'Racha Rosa',
    cost: 'x10 a x100 Rosas',
    effect: 'Hasta +15 Bonos',
    badge: 'Combo',
    icon: '🔥',
    color: 'rose',
    category: 'gift',
    description: 'Bonos acumulativos equilibrados (+1, +2.5, +6, +15) por donar seguido.',
  },
];

export const PowersDisplay: React.FC<PowersDisplayProps> = ({ activeEffects, className = '' }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'gifts' | 'team'>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const now = Date.now();
  const rojoHasDouble = activeEffects ? activeEffects.rojoDoubleStrengthUntil > now : false;
  const azulHasDouble = activeEffects ? activeEffects.azulDoubleStrengthUntil > now : false;
  const rojoIsSlowed = activeEffects ? activeEffects.rojoSlowedUntil > now : false;
  const azulIsSlowed = activeEffects ? activeEffects.azulSlowedUntil > now : false;

  const rojoDoubleSec = activeEffects ? Math.max(0, Math.ceil((activeEffects.rojoDoubleStrengthUntil - now) / 1000)) : 0;
  const azulDoubleSec = activeEffects ? Math.max(0, Math.ceil((activeEffects.azulDoubleStrengthUntil - now) / 1000)) : 0;
  const rojoSlowSec = activeEffects ? Math.max(0, Math.ceil((activeEffects.rojoSlowedUntil - now) / 1000)) : 0;
  const azulSlowSec = activeEffects ? Math.max(0, Math.ceil((activeEffects.azulSlowedUntil - now) / 1000)) : 0;

  const hasAnyActivePower = rojoHasDouble || azulHasDouble || rojoIsSlowed || azulIsSlowed;

  const filteredPowers = POWERS.filter((p) => {
    if (activeTab === 'gifts') return p.category === 'gift';
    if (activeTab === 'team') return p.category === 'team';
    return true;
  });

  const getColorClasses = (color: PowerItem['color']) => {
    switch (color) {
      case 'rose':
        return {
          border: 'border-pink-500/30 hover:border-pink-500/60',
          bg: 'bg-pink-950/20',
          badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
          cost: 'text-pink-400 font-bold',
          highlight: 'text-pink-300',
        };
      case 'amber':
        return {
          border: 'border-amber-500/30 hover:border-amber-500/60',
          bg: 'bg-amber-950/20',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          cost: 'text-amber-400 font-bold',
          highlight: 'text-amber-300',
        };
      case 'cyan':
        return {
          border: 'border-cyan-500/30 hover:border-cyan-500/60',
          bg: 'bg-cyan-950/20',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          cost: 'text-cyan-400 font-bold',
          highlight: 'text-cyan-300',
        };
      case 'yellow':
        return {
          border: 'border-yellow-500/30 hover:border-yellow-500/60',
          bg: 'bg-yellow-950/20',
          badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          cost: 'text-yellow-400 font-bold',
          highlight: 'text-yellow-300',
        };
      case 'purple':
        return {
          border: 'border-purple-500/30 hover:border-purple-500/60',
          bg: 'bg-purple-950/20',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          cost: 'text-purple-400 font-bold',
          highlight: 'text-purple-300',
        };
      case 'emerald':
        return {
          border: 'border-emerald-500/30 hover:border-emerald-500/60',
          bg: 'bg-emerald-950/20',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          cost: 'text-emerald-400 font-bold',
          highlight: 'text-emerald-300',
        };
    }
  };

  return (
    <section
      aria-label="Poderes y Habilidades del Juego"
      className={`w-full bg-[#121218]/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Encabezado Principal */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-[#181524] via-[#151728] to-[#181524] border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-500 to-pink-500 text-white text-xs shadow-md">
            ⚡
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-white font-black text-xs sm:text-sm tracking-wider uppercase font-['Press_Start_2P']">
                PODERES Y REGALOS
              </h2>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/20 border border-pink-500/40 text-pink-300 font-bold">
                TIKTOK LIVE
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                🔥 COMPETITIVO
              </span>
            </div>
            <p className="text-[10px] text-neutral-300">
              Modo de alta dificultad: valores y puntos calibrados para mayor esfuerzo y rivalidad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tabs rápidas */}
          <div className="hidden sm:flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 text-[10px]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveTab('gifts')}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === 'gifts' ? 'bg-pink-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              💎 Regalos
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === 'team' ? 'bg-emerald-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              👥 Eventos
            </button>
          </div>

          {/* Botón de Plegar / Desplegar */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 rounded-lg bg-black/40 hover:bg-black/70 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Minimizar sección de poderes' : 'Expandir sección de poderes'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Barra de Estado de Poderes ACTIVOS en Vivo (si alguno está activo ahora mismo) */}
      {hasAnyActivePower && (
        <div className="px-3 py-1.5 bg-gradient-to-r from-red-950/40 via-purple-950/40 to-blue-950/40 border-b border-white/10 flex flex-wrap items-center gap-2 text-[10px]">
          <span className="font-bold text-neutral-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            ACTIVOS:
          </span>

          {rojoHasDouble && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 font-bold flex items-center gap-1 animate-pulse">
              ⚡ ROJO FUERZA x2 ({rojoDoubleSec}s)
            </span>
          )}
          {azulHasDouble && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 font-bold flex items-center gap-1 animate-pulse">
              ⚡ AZUL FUERZA x2 ({azulDoubleSec}s)
            </span>
          )}
          {rojoIsSlowed && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-bold flex items-center gap-1 animate-pulse">
              ❄️ ROJO RALENTIZADO ({rojoSlowSec}s)
            </span>
          )}
          {azulIsSlowed && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-bold flex items-center gap-1 animate-pulse">
              ❄️ AZUL RALENTIZADO ({azulSlowSec}s)
            </span>
          )}
        </div>
      )}

      {/* Contenido de Tarjetas de Poderes */}
      {isExpanded && (
        <div className="p-2.5 sm:p-3">
          {/* Grid de Poderes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {filteredPowers.map((power) => {
              const styles = getColorClasses(power.color);
              return (
                <div
                  key={power.id}
                  className={`relative flex flex-col justify-between p-2 rounded-xl border backdrop-blur-sm transition-all duration-200 ${styles.border} ${styles.bg} shadow-md group hover:scale-[1.02]`}
                >
                  {/* Fila superior: Icono, Nombre y Badge */}
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xl sm:text-2xl filter drop-shadow group-hover:scale-110 transition-transform">
                        {power.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-white font-extrabold text-[11px] sm:text-xs truncate">
                          {power.name}
                        </div>
                        <div className={`text-[10px] ${styles.cost}`}>
                          {power.cost}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${styles.badge}`}
                    >
                      {power.badge}
                    </span>
                  </div>

                  {/* Fila central: Efecto Principal Resaltado */}
                  <div className="bg-black/40 rounded-lg px-2 py-1 border border-white/5 my-1">
                    <div className={`text-[10px] sm:text-[11px] font-black ${styles.highlight} flex items-center justify-between`}>
                      <span>{power.effect}</span>
                      {power.duration && (
                        <span className="text-[9px] text-neutral-400 font-mono font-normal">
                          ⏳ {power.duration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fila inferior: Breve explicación para los viewers */}
                  <p className="text-[9px] sm:text-[9.5px] text-neutral-300/90 leading-tight mt-0.5 line-clamp-2">
                    {power.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Tips y Llamado a la Acción para TikTok Live */}
          <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-400 font-bold">💡 Tip:</span>
              <span>¡Los regalos acumulan diamantes personales y desbloquean insignias de rango!</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px] text-neutral-300">
              <span className="text-red-400 font-bold">!rojo</span>
              <span>o</span>
              <span className="text-blue-400 font-bold">!azul</span>
              <span className="text-neutral-500">|</span>
              <span className="text-yellow-400 font-bold">!cambio</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
