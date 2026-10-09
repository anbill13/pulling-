/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Team, GamePhase, TikTokIncomingEvent, Player, RedLightState, SafeBoxEvent } from './types';

export type BotPlayStyle = 'rusher' | 'gifter' | 'tapper' | 'supporter' | 'clumsy' | 'whale';

export type BotThemeId = 'gaming' | 'futbol' | 'anime' | 'musica' | 'streamers';

export interface BotThemeInfo {
  id: BotThemeId;
  name: string;
  icon: string;
  description: string;
  rojoTeamName: string;
  azulTeamName: string;
}

export interface BotProfile {
  username: string;
  displayName: string;
  preferredTeam: Team;
  playStyle: BotPlayStyle;
  theme: BotThemeId;
}

export const BOT_THEMES: BotThemeInfo[] = [
  {
    id: 'gaming',
    name: 'Gaming & Retro',
    icon: '🎮',
    description: 'Gamers competitivos, píxeles, streamers y tryhards de eSports',
    rojoTeamName: 'Dragones Rojos',
    azulTeamName: 'Halcones Azules',
  },
  {
    id: 'futbol',
    name: 'Clásico de Fútbol',
    icon: '⚽',
    description: 'Hinchas apasionados, cánticos de estadio y rivalidad de clásico latinoamericano',
    rojoTeamName: 'Hinchada Roja',
    azulTeamName: 'La Banda Azul',
  },
  {
    id: 'anime',
    name: 'Anime & Otaku',
    icon: '🎌',
    description: 'Fanáticos de shonen, héroes, poderes, waifus y técnicas legendarias',
    rojoTeamName: 'Fuego Ninja 🔥',
    azulTeamName: 'Hielo Senshi ❄️',
  },
  {
    id: 'musica',
    name: 'Urbano & Pop',
    icon: '🎵',
    description: 'Fans de reggaetón, trap latino, pop y batallas de freestyle',
    rojoTeamName: 'Team Bellakeo 🔥',
    azulTeamName: 'Flow Galáctico ⚡',
  },
  {
    id: 'streamers',
    name: 'Creadores & TikTokers',
    icon: '📱',
    description: 'Espectadores adictos a TikTok Live, clips virales y donadores estrellas',
    rojoTeamName: 'Team Viral 🚀',
    azulTeamName: 'Squad Verificado ⭐',
  },
];

// --- PERFILES POR TEMA ---

// 1. TEMA GAMING & RETRO
export const THEME_BOTS_GAMING: { rojo: BotProfile[]; azul: BotProfile[] } = {
  rojo: [
    { username: 'Sofi_Gamez', displayName: 'Sofi 🎮', preferredTeam: 'rojo', playStyle: 'rusher', theme: 'gaming' },
    { username: 'PixelHero_99', displayName: 'Pixel Hero', preferredTeam: 'rojo', playStyle: 'rusher', theme: 'gaming' },
    { username: 'Matias_Pro99', displayName: 'Matias Pro', preferredTeam: 'rojo', playStyle: 'tapper', theme: 'gaming' },
    { username: 'RubyGamer', displayName: 'Ruby ❤️', preferredTeam: 'rojo', playStyle: 'gifter', theme: 'gaming' },
    { username: 'CyberLobo', displayName: 'CyberLobo', preferredTeam: 'rojo', playStyle: 'supporter', theme: 'gaming' },
    { username: 'FuegoRetro', displayName: 'Fuego Retro 🔥', preferredTeam: 'rojo', playStyle: 'rusher', theme: 'gaming' },
    { username: 'Dani_Fuego', displayName: 'Dani 💥', preferredTeam: 'rojo', playStyle: 'gifter', theme: 'gaming' },
    { username: 'Nacho_Pixel', displayName: 'Nacho 👾', preferredTeam: 'rojo', playStyle: 'tapper', theme: 'gaming' },
    { username: 'Lucas_Stream', displayName: 'Lucas Live', preferredTeam: 'rojo', playStyle: 'whale', theme: 'gaming' },
    { username: 'Valiente_R', displayName: 'Valiente R', preferredTeam: 'rojo', playStyle: 'clumsy', theme: 'gaming' },
  ],
  azul: [
    { username: 'AquaKnight', displayName: 'Aqua Knight 🛡️', preferredTeam: 'azul', playStyle: 'rusher', theme: 'gaming' },
    { username: 'BlueFalcon', displayName: 'Blue Falcon', preferredTeam: 'azul', playStyle: 'whale', theme: 'gaming' },
    { username: 'Laura_Gamer', displayName: 'Lau 🌸', preferredTeam: 'azul', playStyle: 'rusher', theme: 'gaming' },
    { username: 'Glaciar_X', displayName: 'Glaciar X ❄️', preferredTeam: 'azul', playStyle: 'tapper', theme: 'gaming' },
    { username: 'ZafiroPro', displayName: 'Zafiro 💎', preferredTeam: 'azul', playStyle: 'gifter', theme: 'gaming' },
    { username: 'LaserBoy', displayName: 'Laser Boy ⚡', preferredTeam: 'azul', playStyle: 'supporter', theme: 'gaming' },
    { username: 'Thiago_Kng', displayName: 'Thiago 👑', preferredTeam: 'azul', playStyle: 'tapper', theme: 'gaming' },
    { username: 'OndaAzul', displayName: 'Onda Azul 🌊', preferredTeam: 'azul', playStyle: 'rusher', theme: 'gaming' },
    { username: 'Emma_Spark', displayName: 'Emma ✨', preferredTeam: 'azul', playStyle: 'gifter', theme: 'gaming' },
    { username: 'Pato_Live', displayName: 'Pato 🦆', preferredTeam: 'azul', playStyle: 'clumsy', theme: 'gaming' },
  ],
};

