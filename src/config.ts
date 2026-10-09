/**
 * Objeto CONFIG central con todos los números de balance, tiempos,
 * umbrales, valores de regalos e intervalos del juego.
 */
export const CONFIG = {
  // --- TIEMPOS Y FASES (segundos) ---
  lobbyAutoStartWait: 10,       // Sala de espera inicia tras 10 s con >=1 jugador por equipo
  introDuration: 3,             // Intro de ronda con cuenta regresiva 3..2..1 ¡YA! (3 s)
  roundDuration: 120,           // Duración normal de la ronda (120 s)
  endedDuration: 9,             // Final con marcador y celebración (9 s)
  nextRoundDelay: 3,            // Pausa previa a la intro de la siguiente ronda (3 s)
  platformFallDuration: 1.4,    // Duración de la caída de la plataforma perdedora (1.4 s)

  // --- SOGA Y FÍSICA (CALIBRACIÓN MODO COMPETITIVO DIFÍCIL - MENOS PUNTOS Y EMPUJE) ---
  ropeMax: 100,                 // Rango de la soga: de -100 a +100
  commentCooldown: 600,         // Enfriamiento de comentario por usuario (ms)
  commentPush: 0.20,            // Empuje base de un comentario (+0.20, muy competitivo, exige gran esfuerzo grupal)
  likePush: 0.01,               // Empuje base por tap de like (+0.01, 100 likes = 1.0 empuje)
  maxLikeTaps: 100,             // Máximo de taps procesados por evento de like
  rubber: 0.15,                 // Ventaja automática del que va perdiendo (modo difícil: máx +15%)
  tensionSeconds: 20,           // Modo tensión en los últimos 20 s (empuje y puntos x2)
  seriesWin: 2,                 // Serie al mejor de 3 (2 victorias necesarias para ganar la serie)
  competitivePointMultiplier: 0.05, // Escala de puntos competitiva: 0.05 pts por comentario
  difficultyScales: {
    normal: 0.010,              // Modo Estándar: 0.010
    hard: 0.05,                 // Modo Competitivo: 0.05
    extreme: 0.02,              // Modo Titán: 0.02
  },

  // --- EQUILIBRIO DE EQUIPOS ---
  maxDiff: 1,                   // Diferencia máxima de jugadores permitida entre equipos
  refActive: 10,                // Referencia de jugadores activos para el cálculo de escalado
  maxBoost: 2.0,                // Multiplicador máximo de fuerza por jugador activo

  // --- REGALOS Y PODERES (Sin azar, valores fijos competitivos) ---
  roseValue: 1,                 // Rosa 🌹 = 1 diamante (+0.25 empuje directo, sin enfriamiento)
  rosePush: 0.25,               // Empuje directo de la Rosa
  firstTimeRoseAlertDurationMs: 1400,    // Duración alerta primera rosa (1.4 s)
  firstTimeAbilityAlertDurationMs: 1500, // Duración alertas de primera vez (1.5 s)
  shieldThresholdMin: 2,        // 2 a 4 diamantes = Escudo (+1.8 empuje)
  shieldThresholdMax: 4,
  shieldPush: 1.8,              // Reducido a 1.8 para que ganar requiera esfuerzo constante
  slowThresholdMin: 5,          // 5 a 9 diamantes = Ralentizar (rival empuja al 50 % por 5 s)
  slowThresholdMax: 9,
  slowFactor: 0.5,
  slowDuration: 5,
  doubleThresholdMin: 10,       // 10 o más diamantes = Doble fuerza (x2 por 6 s)
  doubleDuration: 6,

  // --- COMBOS PERSONALES (Valores reducidos para juego competitivo) ---
  comboTimeout: 8,              // Tiempo máximo entre regalos para mantener la racha personal (s)
  comboMilestones: [3, 5, 10, 25, 50, 100],
  comboBonuses: {
    10: 1.0,                    // Reducido de 3.0
    25: 2.5,                    // Reducido de 8.0
    50: 6.0,                    // Reducido de 20.0
    100: 15.0,                  // Reducido de 50.0
  } as Record<number, number>,

  // --- EVENTOS DE EQUIPO Y COMBOS (Requieren trabajo en equipo) ---
  giftRainCount: 5,             // 5 o más donantes distintos del mismo equipo
  giftRainWindow: 10,           // dentro de 10 s
  giftRainBoost: 1.8,           // Reducido de 5.0 a 1.8
  giftRainCooldown: 20,         // 20 s de enfriamiento por equipo

  syncCommentCount: 10,         // 10 o más jugadores distintos comentan
  syncWindow: 3,                // dentro de 3 s
  syncBoost: 1.2,               // Reducido de 3.0 a 1.2
  syncCooldown: 15,             // 15 s de enfriamiento por equipo

  comebackThreshold: 50,        // Remontada si estuvo 50+ puntos por debajo y empata/pasa a ganar

  // --- EVENTO SORPRESA: CAJA FUERTE (Mayor dificultad) ---
  safeMinSec: 30,               // Segundo mínimo de aparición dentro de la ronda
  safeMaxSec: 80,               // Segundo máximo de aparición
  safeDuration: 15,             // Duración de la Caja Fuerte (15 s)
  safeGoal: 35,                 // Aumentado a 35 comentarios para requerir más esfuerzo grupal
  safeReward: 6.0,              // Reducido de 20.0 a 6.0 empuje competitivo

  // --- LUZ ROJA, LUZ VERDE ---
  redLightEnabled: true,        // Activada por defecto
  redLightMinInterval: 25,      // Intervalo aleatorio mínimo entre luces rojas (s)
  redLightMaxInterval: 40,      // Intervalo aleatorio máximo (s)
  redLightWarningDuration: 1.5, // Aviso ámbar ("¡CUIDADO!") previo (1.5 s)
  redLightDuration: 4.0,        // Duración de la luz roja (4 s)
  redLightPenalty: 1,           // Puntos restados por comentar en luz roja (sin bajar de 0)

  // --- DONACIONES, INSIGNIAS Y META COLECTIVA ---
  badgeAlly: 10,                // 10 diamantes = 🎖️ Aliado
  badgeLegend: 50,              // 50 diamantes = 🏅 Leyenda
  badgeMyth: 200,               // 200 diamantes = 💎 Mito
  collectiveGoalInitial: 50,    // Meta colectiva inicial de diamantes
  collectiveGoalStep: 25,       // Incremento tras cumplir cada meta (+25)
  goldenRoundDuration: 30,      // Duración de la Ronda de Oro (30 s con puntos dobles)

  // --- RANGOS POR PUNTOS DE LA RONDA ---
  ranks: [
    { name: 'Novato', min: 0, icon: '🌱' },
    { name: 'Soldado', min: 1, icon: '🪖' },
    { name: 'Veterano', min: 3, icon: '🎖️' },
    { name: 'Líder', min: 6, icon: '👑' },
  ],

  // --- AUDIO Y MÚSICA ADAPTATIVA ---
  bpmLobby: 60,                 // 60 BPM para sala de espera
  bpmRound: 100,                // 100 BPM base para ronda normal
  bpmTension: 130,              // 130 BPM para modo tensión (últimos 20 s)
  masterVolume: 0.5,            // Volumen maestro (0 a 1)
  duckAmount: 0.4,              // Reducción de la música en avisos (40 %)
  duckTime: 1000,               // Duración del ducking (ms)
  musicEnabled: true,           // Habilitar música de fondo procedural
  sfxEnabled: true,             // Habilitar efectos y stingers procedurales

  // --- PALETA Y ESTILOS ---
  colors: {
    bg: '#0a0a0c',
    cards: '#16161c',
    text: '#ffffff',
    textSec: '#9aa0ad',
    accentPink: '#ff2d87',
    teamRojo: '#ff3b3b',
    teamAzul: '#3da5ff',
    gold: '#ffd24a',
    amber: '#ffb020',
    redLight: '#ff2a2a',
    greenLight: '#4dff88',
  },
};
