import { RoundAchievement, RoundAchievementId, Team } from '../types';

export interface AchievementMeta {
  id: RoundAchievementId;
  title: string;
  description: string;
  icon: string;
  category: 'comment' | 'like' | 'gift' | 'tactical';
}

export const ROUND_ACHIEVEMENTS_CATALOG: Record<RoundAchievementId, AchievementMeta> = {
  first_comment_rojo: {
    id: 'first_comment_rojo',
    title: 'Primer Golpe Rojo',
    description: 'Primer comentario de la ronda para el equipo Rojo',
    icon: '🎯',
    category: 'comment',
  },
  first_comment_azul: {
    id: 'first_comment_azul',
    title: 'Primer Golpe Azul',
    description: 'Primer comentario de la ronda para el equipo Azul',
    icon: '⚡',
    category: 'comment',
  },
  likes_streak_10: {
    id: 'likes_streak_10',
    title: 'Racha de 10 Likes',
    description: '10 toques de pantalla acumulados por un jugador',
    icon: '❤️',
    category: 'like',
  },
  likes_streak_25: {
    id: 'likes_streak_25',
    title: 'Tormenta de 25 Likes',
    description: '25 likes frenéticos impulsando a su equipo',
    icon: '🔥',
    category: 'like',
  },
  first_rose: {
    id: 'first_rose',
    title: 'Primera Rosa',
    description: 'Donó la primera Rosa de la ronda',
    icon: '🌹',
    category: 'gift',
  },
  danger_save: {
    id: 'danger_save',
    title: 'Defensa Heroica',
    description: 'Donó o activó poder cuando su equipo perdía por más del 50%',
    icon: '🛡️',
    category: 'tactical',
  },
  gift_streak_5: {
    id: 'gift_streak_5',
    title: 'Racha de 5 Regalos',
    description: '5 regalos consecutivos manteniendo la racha activa',
    icon: '💎',
    category: 'gift',
  },
  epic_comeback: {
    id: 'epic_comeback',
    title: 'Remontada Épica',
    description: 'El equipo dio vuelta al marcador tras estar en desventaja',
    icon: '🏆',
    category: 'tactical',
  },
};