// 2. TEMA FÚTBOL & CLÁSICO
export const THEME_BOTS_FUTBOL: { rojo: BotProfile[]; azul: BotProfile[] } = {
  rojo: [
    { username: 'El_Bicho_CR7', displayName: 'CR7 Fan ⚽', preferredTeam: 'rojo', playStyle: 'whale', theme: 'futbol' },
    { username: 'Dieguito_10', displayName: 'Dieguito D10S', preferredTeam: 'rojo', playStyle: 'rusher', theme: 'futbol' },
    { username: 'Goleador_Rojo', displayName: '9 de Área ⚽', preferredTeam: 'rojo', playStyle: 'tapper', theme: 'futbol' },
    { username: 'LaDoce_Hincha', displayName: 'Hincha Fiel ❤️', preferredTeam: 'rojo', playStyle: 'supporter', theme: 'futbol' },
    { username: 'Munich_Fan', displayName: 'Fan Bávaro', preferredTeam: 'rojo', playStyle: 'gifter', theme: 'futbol' },
    { username: 'Pupi_Lateral', displayName: 'El Tractor 🚜', preferredTeam: 'rojo', playStyle: 'tapper', theme: 'futbol' },
    { username: 'Capitan_Furia', displayName: 'Capitán Furia', preferredTeam: 'rojo', playStyle: 'rusher', theme: 'futbol' },
    { username: 'Torcedor_Rubro', displayName: 'Torcedor Fla 🔥', preferredTeam: 'rojo', playStyle: 'whale', theme: 'futbol' },
    { username: 'Gambeta_Pro', displayName: 'Gambeta Puro', preferredTeam: 'rojo', playStyle: 'supporter', theme: 'futbol' },
    { username: 'Arbitro_Ciego', displayName: 'El Juez 🦓', preferredTeam: 'rojo', playStyle: 'clumsy', theme: 'futbol' },
  ],
  azul: [
    { username: 'Messi_Magic10', displayName: 'La Pulga 🐐', preferredTeam: 'azul', playStyle: 'whale', theme: 'futbol' },
    { username: 'Celeste_Pasion', displayName: 'La Celeste 🇺🇾', preferredTeam: 'azul', playStyle: 'rusher', theme: 'futbol' },
    { username: 'Cholo_Garra', displayName: 'Garra Pura ⚡', preferredTeam: 'azul', playStyle: 'supporter', theme: 'futbol' },
    { username: 'Zidane_Ruleta', displayName: 'El Mago 🎩', preferredTeam: 'azul', playStyle: 'gifter', theme: 'futbol' },
    { username: 'Muralla_Azul', displayName: 'El Arquero 🧤', preferredTeam: 'azul', playStyle: 'tapper', theme: 'futbol' },
    { username: 'CruzAzul_Fiel', displayName: 'La Máquina 🚂', preferredTeam: 'azul', playStyle: 'rusher', theme: 'futbol' },
    { username: 'Bellingham_Fan', displayName: 'Hey Jude ⭐', preferredTeam: 'azul', playStyle: 'gifter', theme: 'futbol' },
    { username: 'Halcon_Aereo', displayName: 'Cabezazo 9', preferredTeam: 'azul', playStyle: 'tapper', theme: 'futbol' },
    { username: 'Piri_Defensa', displayName: 'Zaguero Firme', preferredTeam: 'azul', playStyle: 'supporter', theme: 'futbol' },
    { username: 'Tiragol_Offside', displayName: 'En Offside 🚩', preferredTeam: 'azul', playStyle: 'clumsy', theme: 'futbol' },
  ],
};

// 3. TEMA ANIME & OTAKU
export const THEME_BOTS_ANIME: { rojo: BotProfile[]; azul: BotProfile[] } = {
  rojo: [
    { username: 'Goku_Ultra', displayName: 'Goku UI 🐉', preferredTeam: 'rojo', playStyle: 'whale', theme: 'anime' },
    { username: 'Rengoku_Flame', displayName: 'Pilar Llama 🔥', preferredTeam: 'rojo', playStyle: 'rusher', theme: 'anime' },
    { username: 'Luffy_Gear5', displayName: 'Nika JoyBoy ☀️', preferredTeam: 'rojo', playStyle: 'rusher', theme: 'anime' },
    { username: 'Naruto_Kyuubi', displayName: 'Hokage Naranja', preferredTeam: 'rojo', playStyle: 'tapper', theme: 'anime' },
    { username: 'Mikasa_Titan', displayName: 'Mikasa Ackerman', preferredTeam: 'rojo', playStyle: 'gifter', theme: 'anime' },
    { username: 'Tanjiro_Sun', displayName: 'Tanjiro Danza', preferredTeam: 'rojo', playStyle: 'supporter', theme: 'anime' },
    { username: 'Asuka_Eva02', displayName: 'Asuka Langley 🌹', preferredTeam: 'rojo', playStyle: 'tapper', theme: 'anime' },
    { username: 'Bakugo_Boom', displayName: 'Kacchan 💥', preferredTeam: 'rojo', playStyle: 'whale', theme: 'anime' },
    { username: 'Itachi_Tsuku', displayName: 'Itachi Uchiha 👁️', preferredTeam: 'rojo', playStyle: 'gifter', theme: 'anime' },
    { username: 'Yamcha_Suelo', displayName: 'Yamcha XD 💀', preferredTeam: 'rojo', playStyle: 'clumsy', theme: 'anime' },
  ],
  azul: [
    { username: 'Gojo_Satoru', displayName: 'Satoru Gojo ♾️', preferredTeam: 'azul', playStyle: 'whale', theme: 'anime' },
    { username: 'Vegeta_Blue', displayName: 'Príncipe Saiyajin', preferredTeam: 'azul', playStyle: 'rusher', theme: 'anime' },
    { username: 'Zoro_Lost', displayName: 'Santoryu Zoro ⚔️', preferredTeam: 'azul', playStyle: 'rusher', theme: 'anime' },
    { username: 'Sasuke_Chidori', displayName: 'Sasuke Uchiha ⚡', preferredTeam: 'azul', playStyle: 'supporter', theme: 'anime' },
    { username: 'Rem_Waifu', displayName: 'Rem Best Waifu 💙', preferredTeam: 'azul', playStyle: 'gifter', theme: 'anime' },
    { username: 'Killua_God', displayName: 'Killua Zoldyck ⚡', preferredTeam: 'azul', playStyle: 'tapper', theme: 'anime' },
    { username: 'Todoroki_Ice', displayName: 'Shoto Glaciar ❄️', preferredTeam: 'azul', playStyle: 'tapper', theme: 'anime' },
    { username: 'Levi_Captain', displayName: 'Capitán Levi 🌪️', preferredTeam: 'azul', playStyle: 'whale', theme: 'anime' },
    { username: 'Megumi_Shadow', displayName: 'Megumi Fushiguro', preferredTeam: 'azul', playStyle: 'gifter', theme: 'anime' },
    { username: 'Usopp_Mentira', displayName: 'Dios Usopp 🤥', preferredTeam: 'azul', playStyle: 'clumsy', theme: 'anime' },
  ],
};

