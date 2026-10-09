export type Team = 'rojo' | 'azul';

export type GamePhase = 'lobby' | 'intro' | 'round' | 'ended';

export type BadgeType = 'none' | 'ally' | 'legend' | 'myth';

export interface Player {
  id: string; // username lowercase
  name: string; // display username (escaped before rendering)
  seqNumber: number; // 1, 2, 3...
  formattedNumber: string; // '#001', '#002'...
  team: Team;
  points: number; // points in the current round
  lifetimeDiamonds: number; // total accumulated diamonds (persistent)
  roundDiamonds: number; // diamonds gifted this round (resets each round)
  lastCommentTime: number; // timestamp in ms for comment cooldown
  hasChangedTeamThisRound: boolean;
  comboStreak: number;
  lastGiftTime: number;
  isRoseStreak: boolean;
  badge: BadgeType;
}

export interface ActiveEffects {
  rojoDoubleStrengthUntil: number; // timestamp in ms
  azulDoubleStrengthUntil: number;
  rojoSlowedUntil: number; // Slow applied to team Rojo
  azulSlowedUntil: number; // Slow applied to team Azul
}

export interface SafeBoxEvent {
  active: boolean;
  timeRemaining: number; // seconds remaining
  rojoCount: number;
  azulCount: number;
  winner: Team | null;
}

export interface RedLightState {
  state: 'green' | 'amber' | 'red';
  timeRemaining: number; // seconds
}

export interface CollectiveGoal {
  currentDiamonds: number;
  targetDiamonds: number;
}

export interface BigAnnouncement {
  id: string;
  type: 'gift' | 'combo' | 'giftRain' | 'sync' | 'comeback' | 'firstGift' | 'goldenRound' | 'safeWinner' | 'suddenDeath';
  title: string;
  subtitle: string;
  icon: string;
  team?: Team;
  userFormatted?: string;
  userName?: string;
  durationMs: number;
  createdAt: number;
}

export type RoundAchievementId =
  | 'first_comment_rojo'
  | 'first_comment_azul'
  | 'likes_streak_10'
  | 'likes_streak_25'
  | 'first_rose'
  | 'danger_save'
  | 'gift_streak_5'
  | 'epic_comeback';

export interface RoundAchievement {
  id: string;
  achievementId: RoundAchievementId;
  title: string;
  description: string;
  icon: string;
  team: Team;
  userName: string;
  userFormatted?: string;
  unlockedAt: number;
}

export interface MiniComboAlert {
  id: string;
  userName: string;
  userFormatted: string;
  team: Team;
  abilityName: string;
  icon: string;
  comboCount: number;
  bonusText?: string;
  createdAt: number;
}

export interface SideNotice {
  id: string;
  text: string;
  icon?: string;
  createdAt: number;
}

export interface ThankYouItem {
  id: string;
  userNumber: string;
  userName: string;
  team: Team;
  giftCount: number;
  diamonds: number;
  isFirstGift: boolean;
  acknowledged: boolean;
  lastGiftName: string;
  timestamp: number;
}

export interface TikTokIncomingEvent {
  type: 'comment' | 'like' | 'gift' | 'status';
  user?: string;
  text?: string;
  count?: number;
  value?: number;
  giftName?: string;
  connected?: boolean;
  username?: string | null;
  mode?: string;
}

export interface CustomGameAssets {
  fondoUrl?: string;
  sogaUrl?: string;
  bandanaUrl?: string;
  chicaUrl?: string;
  chicoUrl?: string;
  enabled: boolean;
  handHeightPercent: number; // default 50%
  characterScalePercent?: number; // default 100%
  chicaScalePercent?: number; // optional individual scale
  chicoScalePercent?: number; // optional individual scale
  chicaPositionPercent?: number; // default 10% (permite alejar o acercar el personaje a la meta)
  chicoPositionPercent?: number; // default 10%
  // Posición de la cuerda independiente (arriba y abajo)
  ropeHeightPercent?: number; // default 50% (rango 15% a 85%)
  ropeOffsetYPx?: number; // micro-ajuste en píxeles (-60px a +60px)
  // Posición vertical independiente de los personajes (arriba y abajo)
  characterHeightPercent?: number; // default 50% (rango 15% a 85%)
  chicaHeightPercent?: number; // opcional individual para Chica
  chicoHeightPercent?: number; // opcional individual para Chico
  // Altura vertical de los semáforos (arriba y abajo)
  semaphoreHeightPercent?: number; // default 32% (rango 5% a 90%)
  semaphoreLeftHeightPercent?: number; // opcional individual para semáforo izquierdo
  semaphoreRightHeightPercent?: number; // opcional individual para semáforo derecho
  // Líneas de meta independientes y visibilidad
  metaRojoPercent?: number; // default 34% (rango 15% a 48%)
  metaAzulPercent?: number; // default 66% (rango 52% a 85%)
  showMetaLines?: boolean; // default true (permite ocultar las líneas de metas para ambos equipos)
  // Dificultad competitiva y escala de puntos
  difficultyMode?: 'normal' | 'hard' | 'extreme'; // 'hard' reduce puntos y empuje para mayor esfuerzo
  pointScaleMultiplier?: number; // Multiplicador de puntos y empujes (ej. 0.35 para modo competitivo)
  // Tamaño y forma de la cuerda (permite encoger o alargar la soga)
  ropeWidthPercent?: number; // default 160% (rango 20% a 200%, permite encogerla más)
  ropeThicknessPx?: number; // default 14px (grosor de 2px a 36px)
  // Posición y tamaño de la bandana (permite subir y bajar la bandana)
  bandanaScalePercent?: number; // default 85%
  bandanaOffsetYPx?: number; // desplazamiento vertical en píxeles (-120px a +120px para subir o bajar)
  bandanaHeightPercent?: number; // altura independiente de la bandana (opcional 10% a 90%)
  // Elementos Estáticos
  pilaresUrl?: string; // Capa 1.5: Pilares / Bases donde se paran los personajes
  // Imagen de Referencia & Overlay
  referenceImageUrl?: string;
  referenceOpacity?: number; // 0 a 100, default 50%
  referenceVisible?: boolean; // Si el overlay está activo en la arena
  // Sprite sequence & folder configuration
  chicaMode?: 'frames' | 'sheet' | 'custom_folder';
  chicoMode?: 'frames' | 'sheet' | 'custom_folder';
  chicaCustomFrames?: string[];
  chicoCustomFrames?: string[];
  chicaFps?: number; // default 18
  chicoFps?: number; // default 18
  useOfficialSheetChica?: boolean;
  useOfficialSheetChico?: boolean;
  // Música de fondo personalizada (MP3 / WAV / OGG)
  customBgmUrl?: string;
}

export interface StorageAdapter {
  getLifetimeDiamonds(username: string): number;
  saveLifetimeDiamonds(username: string, diamonds: number): void;
  getSeriesWins(): { rojo: number; azul: number };
  saveSeriesWins(wins: { rojo: number; azul: number }): void;
  getCustomAssets?(): CustomGameAssets;
  saveCustomAssets?(assets: CustomGameAssets): void;
}
