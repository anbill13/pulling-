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

  // --- SOGA Y FÍSICA ---
  ropeMax: 100,                 // Rango de la soga: de -100 a +100
  commentCooldown: 600,         // Enfriamiento de comentario por usuario (ms)
  commentPush: 1.0,             // Empuje base de un comentario (+1)
  likePush: 0.1,                // Empuje base por tap de like (0.1)
  maxLikeTaps: 100,             // Máximo de taps procesados por evento de like
  rubber: 0.25,                 // Ventaja automática del que va perdiendo (modo difícil: máx +25%)
  tensionSeconds: 20,           // Modo tensión en los últimos 20 s (empuje y puntos x2)
  seriesWin: 2,                 // Serie al mejor de 3 (2 victorias necesarias para ganar la serie)

  // --- EQUILIBRIO DE EQUIPOS ---
  maxDiff: 1,                   // Diferencia máxima de jugadores permitida entre equipos
  refActive: 10,                // Referencia de jugadores activos para el cálculo de escalado
  maxBoost: 3.0,                // Multiplicador máximo de fuerza por jugador activo

  // --- REGALOS Y PODERES (Sin azar, valores fijos) ---
  roseValue: 1,                 // Rosa 🌹 = 1 diamante (+1 empuje y punto directo, sin enfriamiento)
  firstTimeRoseAlertDurationMs: 1400,    // Duración alerta primera rosa (1.4 s, reducido 3s para máxima agilidad)
  firstTimeAbilityAlertDurationMs: 1500, // Duración alertas de primera vez (1.5 s, reducido 3s)
  shieldThresholdMin: 2,        // 2 a 4 diamantes = Escudo (+8 empuje)
  shieldThresholdMax: 4,
  shieldPush: 8.0,
  slowThresholdMin: 5,          // 5 a 9 diamantes = Ralentizar (rival empuja al 50 % por 5 s)
  slowThresholdMax: 9,
  slowFactor: 0.5,
  slowDuration: 5,
  doubleThresholdMin: 10,       // 10 o más diamantes = Doble fuerza (x2 por 8 s)
  doubleDuration: 8,

  // --- COMBOS PERSONALES ---
  comboTimeout: 8,              // Tiempo máximo entre regalos para mantener la racha personal (s)
  comboMilestones: [3, 5, 10, 25, 50, 100],
  comboBonuses: {
    10: 3.0,
    25: 8.0,
    50: 20.0,
    100: 50.0,
  } as Record<number, number>,

  // --- EVENTOS DE EQUIPO Y COMBOS ---
  giftRainCount: 5,             // 5 o más donantes distintos del mismo equipo
  giftRainWindow: 10,           // dentro de 10 s
  giftRainBoost: 5.0,           // +5 de empuje para su equipo
  giftRainCooldown: 20,         // 20 s de enfriamiento por equipo

  syncCommentCount: 10,         // 10 o más jugadores distintos comentan
  syncWindow: 3,                // dentro de 3 s
  syncBoost: 3.0,               // +3 de empuje para su equipo
  syncCooldown: 15,             // 15 s de enfriamiento por equipo

  comebackThreshold: 50,        // Remontada si estuvo 50+ puntos por debajo y empata/pasa a ganar

  // --- EVENTO SORPRESA: CAJA FUERTE ---
  safeMinSec: 30,               // Segundo mínimo de aparición dentro de la ronda
  safeMaxSec: 80,               // Segundo máximo de aparición
  safeDuration: 15,             // Duración de la Caja Fuerte (15 s)
  safeGoal: 25,                 // Comentarios necesarios para abrir la caja (25)
  safeReward: 20.0,             // Bono de empuje (+20)

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
    { name: 'Soldado', min: 10, icon: '🪖' },
    { name: 'Veterano', min: 30, icon: '🎖️' },
    { name: 'Líder', min: 60, icon: '👑' },
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