// 4. TEMA MÚSICA & URBANO
export const THEME_BOTS_MUSICA: { rojo: BotProfile[]; azul: BotProfile[] } = {
  rojo: [
    { username: 'BadBunny_Fan', displayName: 'Benito Fan 🐰', preferredTeam: 'rojo', playStyle: 'whale', theme: 'musica' },
    { username: 'Rosalia_Motomami', displayName: 'Motomami 🏍️', preferredTeam: 'rojo', playStyle: 'rusher', theme: 'musica' },
    { username: 'Feid_Ferxxo', displayName: 'Mor 💚', preferredTeam: 'rojo', playStyle: 'rusher', theme: 'musica' },
    { username: 'Duki_SSJ', displayName: 'Duki Goteo 🦇', preferredTeam: 'rojo', playStyle: 'tapper', theme: 'musica' },
    { username: 'KarolG_Bichota', displayName: 'La Bichota 🌺', preferredTeam: 'rojo', playStyle: 'gifter', theme: 'musica' },
    { username: 'Anuel_RealHL', displayName: 'Brrr Real 👹', preferredTeam: 'rojo', playStyle: 'supporter', theme: 'musica' },
    { username: 'Bizarrap_Beat', displayName: 'BZRP Session 🎧', preferredTeam: 'rojo', playStyle: 'tapper', theme: 'musica' },
    { username: 'Daddy_Legend', displayName: 'The Big Boss 👑', preferredTeam: 'rojo', playStyle: 'whale', theme: 'musica' },
    { username: 'Trueno_Freestyle', displayName: 'Trueno FMS ⚡', preferredTeam: 'rojo', playStyle: 'gifter', theme: 'musica' },
    { username: 'Autotune_Fail', displayName: 'Desafinado 🎤', preferredTeam: 'rojo', playStyle: 'clumsy', theme: 'musica' },
  ],
  azul: [
    { username: 'Rauw_Saturno', displayName: 'Rauw Alejandro 🛸', preferredTeam: 'azul', playStyle: 'whale', theme: 'musica' },
    { username: 'Quevedo_Quedate', displayName: 'Quevedo LP 🏝️', preferredTeam: 'azul', playStyle: 'rusher', theme: 'musica' },
    { username: 'Shakira_Loba', displayName: 'Shakira Shakira 🐺', preferredTeam: 'azul', playStyle: 'rusher', theme: 'musica' },
    { username: 'Milo_J_Flow', displayName: 'Milo J 1 1 1 ✨', preferredTeam: 'azul', playStyle: 'tapper', theme: 'musica' },
    { username: 'Myke_Towers', displayName: 'Easy Money Baby 💎', preferredTeam: 'azul', playStyle: 'gifter', theme: 'musica' },
    { username: 'Wos_Canguro', displayName: 'Wosito Rap 🦘', preferredTeam: 'azul', playStyle: 'supporter', theme: 'musica' },
    { username: 'Tini_TripleT', displayName: 'La Triple T 💖', preferredTeam: 'azul', playStyle: 'tapper', theme: 'musica' },
    { username: 'Eladio_Carrion', displayName: 'Sauce Boyz 🥫', preferredTeam: 'azul', playStyle: 'whale', theme: 'musica' },
    { username: 'Nicki_Nicole', displayName: 'Nicki Alma 💎', preferredTeam: 'azul', playStyle: 'gifter', theme: 'musica' },
    { username: 'Dj_Pifia', displayName: 'DJ Scratch 🔊', preferredTeam: 'azul', playStyle: 'clumsy', theme: 'musica' },
  ],
};

// 5. TEMA CREADORES & TIKTOKERS
export const THEME_BOTS_STREAMERS: { rojo: BotProfile[]; azul: BotProfile[] } = {
  rojo: [
    { username: 'Ibai_Gigante', displayName: 'Don Ibai 🎙️', preferredTeam: 'rojo', playStyle: 'whale', theme: 'streamers' },
    { username: 'Auron_Abduzcan', displayName: 'Auronplay 💣', preferredTeam: 'rojo', playStyle: 'rusher', theme: 'streamers' },
    { username: 'Rivers_LaPola', displayName: 'La Rivers 🥊', preferredTeam: 'rojo', playStyle: 'rusher', theme: 'streamers' },
    { username: 'ElXokas_Foco', displayName: 'El Xokas 🥩', preferredTeam: 'rojo', playStyle: 'tapper', theme: 'streamers' },
    { username: 'Spreen_Mate', displayName: 'SpreenDMC 🧉', preferredTeam: 'rojo', playStyle: 'gifter', theme: 'streamers' },
    { username: 'Westcol_Medallo', displayName: 'Westcol W 🚗', preferredTeam: 'rojo', playStyle: 'supporter', theme: 'streamers' },
    { username: 'Roier_Spider', displayName: 'Roier 🕷️', preferredTeam: 'rojo', playStyle: 'tapper', theme: 'streamers' },
    { username: 'Coscu_Picante', displayName: 'Coscu Army ⚡', preferredTeam: 'rojo', playStyle: 'whale', theme: 'streamers' },
    { username: 'AriGameplays', displayName: 'Ari ✨', preferredTeam: 'rojo', playStyle: 'gifter', theme: 'streamers' },
    { username: 'Clip_Lag', displayName: 'Pantalla Negra 🔌', preferredTeam: 'rojo', playStyle: 'clumsy', theme: 'streamers' },
  ],
  azul: [
    { username: 'Rubius_OMG', displayName: 'ElRubiusOMG 🐱', preferredTeam: 'azul', playStyle: 'whale', theme: 'streamers' },
    { username: 'IlloJuan_Andaluz', displayName: 'IlloJuan Mlg ☀️', preferredTeam: 'azul', playStyle: 'rusher', theme: 'streamers' },
    { username: 'TheGrefg_Contador', displayName: 'TheGrefg ⏱️', preferredTeam: 'azul', playStyle: 'rusher', theme: 'streamers' },
    { username: 'DjMaRiiO_Poste', displayName: 'DjMaRiiO ⚽', preferredTeam: 'azul', playStyle: 'tapper', theme: 'streamers' },
    { username: 'Mariana_Patron', displayName: 'El Mariana 🤠', preferredTeam: 'azul', playStyle: 'gifter', theme: 'streamers' },
    { username: 'Davoo_Xeneize', displayName: 'Davoo Xeneize 🎙️', preferredTeam: 'azul', playStyle: 'supporter', theme: 'streamers' },
    { username: 'JuanSGuarnizo', displayName: 'JuanCama 🛋️', preferredTeam: 'azul', playStyle: 'tapper', theme: 'streamers' },
    { username: 'Vegetta777_Pro', displayName: 'Vegetta777 💜', preferredTeam: 'azul', playStyle: 'whale', theme: 'streamers' },
    { username: 'Cry_Goth', displayName: 'CryBoy 🖤', preferredTeam: 'azul', playStyle: 'gifter', theme: 'streamers' },
    { username: 'Baneo_Express', displayName: 'Admin Ban 🔨', preferredTeam: 'azul', playStyle: 'clumsy', theme: 'streamers' },
  ],
};

export const THEME_BOT_MAP: Record<BotThemeId, { rojo: BotProfile[]; azul: BotProfile[] }> = {
  gaming: THEME_BOTS_GAMING,
  futbol: THEME_BOTS_FUTBOL,
  anime: THEME_BOTS_ANIME,
  musica: THEME_BOTS_MUSICA,
  streamers: THEME_BOTS_STREAMERS,
};

// Default backwards compatibility
export const ROJO_BOTS: BotProfile[] = THEME_BOTS_GAMING.rojo;
export const AZUL_BOTS: BotProfile[] = THEME_BOTS_GAMING.azul;
export const ALL_BOTS: BotProfile[] = [...ROJO_BOTS, ...AZUL_BOTS];

// Theme-specific cheers pools for deep realism in testing
export const THEME_CHEERS: Record<
  BotThemeId,
  {
    rojo: string[];
    azul: string[];
    lobby: string[];
    intro: string[];
    sync: { rojo: string; azul: string };
  }
> = {
  gaming: {
    rojo: [
      '¡¡VAMOOOS ROJO!! 🔥',
      '¡A halar con fuerza!',
      '¡Rojo al poder! 💪',
      '¡No se rindan muchachos!',
      '¡Halen, halen, halen!',
      '¡Fuerza equipo Rojo! 🔴',
      '¡Con todo equipo!',
      '¡¡Vamos que lo ganamos!!',
      '¡Apretad las manos!',
      '¡¡SIII ROJO!! ❤️',
      '¡DALE ROJO NO PARES!',
      '¡Todos juntos a la soga!',
    ],
    azul: [
      '¡¡VAMOOOS AZUL!! ⚡',
      '¡Halen firme carajo!',
      '¡Victoria Azul segura!',
      '¡Fuerza equipo Azul! 🔵',
      '¡Con todo muchachos!',
      '¡Azul hasta el final! 🛡️',
      '¡No aflojen ahora!',
      '¡¡DALE AZUL CON TODO!!',
      '¡A halar firme!',
      '¡¡AZUL CAMPEÓN!! 💙',
      '¡Firme la soga equipo!',
      '¡Azul no retrocede!',
    ],
    lobby: [
      '¡Hola a todos! 👋',
      '¡Llegué para apoyar! 🙌',
      '¿Quién gana hoy? 👀',
      '¡Vamos a jugar!',
      'Team Rojo de corazón ❤️',
      'Team Azul presente 💙',
      '¡GG listos para la batalla!',
    ],
    intro: [
      '¡Listos para la batalla! 🔥',
      '¡Esta ronda no se nos escapa!',
      '¡A darle con todo!',
      '¡Con concentración equipo!',
    ],
    sync: {
      rojo: '¡DRAGONES ROJOS UNIDOS! 🐉🔥',
      azul: '¡HALCONES AZULES FIRMES! 🦅⚡',
    },
  },
  futbol: {
    rojo: [
      '¡¡VAMOS ROJO DE MI VIDA!! 🔴⚪',
      '¡PONGAN HUEVOS QUE GANAMOS!',
      '¡A HALAR CON EL CORAZÓN!',
      '¡ESTA HINCHADA NO SE CALLA! 🔥',
      '¡¡DALE ROJO DALE ROJO!!',
      '¡A DEJAR TODO EN LA CANCHA!',
      '¡SI SEÑOR, DE ROJO HASTA EL FINAL!',
      '¡¡VAMOS ROJO CARAJO!! ⚽',
      '¡NO SE AFECTEN QUE SOMOS LOCALES!',
      '¡¡TODOS JUNTOS EMPUJEN!! 🚩',
    ],
    azul: [
      '¡¡VAMOS LA BANDA AZUL!! 💙⚪',
      '¡CON GARRA Y CORAZÓN AZULES!',
      '¡EL CLÁSICO ES NUESTRO!',
      '¡A MORDER EN LA SOGA! ⚡',
      '¡¡DALE AZUL DE MI ALMA!!',
      '¡FESTEJO AZUL ASEGURADO! 🏆',
      '¡A NO DARSE POR VENCIDOS!',
      '¡AZUL CAMPEÓN DE LA COPA! ⚽',
      '¡¡A HALAR CON AGUANTE!! 🔵',
      '¡LA GLORIA ES AZUL!',
    ],
    lobby: [
      '¡Llegó la barra brava! 🥁⚽',
      '¡Hoy ganamos el clásico sí o sí!',
      '¿Dónde están los hinchas del Rojo? 🔴',
      '¡La banda azul copando el chat! 💙',
      '¡Traigan alfajores que hay clásico!',
      '¡90 minutos a morir hoy!',
    ],
    intro: [
      '¡¡SALE EL EQUIPO AL CAMPO!! 🏟️',
      '¡Ronda decisiva, a dejar la piel!',
      '¡Con la camiseta bien puesta!',
      '¡A cantar todos juntos!',
    ],
    sync: {
      rojo: '¡¡HINCHADA ROJA AL FRENTE!! 🔴🥁',
      azul: '¡¡LA BANDA AZUL COPA TODO!! 💙🎺',
    },
  },
  anime: {
    rojo: [
      '¡¡IKUZO ROJO!! 🔥🐉',
      '¡¡BANZAI EQUIPO ROJO!!',
      '¡SET YOUR HEART ABLAZE! ❤️‍🔥',
      '¡KAMEHAMEHA EN LA SOGA!',
      '¡SHINZOU WO SASAGEYO! ✊',
      '¡¡EL GEAR 5 DESPIERTA!! ☀️',
      '¡RASENGAN DIRECTO!',
      '¡¡VAMOS ROJO PLUS ULTRA!! 💥',
      '¡EL FUEGO NUNCA SE APAGA!',
      '¡¡DATTEBAYO ROJO!! 🍥',
    ],
    azul: [
      '¡¡RYOIKI TENKAI AZUL!! ♾️⚡',
      '¡¡CHIDORI EN LA SOGA!!',
      '¡SANTORYU ONI GIRI! ⚔️',
      '¡HIELO ABSOLUTO SHOTO! ❄️',
      '¡BANKAI EQUIPO AZUL!',
      '¡EL ORGULLO SAIYAJIN AZUL!',
      '¡¡VAMOS AZUL INFINITO!! 💙',
      '¡SATORU GOJO NO CAE!',
      '¡¡ATAQUE RELÁMPAGO GODSPEED!!',
      '¡EL AZUL TIENE EL HAKI DEL REY!',
    ],
    lobby: [
      'Kon\'nichiwa mina-san! 🌸',
      '¡Otakus reunidos para el duelo! ⛩️',
      '¿Quién tiene más poder de pelea hoy? 🥋',
      '¡Vengo por mi waifu y por el Rojo! ❤️',
      '¡El Team Azul tiene Haki de Conquistador! ⚡',
      '¡Irasshaimase al directo!',
    ],
    intro: [
      '¡¡SUENA EL OPENING DE BATALLA!! 🎶',
      '¡Transformación máxima ahora!',
      '¡Este es mi camino ninja!',
      '¡Duelo a muerte en el Valle del Fin!',
    ],
    sync: {
      rojo: '¡¡FUEGO NINJA PLUS ULTRA!! 🔥💥',
      azul: '¡¡EXPANSIÓN DE DOMINIO AZUL!! ♾️⚡',
    },
  },
  musica: {
    rojo: [
      '¡¡CON TO\' EL FLOW ROJO!! 🔥🎤',
      '¡TRAVIS Y BENITO AL PODER! 🐰',
      '¡MOTOMAMI HALANDO DURO! 🏍️',
      '¡BRRRR REAL HASTA LA MUERTE!',
      '¡ROMPIENDO LA PISTA ROJO! 💿',
      '¡EL GOTEO NUNCA PARA! 🦇',
      '¡BICHOTA SEASON ROJO! 🌺',
      '¡SUBAN EL VOLUMEN AL ROJO! 🔊',
      '¡¡PURO BEAT DE FUEGO!!',
      '¡EL ROJO TIENE EL HIT DEL AÑO!',
    ],
    azul: [
      '¡¡FLOW GALÁCTICO AZUL!! 🛸⚡',
      '¡QUÉDATE QUE LAS NOCHES SIN TI! 🏝️',
      '¡UNA LOBA EN EL EQUIPO AZUL! 🐺',
      '¡BZRP SESSION AZUL VOLANDO! 🎧',
      '¡TRIPLE T CON TODO EL BRILLO! 💖',
      '¡EASY MONEY BABY AZUL! 💎',
      '¡SAUCE BOYZ HASTA EL FINAL! 🥫',
      '¡¡EL AZUL TIENE EL RITMO!! 🌊',
      '¡PURO PERREO PESADO AZUL!',
      '¡FREESTYLE CHAMPION AZUL! 🎤',
    ],
    lobby: [
      '¡Wena cabros, suban el beat! 🎧🎶',
      '¡Llegó la playlist más prendida del live!',
      '¿Quién rapea más duro hoy? 🎙️',
      '¡El Team Rojo anda belicón hoy! 🔥',
      '¡El Azul viene con el flow de Miami! 🌴',
      '¡Soltá el beat streamer!',
    ],
    intro: [
      '¡¡EN 3, 2, 1... TIEMPO!! ⏱️🎤',
      '¡Ronda musical al palo!',
      '¡Que suenen los bajos duros!',
      '¡A romper la pista equipo!',
    ],
    sync: {
      rojo: '¡¡BEAT DEMOLEDOR ROJO!! 🔊🔥',
      azul: '¡¡FLOW PLANETARIO AZUL!! 🛸💎',
    },
  },
  streamers: {
    rojo: [
      '¡¡VAMOS CHAT ROJO!! 🚀',
      '¡METAN CLIP DE ESTE TIRÓN!',
      '¡EL XOKAS NO AFLOJA! 🥩',
      '¡DONEN SUB AL EQUIPO ROJO! ⭐',
      '¡DON IBAI METE PRESIÓN! 🎙️',
      '¡¡SPAM DE CORAZONES ROJOS!! ❤️❤️❤️',
      '¡VAMOS MI GENTE BONITA!',
      '¡¡SE VA VIRAL EN TIKTOK!! 📱',
      '¡ES UN EVENTO CANÓNICO!',
      '¡EL STREAM MÁS PICANTE! 🌶️',
    ],
    azul: [
      '¡¡VAMOS TEAM VERIFICADO!! ⭐💙',
      '¡EL RUBIUS SACANDO GARRAS! 🐱',
      '¡GREFG CONTANDO SEGUNDOS! ⏱️',
      '¡SPAM DE CORAZONES AZULES! 💙💙💙',
      '¡ILLOJUAN DALE CON ARTE! ☀️',
      '¡ROMPAN EL BOTÓN DE LIKES!',
      '¡QUE LLUEVAN LAS ROSAS AL AZUL! 🌹',
      '¡EL CHAT AZUL ES EL MEJOR!',
      '¡CLIPEEN ESTA VICTORIA!',
      '¡TODO EL MUNDO AL TIKTOK LIVE! 📲',
    ],
    lobby: [
      '¡Buenas tardes chat! 👋',
      '¡Vine por el clip viral de TikTok! 🎬',
      '¿Dónde dejo mi follow? ✨',
      '¡Mod fijen el comentario del Rojo! 📌',
      '¡Team Azul presente en el para ti! 🤳',
      '¡Spam de emotes streamers!',
    ],
    intro: [
      '¡¡ESTAMOS EN VIVO Y EN DIRECTO!! 🔴',
      '¡Récord de viewers en esta ronda!',
      '¡No toquen la pantalla, concéntrense!',
      '¡A reventar el algoritmo!',
    ],
    sync: {
      rojo: '¡¡SPAM VIRAL ROJO EN EL LIVE!! 🚀🔥',
      azul: '¡¡TRENDING TOPIC AZUL!! 📱💙',
    },
  },
};

// Default fallback pools
const ROJO_CHEERS = THEME_CHEERS.gaming.rojo;
const AZUL_CHEERS = THEME_CHEERS.gaming.azul;

const ROJO_COMEBACK = [
  '¡¡NOOO REACCIONEN ROJO!! 🚨',
  '¡¡HALEN MÁS RÁPIDO!!',
  '¡¡NO NOS DEJEMOS CAER!!',
  '¡¡TODOS JUNTOS HALEN!!',
  '¡¡ROJO A RESISTIR!!',
  '¡¡METANLE FUERZA ROJO!!',
  '¡¡AYUDA EQUIPO HALEN!!',
];

const AZUL_COMEBACK = [
  '¡¡AZUL DESPIERTEN!! 🚨',
  '¡¡NO NOS VAMOS A CAER!!',
  '¡¡TODOS A LA SOGA!!',
  '¡¡HALEN CON EL ALMA!!',
  '¡¡VAMOS AZUL CARAJO!!',
  '¡¡A REMONTAR AZULES!!',
  '¡¡FUERZA AZUL NO AFLOJEN!!',
];

const ROJO_DOMINANCE = [
  '¡¡YA CASI LOS TENEMOS!! 🔥',
  '¡¡UN TIRÓN MÁS Y SE CAEN!!',
  '¡¡SE CAEN SE CAEN!! 😱',
  '¡¡NO PAREN DE HALAR!!',
  '¡¡VICTORIA ROJA CERCA!!',
];

const AZUL_DOMINANCE = [
  '¡¡YA CASI GANAMOS!! ⚡',
  '¡¡EL ÚLTIMO EMPUJE AZUL!!',
  '¡¡SE VAN AL PISO!! 😱',
  '¡¡FIRMES AZULES YA ES NUESTRO!!',
  '¡¡A LA VICTORIA AZUL!!',
];

const SAFE_BOX_CHEERS = [
  '¡¡LA CAJA FUERTE 🔐!!',
  '¡¡COMENTEN RÁPIDO 25 VECES!!',
  '¡¡ESE +20 ES NUESTRO!!',
  '¡¡CAJA CAJA CAJA!! 🔑',
  '¡¡COMENTEN TODOS A LA CAJA!!',
  '¡¡A ABRIR LA CAJA YA!!',
];

const AMBER_WARNINGS = [
  '¡¡CUIDADO LUZ ÁMBAR!! ⚠️',
  '¡¡PAREN DE ESCRIBIR!! ✋',
  '¡¡ALTO TODOS VIENE LA ROJA!!',
  '¡Cuidado con la muñeca! ⚠️',
];

const RED_LIGHT_SLIPS = [
  '¡Uy se me escapó el mensaje! 🚨',
  '¡Nooo toqué sin querer! 😭',
  '¡Perdón equipo me equivoqué! ❌',
];

const GREEN_LIGHT_CHEERS = [
  '¡¡VERDE VERDE VERDE!! 🟢',
  '¡¡AHORA SÍ HALEN CON TODO!!',
  '¡¡A RECUPERAR TERRENO!! 🔥',
  '¡¡DALE DALE DALE!!',
];

const GOLDEN_ROUND_CHEERS = [
  '¡¡RONDA DE ORO ACTIVADA!! 👑✨',
  '¡¡PUNTOS DOBLES APROVECHEN!!',
  '¡¡A MANDAR ROSAS!! 🌹',
  '¡¡TODO EL MUNDO A SUMAR!!',
];

const TENSION_CHEERS = [
  '¡¡ÚLTIMOS SEGUNDOS!! ⏱️',
  '¡¡A MUERTE HASTA EL FINAL!!',
  '¡¡HALEN SIN PARAR!! 🔥',
  '¡¡NO MIREN EL RELOJ DALE!!',
];

const LOBBY_GREETINGS = [
  '¡Hola a todos! 👋',
  '¡Llegué para apoyar! 🙌',
  '¿Quién gana hoy? 👀',
  '¡Vamos a jugar!',
  'Team Rojo de corazón ❤️',
  'Team Azul presente 💙',
];

const INTRO_CHEERS = [
  '¡Listos para la batalla! 🔥',
  '¡Esta ronda no se nos escapa!',
  '¡A darle con todo!',
  '¡Con concentración equipo!',
];

const ENDED_WINNER_CHEERS = [
  '¡¡BUENA RONDA EQUIPO!! 🏆',
  '¡Qué partidazo!',
  '¡GG a todos!',
  '¡Imparables hoy!',
  '¡Así se juega muchachos!',
];

const ENDED_LOSER_CHEERS = [
  '¡Estuvo cerca, bien jugado! 👏',
  '¡En la siguiente ronda nos desquitamos!',
  '¡GG muchachos!',
  '¡La revancha es nuestra, vamos!',
];

export type BotIntensity = 'calm' | 'normal' | 'intense';

export interface BotEngineState {
  phase: GamePhase;
  timeLeft: number;
  ropeV: number;
  players: Record<string, Player>;
  redLight: RedLightState;
  safeEvent: SafeBoxEvent | null;
}

/**
 * Controller for intelligent test bots that simulate real human viewers on TikTok Live.
 * Implements organic lobby joining, psychological momentum surges, authentic Spanish chat,
 * realistic tapping bursts, strategic gift usage, and full game lifecycle integration.
 */
export class TestBotSimulator {
  private onDispatchEvent: (event: TikTokIncomingEvent) => void;
  private intensity: BotIntensity = 'normal';
  private currentTheme: BotThemeId = 'gaming';
  private timerId: number | null = null;
  private activeTimeouts: number[] = [];

  // Psychological momentum engine
  private momentumTeam: Team = 'rojo';
  private momentumTicksLeft: number = 0;

  // Active combo burst state
  private comboBot: BotProfile | null = null;
  private comboRemaining: number = 0;

  // Flag to manage lobby spawning without spam
  private lobbySpawnIndex: number = 0;
  private lastLobbySpawnTime: number = 0;

  constructor(onDispatchEvent: (event: TikTokIncomingEvent) => void) {
    this.onDispatchEvent = onDispatchEvent;
  }

  public setIntensity(intensity: BotIntensity) {
    this.intensity = intensity;
  }

  public getIntensity(): BotIntensity {
    return this.intensity;
  }

  public setTheme(theme: BotThemeId) {
    this.currentTheme = theme;
  }

  public getTheme(): BotThemeId {
    return this.currentTheme;
  }

  public getThemeInfo(): BotThemeInfo {
    return BOT_THEMES.find((t) => t.id === this.currentTheme) || BOT_THEMES[0];
  }

  public getRoster(): { rojo: BotProfile[]; azul: BotProfile[] } {
    return THEME_BOT_MAP[this.currentTheme] || THEME_BOT_MAP.gaming;
  }

  public getAllBotsInCurrentTheme(): BotProfile[] {
    const roster = this.getRoster();
    return [...roster.rojo, ...roster.azul];
  }

  private registerTimeout(fn: () => void, delayMs: number): number {
    const tid = window.setTimeout(() => {
      this.activeTimeouts = this.activeTimeouts.filter((id) => id !== tid);
      fn();
    }, delayMs);
    this.activeTimeouts.push(tid);
    return tid;
  }

  private clearAllTimeouts() {
    this.activeTimeouts.forEach((tid) => window.clearTimeout(tid));
    this.activeTimeouts = [];
  }

  /**
   * Spawns bots of the currently selected theme sequentially in balanced pairs into the match
   */
  public spawnAllBots() {
    const roster = this.getRoster();
    const count = Math.min(roster.rojo.length, roster.azul.length);
    for (let i = 0; i < count; i++) {
      const rBot = roster.rojo[i];
      const aBot = roster.azul[i];

      // Spawn Rojo bot
      this.registerTimeout(() => {
        this.onDispatchEvent({
          type: 'comment',
          user: rBot.username,
          text: '!rojo',
        });
      }, i * 220);

      // Spawn Azul bot in exact symmetry
      this.registerTimeout(() => {
        this.onDispatchEvent({
          type: 'comment',
          user: aBot.username,
          text: '!azul',
        });
      }, i * 220 + 90);
    }
  }

  /**
   * Trigger an organic team surge where a team gets momentum and pulls hard
   */
  public triggerSurge(team: Team = 'rojo', durationTicks = 18) {
    this.momentumTeam = team;
    this.momentumTicksLeft = durationTicks;
  }

  /**
   * Trigger a coordinated 10-bot synchrony burst for a team with theme-authentic slogan
   */
  public triggerSynchrony(team: Team = 'rojo') {
    const roster = this.getRoster();
    const targetBots = team === 'rojo' ? roster.rojo : roster.azul;
    const themeCheer = THEME_CHEERS[this.currentTheme] || THEME_CHEERS.gaming;
    const slogan = team === 'rojo' ? themeCheer.sync.rojo : themeCheer.sync.azul;

    targetBots.slice(0, 10).forEach((b, idx) => {
      this.registerTimeout(() => {
        this.onDispatchEvent({
          type: 'comment',
          user: b.username,
          text: slogan,
        });
      }, idx * 70);
    });
  }

  /**
   * Trigger a rapid Rose combo (3x to 10x) from a designated bot
   */
  public triggerRoseCombo(team: Team = 'rojo', count = 7) {
    const roster = this.getRoster();
    const bot = team === 'rojo' ? roster.rojo[1] || roster.rojo[0] : roster.azul[1] || roster.azul[0];
    for (let i = 0; i < count; i++) {
      this.registerTimeout(() => {
        this.onDispatchEvent({
          type: 'gift',
          user: bot.username,
          giftName: 'Rosa',
          count: 1,
          value: 1,
        });
      }, i * 190);
    }
  }

  /**
   * Main step execution given current game state
   */
  public step(state: BotEngineState) {
    const { phase, players, redLight, safeEvent, timeLeft, ropeV } = state;
    const playerList = Object.values(players);
    const rojoPlayers = playerList.filter((p) => p.team === 'rojo');
    const azulPlayers = playerList.filter((p) => p.team === 'azul');
    const now = Date.now();
    const roster = this.getRoster();
    const allThemeBots = this.getAllBotsInCurrentTheme();
    const themeCheer = THEME_CHEERS[this.currentTheme] || THEME_CHEERS.gaming;

    // 1. IN LOBBY PHASE: Real viewers enter chat and balance teams evenly
    if (phase === 'lobby') {
      if (now - this.lastLobbySpawnTime > 280) {
        this.lastLobbySpawnTime = now;

        const rCount = rojoPlayers.length;
        const aCount = azulPlayers.length;

        // Ensure both teams get balanced squads (up to 8 per team)
        if (rCount < 8 || aCount < 8) {
          // Strictly choose whichever team has fewer players to keep 100% balance
          const targetTeam: Team =
            rCount < aCount ? 'rojo' : aCount < rCount ? 'azul' : (Math.random() < 0.5 ? 'rojo' : 'azul');
          const targetRoster = targetTeam === 'rojo' ? roster.rojo : roster.azul;
          const unjoined = targetRoster.find((b) => !players[b.username.toLowerCase()]);

          if (unjoined) {
            this.onDispatchEvent({
              type: 'comment',
              user: unjoined.username,
              text: targetTeam === 'rojo' ? '!rojo' : '!azul',
            });
            return;
          }
        }
      }
      return;
    }

    // 2. IN INTRO OR ENDED PHASE: Real viewers chat pre/post-match and wait
    if (phase === 'intro') {
      if (Math.random() < 0.35) {
        const bot = allThemeBots[Math.floor(Math.random() * allThemeBots.length)];
        const msg = themeCheer.intro[Math.floor(Math.random() * themeCheer.intro.length)];
        this.onDispatchEvent({
          type: 'comment',
          user: bot.username,
          text: msg,
        });
      }
      return;
    }

    if (phase === 'ended') {
      if (Math.random() < 0.3) {
        const bot = allThemeBots[Math.floor(Math.random() * allThemeBots.length)];
        const playerObj = players[bot.username.toLowerCase()];
        const isWinner = playerObj && ((ropeV > 0 && playerObj.team === 'rojo') || (ropeV < 0 && playerObj.team === 'azul'));
        const pool = isWinner ? ENDED_WINNER_CHEERS : ENDED_LOSER_CHEERS;
        const msg = pool[Math.floor(Math.random() * pool.length)];
        this.onDispatchEvent({
          type: 'comment',
          user: bot.username,
          text: msg,
        });
      }
      return;
    }

    // 3. IN ACTIVE ROUND (Tug-of-War gameplay)
    if (phase === 'round') {
      // Check Red Light Reaction: Real humans stop, warnings sound, clumsy slips rarely happen
      if (redLight.state === 'amber') {
        if (Math.random() < 0.3) {
          const bot = allThemeBots[Math.floor(Math.random() * allThemeBots.length)];
          const msg = AMBER_WARNINGS[Math.floor(Math.random() * AMBER_WARNINGS.length)];
          this.onDispatchEvent({
            type: 'comment',
            user: bot.username,
            text: msg,
          });
        }
        return;
      }

      if (redLight.state === 'red') {
        // In red light: Smart bots freeze! Only ~2% chance of clumsy slip
        if (Math.random() < 0.02) {
          const clumsyBots = allThemeBots.filter((b) => b.playStyle === 'clumsy');
          const bot = clumsyBots[Math.floor(Math.random() * clumsyBots.length)] || allThemeBots[0];
          const msg = RED_LIGHT_SLIPS[Math.floor(Math.random() * RED_LIGHT_SLIPS.length)];
          this.onDispatchEvent({
            type: 'comment',
            user: bot.username,
            text: msg,
          });
        }
        return;
      }

      // Safe Box Rush: When suspended safe box appears, both teams rush comments frantically
      if (safeEvent && safeEvent.active) {
        const targetTeam: Team = Math.random() < 0.5 ? 'rojo' : 'azul';
        const teamPool = targetTeam === 'rojo' ? roster.rojo : roster.azul;
        const bot = teamPool[Math.floor(Math.random() * teamPool.length)];
        const msg = SAFE_BOX_CHEERS[Math.floor(Math.random() * SAFE_BOX_CHEERS.length)];
        this.onDispatchEvent({
          type: 'comment',
          user: bot.username,
          text: msg,
        });
        return;
      }

      // If active combo burst is in progress, continue combo
      if (this.comboRemaining > 0 && this.comboBot) {
        this.comboRemaining--;
        this.onDispatchEvent({
          type: 'gift',
          user: this.comboBot.username,
          giftName: 'Rosa',
          count: 1,
          value: 1,
        });
        return;
      }

      // Update psychological momentum engine
      if (this.momentumTicksLeft <= 0) {
        // Decide next momentum surge based on current rope tension and human psychology
        if (ropeV > 35) {
          // Rojo is winning -> Azul is panicked and tries to mount a comeback (75% Azul surge)
          this.momentumTeam = Math.random() < 0.75 ? 'azul' : 'rojo';
        } else if (ropeV < -35) {
          // Azul is winning -> Rojo rallies back (75% Rojo surge)
          this.momentumTeam = Math.random() < 0.75 ? 'rojo' : 'azul';
        } else {
          // Balanced or center -> alternate naturally
          this.momentumTeam = Math.random() < 0.5 ? 'rojo' : 'azul';
        }
        // Surge lasts 8 to 16 steps (around 3 to 6 seconds of concentrated effort)
        this.momentumTicksLeft = Math.floor(Math.random() * 9) + 8;
      } else {
        this.momentumTicksLeft--;
      }

      // Decide acting team (75% chance for team with momentum, 25% for opposing team)
      const isMomentumAction = Math.random() < 0.72;
      const activeTeam: Team = isMomentumAction ? this.momentumTeam : (this.momentumTeam === 'rojo' ? 'azul' : 'rojo');
      const teamBots = activeTeam === 'rojo' ? roster.rojo : roster.azul;
      const bot = teamBots[Math.floor(Math.random() * teamBots.length)];

      // Ensure bot is registered in the game
      if (!players[bot.username.toLowerCase()]) {
        this.onDispatchEvent({
          type: 'comment',
          user: bot.username,
          text: activeTeam === 'rojo' ? '!rojo' : '!azul',
        });
        return;
      }

      const isTension = timeLeft <= 20;
      const isLosingHeavily = (activeTeam === 'rojo' && ropeV < -45) || (activeTeam === 'azul' && ropeV > 45);
      const isWinningHeavily = (activeTeam === 'rojo' && ropeV > 50) || (activeTeam === 'azul' && ropeV < -50);
      const roll = Math.random();

      // Strategic Defensive Shield (3💎): Sent when team is falling behind heavily
      if (isLosingHeavily && roll < 0.08 && (bot.playStyle === 'gifter' || bot.playStyle === 'whale')) {
        this.onDispatchEvent({
          type: 'gift',
          user: bot.username,
          giftName: 'Escudo',
          count: 1,
          value: 3,
        });
        return;
      }

      // Strategic Power Gift: Slow (7💎) or Double Strength (15💎) in tension or by whales
      if ((isTension || isLosingHeavily) && roll < 0.05 && bot.playStyle === 'whale') {
        const powerGift = Math.random() < 0.5
          ? { name: 'Ralentizar', val: 7 }
          : { name: 'Doble Fuerza', val: 15 };
        this.onDispatchEvent({
          type: 'gift',
          user: bot.username,
          giftName: powerGift.name,
          count: 1,
          value: powerGift.val,
        });
        return;
      }

      // Rose Combo Burst (1💎): Initiates 3x to 8x streak
      if ((roll < (isTension ? 0.07 : 0.035)) && (bot.playStyle === 'gifter' || isTension)) {
        this.comboBot = bot;
        this.comboRemaining = Math.floor(Math.random() * 4) + 3; // 3 to 6 roses
        this.onDispatchEvent({
          type: 'gift',
          user: bot.username,
          giftName: 'Rosa',
          count: 1,
          value: 1,
        });
        return;
      }

      // Single Rose Gift (1💎)
      if (roll < (isTension ? 0.14 : 0.07)) {
        this.onDispatchEvent({
          type: 'gift',
          user: bot.username,
          giftName: 'Rosa',
          count: 1,
          value: 1,
        });
        return;
      }

      // Screen Taps / Likes (40% - 50% probability): Humans tap screen in rapid bursts
      if (roll < 0.52 || bot.playStyle === 'tapper') {
        // Tappers send realistic burst counts (8 to 22 taps per batch)
        const tapCount = Math.floor(Math.random() * 15) + 8;
        this.onDispatchEvent({
          type: 'like',
          user: bot.username,
          count: tapCount,
        });
        return;
      }

      // Team Cheering Comments (Pulls the rope): Select context-aware authentic phrase
      let cheerPool: string[];
      if (isLosingHeavily) {
        cheerPool = activeTeam === 'rojo' ? ROJO_COMEBACK : AZUL_COMEBACK;
      } else if (isWinningHeavily) {
        cheerPool = activeTeam === 'rojo' ? ROJO_DOMINANCE : AZUL_DOMINANCE;
      } else if (isTension) {
        cheerPool = TENSION_CHEERS;
      } else {
        cheerPool = activeTeam === 'rojo' ? themeCheer.rojo : themeCheer.azul;
      }

      const cheer = cheerPool[Math.floor(Math.random() * cheerPool.length)];
      this.onDispatchEvent({
        type: 'comment',
        user: bot.username,
        text: cheer,
      });
    }
  }

  /**
   * Starts automatic simulation loop
   */
  public start(getState: () => BotEngineState) {
    this.stop();
    this.spawnAllBots();

    const getIntervalMs = () => {
      switch (this.intensity) {
        case 'intense':
          return 240;
        case 'calm':
          return 680;
        case 'normal':
        default:
          return 380;
      }
    };

    const runLoop = () => {
      const state = getState();
      this.step(state);
      this.timerId = window.setTimeout(runLoop, getIntervalMs());
    };

    this.timerId = window.setTimeout(runLoop, getIntervalMs());
  }

  public stop() {
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.clearAllTimeouts();
  }

  public isRunning(): boolean {
    return this.timerId !== null;
  }
}

