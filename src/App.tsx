/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CONFIG } from './config';
import {
  Player,
  Team,
  GamePhase,
  BadgeType,
  ActiveEffects,
  SafeBoxEvent,
  RedLightState,
  CollectiveGoal,
  BigAnnouncement,
  MiniComboAlert,
  SideNotice,
  ThankYouItem,
  TikTokIncomingEvent,
  CustomGameAssets,
} from './types';
import { storage, validateStoragePersistence, StorageValidationResult, DEFAULT_CUSTOM_ASSETS } from './storage';
import { audio, RetroTrackId } from './audio';
import { useHaptics } from './hooks/useHaptics';
import { TestBotSimulator, BotIntensity, BotThemeId, BOT_THEMES } from './testBotSimulator';
import { PixelScene } from './components/PixelScene';
import { TopBar } from './components/TopBar';
import { Leaderboards } from './components/Leaderboards';
import { Announcements } from './components/Announcements';
import { Overlays } from './components/Overlays';
import { StreamerPanel } from './components/StreamerPanel';
import { SpriteStudioModal } from './components/SpriteStudioModal';
import { getSpriteFramesFromDB } from './utils/spriteDb';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Hook that validates the persistence of localStorage for player data and series wins
 * before the game starts, ensuring that the app gracefully falls back to default values
 * if the storage is inaccessible, corrupted, or blocked.
 */
export function useStorageValidation(): StorageValidationResult {
  const [validationResult, setValidationResult] = useState<StorageValidationResult>(() => {
    return validateStoragePersistence();
  });

  useEffect(() => {
    const result = validateStoragePersistence();
    setValidationResult(result);
    if (!result.isAvailable) {
      console.warn(`[Storage Warning]: ${result.message}`);
    } else {
      console.log(`[Storage Verified]: Modo ${result.mode} activo.`);
    }
  }, []);

  return validationResult;
}

export default function App() {
  // --- STORAGE VALIDATION & RESILIENCE ---
  const storageHealth = useStorageValidation();

  // --- HAPTICS FOR MOBILE TACTILE FEEDBACK ---
  const haptics = useHaptics();

  // --- CORE GAME STATE ---
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(CONFIG.roundDuration);
  const [ropeV, setRopeV] = useState<number>(0); // -100 to +100
  const [introCountdown, setIntroCountdown] = useState<number>(CONFIG.introDuration);
  const [endedCountdown, setEndedCountdown] = useState<number>(CONFIG.endedDuration);

  // Series Score (Best of 3)
  const [seriesScore, setSeriesScore] = useState<{ rojo: number; azul: number }>({ rojo: 0, azul: 0 });
  const [seriesHistoricalWins, setSeriesHistoricalWins] = useState<{ rojo: number; azul: number }>(() =>
    storageHealth.initialSeriesWins
  );
  const [roundWinner, setRoundWinner] = useState<Team | 'tie' | null>(null);
  const [seriesWon, setSeriesWon] = useState<Team | null>(null);

  // Players (authoritative ref to prevent closure staleness and discrepancy in fast joins)
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const playersRef = useRef<Record<string, Player>>({});
  const nextSeqNumberRef = useRef<number>(1);
  const nextAutoTeamRef = useRef<Team>('rojo');

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // Active Effects & Powers
  const [activeEffects, setActiveEffects] = useState<ActiveEffects>({
    rojoDoubleStrengthUntil: 0,
    azulDoubleStrengthUntil: 0,
    rojoSlowedUntil: 0,
    azulSlowedUntil: 0,
  });

  // Collective Live Goal
  const [collectiveGoal, setCollectiveGoal] = useState<CollectiveGoal>({
    currentDiamonds: 0,
    targetDiamonds: CONFIG.collectiveGoalInitial,
  });
  const [goldenRound, setGoldenRound] = useState<{ active: boolean; timeRemaining: number }>({
    active: false,
    timeRemaining: 0,
  });

  // Surprise Events
  const [safeEvent, setSafeEvent] = useState<SafeBoxEvent | null>(null);
  const nextSafeTriggerSecRef = useRef<number>(
    Math.floor(Math.random() * (CONFIG.safeMaxSec - CONFIG.safeMinSec + 1)) + CONFIG.safeMinSec
  );

  const [redLight, setRedLight] = useState<RedLightState>({
    state: 'green',
    timeRemaining: 0,
  });
  const nextRedLightIntervalRef = useRef<number>(
    Math.floor(Math.random() * (CONFIG.redLightMaxInterval - CONFIG.redLightMinInterval + 1)) +
      CONFIG.redLightMinInterval
  );
  const redLightTimerRef = useRef<number>(0);

  // Combos & Teams Activity Trackers
  const recentGiftsRef = useRef<{ team: Team; user: string; timestamp: number }[]>([]);
  const lastGiftRainRef = useRef<{ rojo: number; azul: number }>({ rojo: 0, azul: 0 });

  const recentCommentsRef = useRef<{ team: Team; user: string; timestamp: number }[]>([]);
  const lastSyncRef = useRef<{ rojo: number; azul: number }>({ rojo: 0, azul: 0 });

  const minRopeDeficitRef = useRef<{ rojo: number; azul: number }>({ rojo: 0, azul: 0 });

  // Intro & Round Transition Timers
  const introIntervalRef = useRef<number | null>(null);
  const endedIntervalRef = useRef<number | null>(null);
  const isStartingIntroRef = useRef<boolean>(false);

  // Best combo in round
  const [bestComboOfRound, setBestComboOfRound] = useState<{
    streak: number;
    userName: string;
    userNumber: string;
    team: Team;
    isRose: boolean;
  } | null>(null);

  // Announcements & Notices
  const [announcementQueue, setAnnouncementQueue] = useState<BigAnnouncement[]>([]);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<BigAnnouncement | null>(null);
  const [currentMiniCombo, setCurrentMiniCombo] = useState<MiniComboAlert | null>(null);
  const miniComboTimeoutRef = useRef<number | null>(null);
  const userAbilityUsageRef = useRef<Record<string, Set<string>>>({});
  const [sideNotices, setSideNotices] = useState<SideNotice[]>([]);

  // Streamer Thank-You Queue & Panels
  const [thankYouQueue, setThankYouQueue] = useState<ThankYouItem[]>([]);
  const [isStreamerPanelOpen, setIsStreamerPanelOpen] = useState<boolean>(false);
  // In test mode, bots interact by default so testers can test gameplay immediately
  const [isSimulatingChat, setIsSimulatingChat] = useState<boolean>(true);
  const [botIntensity, setBotIntensity] = useState<BotIntensity>('normal');
  const [botTheme, setBotTheme] = useState<BotThemeId>('gaming');
  const testBotSimulatorRef = useRef<TestBotSimulator | null>(null);

  const handleSelectBotTheme = (theme: BotThemeId) => {
    setBotTheme(theme);
    if (testBotSimulatorRef.current) {
      testBotSimulatorRef.current.setTheme(theme);
      // Spawn bots from new theme so testers see real immediate squad transition
      testBotSimulatorRef.current.spawnAllBots();
    }
    const themeObj = BOT_THEMES.find((t) => t.id === theme);
    if (themeObj) {
      addSideNotice(`Tema de Bots: ${themeObj.icon} ${themeObj.name}`, '🎭');
    }
  };

  // TikTok Live Connection Status
  const [tiktokConnected, setTiktokConnected] = useState<boolean>(false);
  const [tiktokUsername, setTiktokUsername] = useState<string | null>(null);
  const [tiktokMode, setTiktokMode] = useState<string>('test');

  // Audio State
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [retroTrack, setRetroTrack] = useState<RetroTrackId>('battle');

  const handleSelectRetroTrack = (track: RetroTrackId) => {
    setRetroTrack(track);
    audio.setTrack(track);
    const trackNames: Record<RetroTrackId, string> = {
      battle: '🎮 Batalla Pixel',
      arcade: '🕹️ Arcade Retro',
      boss: '⚔️ Boss Rush',
    };
    addSideNotice(`Pista 8-bit: ${trackNames[track] || track}`, '🎵');
  };

  // Custom Layer Assets State (Capa 1 a 4)
  const [customAssets, setCustomAssets] = useState<CustomGameAssets>(() => {
    return storage.getCustomAssets ? storage.getCustomAssets() : { enabled: false, handHeightPercent: 50, characterScalePercent: 75 };
  });
  const [isAssetModalOpen, setIsAssetModalOpen] = useState<boolean>(false);
  const [assetModalTab, setAssetModalTab] = useState<'sprites' | 'sizes' | 'assets' | 'sheets'>('sprites');

  // Load custom sprite folders from IndexedDB if previously uploaded
  useEffect(() => {
    async function restorePersistedSprites() {
      try {
        const [chicaFrames, chicoFrames] = await Promise.all([
          getSpriteFramesFromDB('chica'),
          getSpriteFramesFromDB('chico'),
        ]);
        if ((chicaFrames && chicaFrames.length > 0) || (chicoFrames && chicoFrames.length > 0)) {
          setCustomAssets((prev) => ({
            ...prev,
            enabled: true,
            chicaCustomFrames: chicaFrames || prev.chicaCustomFrames,
            chicoCustomFrames: chicoFrames || prev.chicoCustomFrames,
            chicaMode: chicaFrames ? 'custom_folder' : prev.chicaMode,
            chicoMode: chicoFrames ? 'custom_folder' : prev.chicoMode,
          }));
        }
      } catch (e) {
        console.warn('[SpriteDB Restore Error]:', e);
      }
    }
    restorePersistedSprites();
  }, []);

  // Ref mirror for tick callbacks
  const stateRef = useRef({
    phase,
    timeLeft,
    ropeV,
    introCountdown,
    endedCountdown,
    players,
    safeEvent,
    redLight,
    goldenRound,
    seriesScore,
    roundNumber,
  });
  useEffect(() => {
    stateRef.current = {
      phase,
      timeLeft,
      ropeV,
      introCountdown,
      endedCountdown,
      players,
      safeEvent,
      redLight,
      goldenRound,
      seriesScore,
      roundNumber,
    };
  });

  // --- AUDIO SETUP ---
  const handleToggleSound = async () => {
    if (!isAudioUnlocked) {
      await audio.unlock();
      setIsAudioUnlocked(true);
      setIsMuted(false);
    } else {
      const muted = audio.toggleMute();
      setIsMuted(muted);
    }
  };

  // Keyboard shortcut listener ('M' for mute, 'T' for test panel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'm' || e.key === 'M') {
        handleToggleSound();
      } else if (e.key === 't' || e.key === 'T') {
        setIsStreamerPanelOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAudioUnlocked]);

  // Sync Audio Engine State
  useEffect(() => {
    audio.setGameState({
      phase,
      ropeV,
      isTension: phase === 'round' && timeLeft <= CONFIG.tensionSeconds,
      isRedLight: redLight.state === 'red',
      isAmberAlert: redLight.state === 'amber',
    });
  }, [phase, ropeV, timeLeft, redLight]);

  // Tactile haptic feedback when Red Light begins
  useEffect(() => {
    if (redLight.state === 'red') {
      haptics.triggerRedLight();
    }
  }, [redLight.state, haptics]);

  // --- ANNOUNCEMENT QUEUE MANAGER ---
  const addAnnouncement = useCallback((ann: Omit<BigAnnouncement, 'id' | 'createdAt'>) => {
    const item: BigAnnouncement = {
      ...ann,
      id: Math.random().toString(36).slice(2, 9),
      createdAt: Date.now(),
      durationMs: ann.durationMs || CONFIG.firstTimeAbilityAlertDurationMs,
    };
    setAnnouncementQueue((prev) => {
      // If adding a combo announcement, replace previous combo to avoid pileups
      if (item.type === 'combo') {
        const filtered = prev.filter((q) => q.type !== 'combo');
        return [...filtered.slice(-2), item];
      }
      return prev.length < 3 ? [...prev, item] : [...prev.slice(-2), item];
    });
  }, []);

  // Mini floating combo modal trigger for repeated ability casts
  const triggerMiniCombo = useCallback((alert: Omit<MiniComboAlert, 'id' | 'createdAt'>) => {
    if (miniComboTimeoutRef.current) {
      window.clearTimeout(miniComboTimeoutRef.current);
    }
    const item: MiniComboAlert = {
      ...alert,
      id: Math.random().toString(36).slice(2, 9),
      createdAt: Date.now(),
    };
    setCurrentMiniCombo(item);
    miniComboTimeoutRef.current = window.setTimeout(() => {
      setCurrentMiniCombo(null);
      miniComboTimeoutRef.current = null;
    }, 1800);
  }, []);

  const addSideNotice = useCallback((text: string, icon?: string) => {
    const notice: SideNotice = {
      id: Math.random().toString(36).slice(2, 9),
      text,
      icon,
      createdAt: Date.now(),
    };
    setSideNotices((prev) => [...prev.slice(-5), notice]);
  }, []);

  // --- GOLDEN ROUND CONTROLLER ---
  const triggerGoldenRound = useCallback(
    (duration = CONFIG.goldenRoundDuration) => {
      try {
        audio.playGoldenRoundChord();
      } catch (e) {
        console.warn('[Audio] Golden round chord warning:', e);
      }
      setGoldenRound({ active: true, timeRemaining: duration });
      addAnnouncement({
        type: 'goldenRound',
        title: '¡RONDA DE ORO ACTIVADA!',
        subtitle: `¡Puntos dobles y bonificación para todos durante ${duration}s!`,
        icon: '👑',
        durationMs: 3000,
      });
      addSideNotice(`👑 ¡RONDA DE ORO INICIADA! (${duration}s)`, '✨');
    },
    [addAnnouncement, addSideNotice]
  );

  // Dedicated 1-second countdown timer for Golden Round (ticks down smoothly in any phase)
  useEffect(() => {
    if (!goldenRound.active) return;

    const timer = window.setInterval(() => {
      setGoldenRound((prev) => {
        if (!prev.active) return prev;
        const nextTime = Math.max(0, prev.timeRemaining - 1);
        if (nextTime <= 0) {
          addSideNotice('Ronda de Oro ha finalizado', '✨');
          return { active: false, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: nextTime };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [goldenRound.active, addSideNotice]);

  // 1. Pop next announcement from queue when slot is free
  useEffect(() => {
    if (!currentAnnouncement && announcementQueue.length > 0) {
      const next = announcementQueue[0];
      setCurrentAnnouncement(next);
      setAnnouncementQueue((prev) => prev.slice(1));
    }
  }, [currentAnnouncement, announcementQueue]);

  // 2. Dedicated auto-dismiss timer for active announcement (NEVER cancelled by queue updates)
  useEffect(() => {
    if (!currentAnnouncement) return;

    const duration = currentAnnouncement.durationMs || 2200;
    const timer = window.setTimeout(() => {
      setCurrentAnnouncement(null);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [currentAnnouncement]);

  // Expire side notices after 4.5s
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setSideNotices((prev) => prev.filter((n) => now - n.createdAt < 4500));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // --- TEAM BALANCE & PROPORTIONAL FORCE ---
  const playerList = Object.values(players);
  const rojoPlayers = playerList.filter((p) => p.team === 'rojo');
  const azulPlayers = playerList.filter((p) => p.team === 'azul');

  /**
   * Calculate proportional push multiplier for team based on active players in last 10s
   */
  const getTeamPushMultiplier = useCallback(
    (team: Team): number => {
      const now = Date.now();
      const a = Math.max(1, rojoPlayers.filter((p) => now - p.lastCommentTime <= 10000).length);
      const b = Math.max(1, azulPlayers.filter((p) => now - p.lastCommentTime <= 10000).length);
      const media = (a + b) / 2;
      const global = Math.min(1, CONFIG.refActive / media);
      const activeOfTeam = team === 'rojo' ? a : b;
      const mult = Math.min(CONFIG.maxBoost, (global * media) / activeOfTeam);
      return mult;
    },
    [rojoPlayers, azulPlayers]
  );

  /**
   * Determine captain for round (player with most diamonds this round)
   */
  const getCaptain = (team: Team) => {
    const teamMembers = playerList.filter((p) => p.team === team && p.roundDiamonds > 0);
    if (teamMembers.length === 0) return null;
    const sorted = [...teamMembers].sort((a, b) => b.roundDiamonds - a.roundDiamonds);
    const top = sorted[0];
    return { name: top.name, number: top.formattedNumber, diamonds: top.roundDiamonds };
  };

  const rojoCaptain = getCaptain('rojo');
  const azulCaptain = getCaptain('azul');

  // Champion duel (top points in round)
  const getChampionDuel = () => {
    const topRojo = [...rojoPlayers].sort((a, b) => b.points - a.points)[0] || null;
    const topAzul = [...azulPlayers].sort((a, b) => b.points - a.points)[0] || null;
    return {
      rojoLeader: topRojo
        ? { name: topRojo.name, number: topRojo.formattedNumber, points: topRojo.points }
        : null,
      azulLeader: topAzul
        ? { name: topAzul.name, number: topAzul.formattedNumber, points: topAzul.points }
        : null,
    };
  };

  // --- JOINING & STRICTLY BALANCED TEAM ALLOCATION ---
  const joinPlayer = useCallback(
    (rawUsername: string, requestedTeam: Team | 'auto'): { player: Player; assignedTeam: Team } => {
      const sanitizedName = escapeHtml(rawUsername.trim());
      const userId = rawUsername.toLowerCase().trim();

      const existing = playersRef.current[userId];
      if (existing) {
        return { player: existing, assignedTeam: existing.team };
      }

      // Authoritative synchronous count to guarantee ZERO discrepancy between teams
      const currentList = Object.values(playersRef.current);
      const rCount = currentList.filter((p) => p.team === 'rojo').length;
      const aCount = currentList.filter((p) => p.team === 'azul').length;

      let chosenTeam: Team;
      // Absolute balance enforcement:
      // If Rojo has more players, the new player MUST join Azul
      if (rCount > aCount) {
        chosenTeam = 'azul';
        if (requestedTeam === 'rojo') {
          addSideNotice(`Equilibrio: ${sanitizedName} asignado a 🔵 Azul para balancear equipos`, '⚖️');
        }
      } else if (aCount > rCount) {
        // If Azul has more players, the new player MUST join Rojo
        chosenTeam = 'rojo';
        if (requestedTeam === 'azul') {
          addSideNotice(`Equilibrio: ${sanitizedName} asignado a 🔴 Rojo para balancear equipos`, '⚖️');
        }
      } else {
        // Perfectly even (rCount === aCount)
        if (requestedTeam === 'rojo') {
          chosenTeam = 'rojo';
        } else if (requestedTeam === 'azul') {
          chosenTeam = 'azul';
        } else {
          chosenTeam = nextAutoTeamRef.current;
          nextAutoTeamRef.current = nextAutoTeamRef.current === 'rojo' ? 'azul' : 'rojo';
        }
      }

      const seq = nextSeqNumberRef.current++;
      const formattedNumber = `#${seq.toString().padStart(3, '0')}`;
      const lifetimeDiamonds = storage.getLifetimeDiamonds(userId);

      let badge: BadgeType = 'none';
      if (lifetimeDiamonds >= CONFIG.badgeMyth) badge = 'myth';
      else if (lifetimeDiamonds >= CONFIG.badgeLegend) badge = 'legend';
      else if (lifetimeDiamonds >= CONFIG.badgeAlly) badge = 'ally';

      const newPlayer: Player = {
        id: userId,
        name: sanitizedName,
        seqNumber: seq,
        formattedNumber,
        team: chosenTeam,
        points: 0,
        lifetimeDiamonds,
        roundDiamonds: 0,
        lastCommentTime: 0,
        hasChangedTeamThisRound: false,
        comboStreak: 0,
        lastGiftTime: 0,
        isRoseStreak: false,
        badge,
      };

      // IMMEDIATELY update synchronous ref so consecutive calls in same tick see new count
      playersRef.current = {
        ...playersRef.current,
        [userId]: newPlayer,
      };

      setPlayers((prev) => ({ ...prev, [userId]: newPlayer }));
      addSideNotice(`${newPlayer.formattedNumber} ${sanitizedName} se unió a ${chosenTeam === 'rojo' ? '🔴 Rojo' : '🔵 Azul'}`);

      return { player: newPlayer, assignedTeam: chosenTeam };
    },
    [addSideNotice]
  );

  // --- REBALANCE BEFORE ROUND START ---
  const rebalanceTeams = useCallback(() => {
    setPlayers((prev) => {
      const all = Object.values(prev);
      const r = all.filter((p) => p.team === 'rojo').sort((a, b) => a.seqNumber - b.seqNumber);
      const a = all.filter((p) => p.team === 'azul').sort((a, b) => a.seqNumber - b.seqNumber);

      let diff = r.length - a.length;
      if (Math.abs(diff) <= 1) return prev;

      const updated = { ...prev };
      if (diff > 1) {
        // Move newest from Rojo to Azul
        const numToMove = Math.floor(diff / 2);
        const toMove = r.slice(-numToMove);
        toMove.forEach((p) => {
          updated[p.id] = { ...p, team: 'azul' };
          addSideNotice(`Reequilibrio: ${p.formattedNumber} ${p.name} movido a 🔵 Azul`, '⚖️');
        });
      } else if (diff < -1) {
        // Move newest from Azul to Rojo
        const numToMove = Math.floor(Math.abs(diff) / 2);
        const toMove = a.slice(-numToMove);
        toMove.forEach((p) => {
          updated[p.id] = { ...p, team: 'rojo' };
          addSideNotice(`Reequilibrio: ${p.formattedNumber} ${p.name} movido a 🔴 Rojo`, '⚖️');
        });
      }
      playersRef.current = updated;
      return updated;
    });
  }, [addSideNotice]);

  // --- EVENT PROCESSOR (COMMENTS, LIKES, GIFTS) ---
  const processIncomingEvent = useCallback(
    (event: TikTokIncomingEvent) => {
      if (!event.user) return;
      const rawUser = event.user;
      const userId = rawUser.toLowerCase().trim();
      const text = (event.text || '').trim();
      const now = Date.now();

      // 1. Check commands (!rojo, !azul, !unirme, !cambio)
      const lowerText = text.toLowerCase();
      if (
        lowerText.startsWith('!rojo') ||
        lowerText.includes('🔴') ||
        lowerText.includes('🟥')
      ) {
        joinPlayer(rawUser, 'rojo');
        return;
      }
      if (
        lowerText.startsWith('!azul') ||
        lowerText.includes('🔵') ||
        lowerText.includes('🟦')
      ) {
        joinPlayer(rawUser, 'azul');
        return;
      }
      if (lowerText.startsWith('!unirme')) {
        joinPlayer(rawUser, 'auto');
        return;
      }

      // Check !cambio (switch team once per round if balanced)
      if (lowerText.startsWith('!cambio')) {
        const player = players[userId];
        if (!player) {
          joinPlayer(rawUser, 'auto');
          return;
        }
        if (player.hasChangedTeamThisRound) {
          addSideNotice(`${player.formattedNumber} ya cambiaste de equipo en esta ronda`, '⚠️');
          return;
        }

        const targetTeam: Team = player.team === 'rojo' ? 'azul' : 'rojo';
        const rCount = rojoPlayers.length + (targetTeam === 'rojo' ? 1 : -1);
        const aCount = azulPlayers.length + (targetTeam === 'azul' ? 1 : -1);

        if (Math.abs(rCount - aCount) > CONFIG.maxDiff) {
          addSideNotice(`Cambio bloqueado: rompería el equilibrio de equipos`, '⚖️');
          return;
        }

        setPlayers((prev) => ({
          ...prev,
          [userId]: {
            ...player,
            team: targetTeam,
            hasChangedTeamThisRound: true,
          },
        }));
        addSideNotice(
          `${player.formattedNumber} ${player.name} cambió a ${
            targetTeam === 'rojo' ? '🔴 Rojo' : '🔵 Azul'
          }`,
          '🔄'
        );
        return;
      }

      // 2. GIFTS PROCESSING
      if (event.type === 'gift') {
        const diamonds = Math.max(1, Number(event.value) || 1);
        const giftName = event.giftName || event.text || 'Regalo';
        const isRose = diamonds === 1 || giftName.toLowerCase().includes('ros');

        // Collective goal & lifetime accumulation (applies in any phase)
        setCollectiveGoal((prev) => {
          const nextVal = prev.currentDiamonds + diamonds;
          if (nextVal >= prev.targetDiamonds) {
            triggerGoldenRound(CONFIG.goldenRoundDuration);
            return {
              currentDiamonds: nextVal - prev.targetDiamonds,
              targetDiamonds: prev.targetDiamonds + CONFIG.collectiveGoalStep,
            };
          }
          return { ...prev, currentDiamonds: nextVal };
        });

        // Auto-join unregistered gifters to maintain balanced gameplay
        let player = playersRef.current[userId];
        if (!player) {
          const joined = joinPlayer(rawUser, 'auto');
          player = joined.player;
        }

        // Lifetime diamonds & badge unlocking
        const prevLifetime = player.lifetimeDiamonds;
        const newLifetime = prevLifetime + diamonds;
        storage.saveLifetimeDiamonds(userId, newLifetime);

        // First gift recognition
        const isFirstGiftEver = prevLifetime === 0;
        if (isFirstGiftEver) {
          audio.playFirstGiftBell();
          addAnnouncement({
            type: 'firstGift',
            title: '¡PRIMER REGALO!',
            subtitle: `¡Gracias por apoyar a Team ${player.team.toUpperCase()}!`,
            icon: '🎉',
            team: player.team,
            userFormatted: player.formattedNumber,
            userName: player.name,
            durationMs: 2600,
          });
        }

        // Check badge unlocks
        let newBadge: BadgeType = player.badge;
        if (newLifetime >= CONFIG.badgeMyth && player.badge !== 'myth') {
          newBadge = 'myth';
          addSideNotice(`¡${player.formattedNumber} ${player.name} desbloqueó 💎 MITO!`);
        } else if (newLifetime >= CONFIG.badgeLegend && player.badge !== 'legend' && player.badge !== 'myth') {
          newBadge = 'legend';
          addSideNotice(`¡${player.formattedNumber} ${player.name} desbloqueó 🏅 LEYENDA!`);
        } else if (newLifetime >= CONFIG.badgeAlly && player.badge === 'none') {
          newBadge = 'ally';
          addSideNotice(`¡${player.formattedNumber} ${player.name} desbloqueó 🎖️ ALIADO!`);
        }

        // Thank-You Queue Item
        setThankYouQueue((prev) => {
          const existingIdx = prev.findIndex((q) => q.userName.toLowerCase() === userId);
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              giftCount: updated[existingIdx].giftCount + 1,
              diamonds: updated[existingIdx].diamonds + diamonds,
              acknowledged: false, // Re-emerges pending if they gift again
              lastGiftName: giftName,
              timestamp: now,
            };
            return updated;
          }
          const newItem: ThankYouItem = {
            id: Math.random().toString(36).slice(2, 9),
            userNumber: player.formattedNumber,
            userName: player.name,
            team: player.team,
            giftCount: 1,
            diamonds,
            isFirstGift: isFirstGiftEver,
            acknowledged: false,
            lastGiftName: giftName,
            timestamp: now,
          };
          return [newItem, ...prev.slice(0, 7)];
        });

        // Tactile haptic feedback for gift interaction
        haptics.triggerGift();

        // Gift Powers during Active Round
        if (stateRef.current.phase === 'round') {
          let pushAmount = 0;

          // Personal gift combo streak (<8s)
          const isStreak = now - player.lastGiftTime <= CONFIG.comboTimeout * 1000;
          const nextStreak = isStreak ? player.comboStreak + 1 : 1;
          const isStreakRose = isStreak ? player.isRoseStreak && isRose : isRose;

          // Track abilities used by this user to alternate big modal on first send vs mini combo window on repeat
          const userAbilities = userAbilityUsageRef.current[userId] || new Set<string>();

          // Rose (1 diamond)
          if (isRose) {
            pushAmount = CONFIG.commentPush;
            audio.playRoseChime();
            const isFirstRose = !userAbilities.has('rosa');
            if (isFirstRose) {
              userAbilities.add('rosa');
              userAbilityUsageRef.current[userId] = userAbilities;
              addAnnouncement({
                type: 'gift',
                title: '¡ROSA!',
                subtitle: '+1 empuje instantáneo sin enfriamiento',
                icon: '🌹',
                team: player.team,
                userFormatted: player.formattedNumber,
                userName: player.name,
                durationMs: 2200,
              });
            } else {
              triggerMiniCombo({
                userName: player.name,
                userFormatted: player.formattedNumber,
                team: player.team,
                abilityName: 'Rosa',
                icon: '🌹',
                comboCount: nextStreak,
                bonusText: '+1 Empuje',
              });
            }
          }
          // Shield (2-4 diamonds) -> +8 push
          else if (diamonds >= CONFIG.shieldThresholdMin && diamonds <= CONFIG.shieldThresholdMax) {
            pushAmount = CONFIG.shieldPush;
            const isFirstShield = !userAbilities.has('escudo');
            if (isFirstShield) {
              userAbilities.add('escudo');
              userAbilityUsageRef.current[userId] = userAbilities;
              addAnnouncement({
                type: 'gift',
                title: '¡ESCUDO!',
                subtitle: `+${CONFIG.shieldPush} de empuje a su equipo`,
                icon: '🛡️',
                team: player.team,
                userFormatted: player.formattedNumber,
                userName: player.name,
                durationMs: 2600,
              });
            } else {
              triggerMiniCombo({
                userName: player.name,
                userFormatted: player.formattedNumber,
                team: player.team,
                abilityName: 'Escudo',
                icon: '🛡️',
                comboCount: nextStreak,
                bonusText: `+${CONFIG.shieldPush} Empuje`,
              });
            }
          }
          // Slow rival (5-9 diamonds)
          else if (diamonds >= CONFIG.slowThresholdMin && diamonds <= CONFIG.slowThresholdMax) {
            const rivalTeam: Team = player.team === 'rojo' ? 'azul' : 'rojo';
            const isAlreadySlowed =
              rivalTeam === 'azul'
                ? activeEffects.azulSlowedUntil > now
                : activeEffects.rojoSlowedUntil > now;

            if (!isAlreadySlowed) {
              setActiveEffects((prev) => ({
                ...prev,
                [rivalTeam === 'azul' ? 'azulSlowedUntil' : 'rojoSlowedUntil']:
                  now + CONFIG.slowDuration * 1000,
              }));
              const isFirstSlow = !userAbilities.has('lento');
              if (isFirstSlow) {
                userAbilities.add('lento');
                userAbilityUsageRef.current[userId] = userAbilities;
                addAnnouncement({
                  type: 'gift',
                  title: '¡RALENTIZAR!',
                  subtitle: `Rival empuja al 50% durante ${CONFIG.slowDuration}s`,
                  icon: '🧊',
                  team: player.team,
                  userFormatted: player.formattedNumber,
                  userName: player.name,
                  durationMs: 2600,
                });
              } else {
                triggerMiniCombo({
                  userName: player.name,
                  userFormatted: player.formattedNumber,
                  team: player.team,
                  abilityName: 'Ralentizar',
                  icon: '🧊',
                  comboCount: nextStreak,
                  bonusText: 'Rival 50% Lento',
                });
              }
            } else {
              triggerMiniCombo({
                userName: player.name,
                userFormatted: player.formattedNumber,
                team: player.team,
                abilityName: 'Ralentizar',
                icon: '🧊',
                comboCount: nextStreak,
                bonusText: 'Rival 50% Lento',
              });
            }
          }
          // Double Strength (10+ diamonds)
          else if (diamonds >= CONFIG.doubleThresholdMin) {
            const isAlreadyDouble =
              player.team === 'rojo'
                ? activeEffects.rojoDoubleStrengthUntil > now
                : activeEffects.azulDoubleStrengthUntil > now;

            if (!isAlreadyDouble) {
              setActiveEffects((prev) => ({
                ...prev,
                [player.team === 'rojo' ? 'rojoDoubleStrengthUntil' : 'azulDoubleStrengthUntil']:
                  now + CONFIG.doubleDuration * 1000,
              }));
              const isFirstDouble = !userAbilities.has('doble');
              if (isFirstDouble) {
                userAbilities.add('doble');
                userAbilityUsageRef.current[userId] = userAbilities;
                addAnnouncement({
                  type: 'gift',
                  title: '¡DOBLE FUERZA!',
                  subtitle: `x2 de empuje para su equipo durante ${CONFIG.doubleDuration}s`,
                  icon: '⚡',
                  team: player.team,
                  userFormatted: player.formattedNumber,
                  userName: player.name,
                  durationMs: 2600,
                });
              } else {
                triggerMiniCombo({
                  userName: player.name,
                  userFormatted: player.formattedNumber,
                  team: player.team,
                  abilityName: 'Doble Fuerza',
                  icon: '⚡',
                  comboCount: nextStreak,
                  bonusText: 'x2 Empuje',
                });
              }
            } else {
              triggerMiniCombo({
                userName: player.name,
                userFormatted: player.formattedNumber,
                team: player.team,
                abilityName: 'Doble Fuerza',
                icon: '⚡',
                comboCount: nextStreak,
                bonusText: 'x2 Empuje',
              });
            }
          }

          // Apply direct push
          if (pushAmount > 0) {
            setRopeV((prev) => {
              const delta = player.team === 'rojo' ? pushAmount : -pushAmount;
              return Math.max(-CONFIG.ropeMax, Math.min(CONFIG.ropeMax, prev + delta));
            });
          }

          if (CONFIG.comboMilestones.includes(nextStreak) || (nextStreak > 0 && nextStreak % 5 === 0)) {
            haptics.triggerCombo();
            const bonus = CONFIG.comboBonuses[nextStreak] || 0;
            if (bonus > 0) {
              setRopeV((prev) => {
                const delta = player.team === 'rojo' ? bonus : -bonus;
                return Math.max(-CONFIG.ropeMax, Math.min(CONFIG.ropeMax, prev + delta));
              });
            }
            audio.playComboStinger(nextStreak);
            triggerMiniCombo({
              userName: player.name,
              userFormatted: player.formattedNumber,
              team: player.team,
              abilityName: isStreakRose ? 'Rosa' : 'Combo',
              icon: isStreakRose ? '🌹' : '🔥',
              comboCount: nextStreak,
              bonusText: bonus > 0 ? `+${bonus} Empuje Extra` : '¡Racha Imparable!',
            });
          }

          // Track best combo of the round
          setBestComboOfRound((prev) => {
            if (!prev || nextStreak > prev.streak) {
              return {
                streak: nextStreak,
                userName: player.name,
                userNumber: player.formattedNumber,
                team: player.team,
                isRose: isStreakRose,
              };
            }
            return prev;
          });

          // Team Gift Rain: 5+ distinct gifters from same team within 10s
          recentGiftsRef.current = [
            ...recentGiftsRef.current.filter((g) => now - g.timestamp <= CONFIG.giftRainWindow * 1000),
            { team: player.team, user: userId, timestamp: now },
          ];
          const teamGifts = recentGiftsRef.current.filter((g) => g.team === player.team);
          const distinctGifters = new Set(teamGifts.map((g) => g.user)).size;
          const lastRain = lastGiftRainRef.current[player.team];

          if (
            distinctGifters >= CONFIG.giftRainCount &&
            now - lastRain > CONFIG.giftRainCooldown * 1000
          ) {
            lastGiftRainRef.current[player.team] = now;
            audio.playGiftRain();
            setRopeV((prev) => {
              const delta = player.team === 'rojo' ? CONFIG.giftRainBoost : -CONFIG.giftRainBoost;
              return Math.max(-CONFIG.ropeMax, Math.min(CONFIG.ropeMax, prev + delta));
            });
            addAnnouncement({
              type: 'giftRain',
              title: '¡LLUVIA DE REGALOS!',
              subtitle: `+${CONFIG.giftRainBoost} de empuje para Team ${player.team.toUpperCase()}`,
              icon: '🌧️',
              team: player.team,
              durationMs: 2600,
            });
          }

          // Update player data
          setPlayers((prev) => ({
            ...prev,
            [userId]: {
              ...player,
              lifetimeDiamonds: newLifetime,
              roundDiamonds: player.roundDiamonds + diamonds,
              points: player.points + (isRose ? 1 : 0),
              comboStreak: nextStreak,
              lastGiftTime: now,
              isRoseStreak: isStreakRose,
              badge: newBadge,
            },
          }));
        } else {
          // Outside round
          setPlayers((prev) => ({
            ...prev,
            [userId]: {
              ...player,
              lifetimeDiamonds: newLifetime,
              roundDiamonds: player.roundDiamonds + diamonds,
              badge: newBadge,
            },
          }));
        }

        return;
      }

      // 3. LIKES PROCESSING (Taps)
      if (event.type === 'like') {
        if (stateRef.current.phase !== 'round') return;
        let player = playersRef.current[userId];
        if (!player) {
          const joined = joinPlayer(rawUser, 'auto');
          player = joined.player;
        }

        haptics.triggerTap();
        const taps = Math.min(CONFIG.maxLikeTaps, Math.max(1, Number(event.count) || 1));
        const teamMult = getTeamPushMultiplier(player.team);
        const isTension = stateRef.current.timeLeft <= CONFIG.tensionSeconds;
        const tensionMult = isTension ? 2 : 1;

        const pushAmount = taps * CONFIG.likePush * teamMult * tensionMult;
        setRopeV((prev) => {
          const delta = player.team === 'rojo' ? pushAmount : -pushAmount;
          return Math.max(-CONFIG.ropeMax, Math.min(CONFIG.ropeMax, prev + delta));
        });
        return;
      }

      // 4. COMMENTS PROCESSING
      if (event.type === 'comment') {
        let player = playersRef.current[userId];
        if (!player) {
          // Auto-join to team needing players
          const joined = joinPlayer(rawUser, 'auto');
          player = joined.player;
        }

        if (stateRef.current.phase !== 'round') return;

        // 600ms comment cooldown
        if (now - player.lastCommentTime < CONFIG.commentCooldown) {
          return;
        }

        // RED LIGHT PENALTY CHECK
        if (stateRef.current.redLight.state === 'red') {
          // Comments DO NOT push and deduct 1 point (min 0)
          setPlayers((prev) => ({
            ...prev,
            [userId]: {
              ...player,
              points: Math.max(0, player.points - CONFIG.redLightPenalty),
              lastCommentTime: now,
            },
          }));
          addSideNotice(
            `🚨 ${player.formattedNumber} comentó en LUZ ROJA (-1 punto)`,
            '❌'
          );
          return;
        }

        // Safe Box contribution
        if (stateRef.current.safeEvent && stateRef.current.safeEvent.active) {
          setSafeEvent((prev) => {
            if (!prev || !prev.active) return prev;
            const updatedRojo = player.team === 'rojo' ? prev.rojoCount + 1 : prev.rojoCount;
            const updatedAzul = player.team === 'azul' ? prev.azulCount + 1 : prev.azulCount;

            if (updatedRojo >= CONFIG.safeGoal) {
              // Rojo opened safe!
              setRopeV((v) => Math.min(CONFIG.ropeMax, v + CONFIG.safeReward));
              addAnnouncement({
                type: 'safeWinner',
                title: '¡CAJA FUERTE ABIERTA!',
                subtitle: `Team ROJO alcanzó 25 comentarios (+${CONFIG.safeReward} empuje)`,
                icon: '🔐',
                team: 'rojo',
                durationMs: 3000,
              });
              return { ...prev, active: false, winner: 'rojo' };
            } else if (updatedAzul >= CONFIG.safeGoal) {
              // Azul opened safe!
              setRopeV((v) => Math.max(-CONFIG.ropeMax, v - CONFIG.safeReward));
              addAnnouncement({
                type: 'safeWinner',
                title: '¡CAJA FUERTE ABIERTA!',
                subtitle: `Team AZUL alcanzó 25 comentarios (+${CONFIG.safeReward} empuje)`,
                icon: '🔐',
                team: 'azul',
                durationMs: 3000,
              });
              return { ...prev, active: false, winner: 'azul' };
            }
            return { ...prev, rojoCount: updatedRojo, azulCount: updatedAzul };
          });
        }

        // Team Synchrony (10+ distinct commenters within 3s)
        recentCommentsRef.current = [
          ...recentCommentsRef.current.filter((c) => now - c.timestamp <= CONFIG.syncWindow * 1000),
          { team: player.team, user: userId, timestamp: now },
        ];
        const teamComments = recentCommentsRef.current.filter((c) => c.team === player.team);
        const distinctCommenters = new Set(teamComments.map((c) => c.user)).size;
        const lastSync = lastSyncRef.current[player.team];

        if (
          distinctCommenters >= CONFIG.syncCommentCount &&
          now - lastSync > CONFIG.syncCooldown * 1000
        ) {
          lastSyncRef.current[player.team] = now;
          audio.playSynchronyImpact();
          haptics.triggerSync();
          setRopeV((prev) => {
            const delta = player.team === 'rojo' ? CONFIG.syncBoost : -CONFIG.syncBoost;
            return Math.max(-CONFIG.ropeMax, Math.min(CONFIG.ropeMax, prev + delta));
          });
          addAnnouncement({
            type: 'sync',
            title: '¡SINCRONÍA DE EQUIPO!',
            subtitle: `10 jugadores comentaron juntos (+${CONFIG.syncBoost} empuje)`,
            icon: '🤝',
            team: player.team,
            durationMs: 2600,
          });
        }

        // Calculate push multipliers
        const teamMult = getTeamPushMultiplier(player.team);
        const isTension = stateRef.current.timeLeft <= CONFIG.tensionSeconds;
        const tensionMult = isTension ? 2 : 1;
        const isGolden = stateRef.current.goldenRound.active;
        const pointsMult = (isTension ? 2 : 1) * (isGolden ? 2 : 1);

        // Rubber-band: losing team gets bonus multiplier
        const currentV = stateRef.current.ropeV;
        let rubberMult = 1.0;
        if (player.team === 'rojo' && currentV < 0) {
          rubberMult = 1 + (Math.abs(currentV) / 100) * CONFIG.rubber;
        } else if (player.team === 'azul' && currentV > 0) {
          rubberMult = 1 + (Math.abs(currentV) / 100) * CONFIG.rubber;
        }

        // Double Strength & Slow effects
        let doubleMult = 1.0;
        if (player.team === 'rojo' && activeEffects.rojoDoubleStrengthUntil > now) doubleMult = 2.0;
        if (player.team === 'azul' && activeEffects.azulDoubleStrengthUntil > now) doubleMult = 2.0;

        let slowMult = 1.0;
        if (player.team === 'rojo' && activeEffects.rojoSlowedUntil > now) slowMult = CONFIG.slowFactor;
        if (player.team === 'azul' && activeEffects.azulSlowedUntil > now) slowMult = CONFIG.slowFactor;

        const finalPush =
          CONFIG.commentPush * teamMult * tensionMult * rubberMult * doubleMult * slowMult;

        setRopeV((prev) => {
          const delta = player.team === 'rojo' ? finalPush : -finalPush;
          const nextV = Math.max(-CONFIG.ropeMax, Math.min(CONFIG.ropeMax, prev + delta));

          // Check Comeback (Remontada): down by >= 50 and recovered to >= 0
          if (player.team === 'rojo') {
            if (prev < -CONFIG.comebackThreshold) {
              minRopeDeficitRef.current.rojo = Math.min(minRopeDeficitRef.current.rojo, prev);
            }
            if (minRopeDeficitRef.current.rojo <= -CONFIG.comebackThreshold && nextV >= 0) {
              const pts = Math.abs(Math.round(minRopeDeficitRef.current.rojo));
              minRopeDeficitRef.current.rojo = 0;
              audio.playComebackSweep();
              addAnnouncement({
                type: 'comeback',
                title: '¡REMONTADA ROJO!',
                subtitle: `¡Team Rojo recuperó ${pts} puntos y tomó el control!`,
                icon: '🔄',
                team: 'rojo',
                durationMs: 3000,
              });
            }
          } else {
            if (prev > CONFIG.comebackThreshold) {
              minRopeDeficitRef.current.azul = Math.max(minRopeDeficitRef.current.azul, prev);
            }
            if (minRopeDeficitRef.current.azul >= CONFIG.comebackThreshold && nextV <= 0) {
              const pts = Math.round(minRopeDeficitRef.current.azul);
              minRopeDeficitRef.current.azul = 0;
              audio.playComebackSweep();
              addAnnouncement({
                type: 'comeback',
                title: '¡REMONTADA AZUL!',
                subtitle: `¡Team Azul recuperó ${pts} puntos y tomó el control!`,
                icon: '🔄',
                team: 'azul',
                durationMs: 3000,
              });
            }
          }

          return nextV;
        });

        // Award personal points & rank promotion check
        const nextPoints = player.points + pointsMult;
        let prevRank = CONFIG.ranks[0];
        let newRank = CONFIG.ranks[0];
        for (const r of CONFIG.ranks) {
          if (player.points >= r.min) prevRank = r;
          if (nextPoints >= r.min) newRank = r;
        }

        if (newRank.name !== prevRank.name) {
          addSideNotice(
            `¡${player.formattedNumber} ${player.name} ascendió a ${newRank.name}! ${newRank.icon}`,
            newRank.icon
          );
        }

        setPlayers((prev) => ({
          ...prev,
          [userId]: {
            ...player,
            points: nextPoints,
            lastCommentTime: now,
          },
        }));
      }
    },
    [
      players,
      rojoPlayers.length,
      azulPlayers.length,
      activeEffects,
      joinPlayer,
      addAnnouncement,
      addSideNotice,
      getTeamPushMultiplier,
    ]
  );

  // Expose window.tiktokEvent as mandated by prompt
  useEffect(() => {
    (window as any).tiktokEvent = (event: TikTokIncomingEvent) => {
      processIncomingEvent(event);
    };
    return () => {
      delete (window as any).tiktokEvent;
    };
  }, [processIncomingEvent]);

  // WebSocket Subscription to Node.js backend (/ws)
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: number | null = null;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Connected to server ws
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'status') {
            setTiktokConnected(!!data.connected);
            setTiktokUsername(data.username || null);
            if (data.mode) setTiktokMode(data.mode);
          } else {
            processIncomingEvent(data);
          }
        } catch (err) {
          console.error('[WS Client Message Error]:', err);
        }
      };

      ws.onclose = () => {
        setTiktokConnected(false);
        reconnectTimeout = window.setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connectWs();

    return () => {
      if (reconnectTimeout) window.clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [processIncomingEvent]);

  // --- ROUND TRANSITIONS & CONTROLLER ---
  const startRoundDirectly = useCallback(() => {
    if (introIntervalRef.current) {
      window.clearInterval(introIntervalRef.current);
      introIntervalRef.current = null;
    }
    if (endedIntervalRef.current) {
      window.clearInterval(endedIntervalRef.current);
      endedIntervalRef.current = null;
    }
    isStartingIntroRef.current = false;
    stateRef.current.phase = 'round';
    setPhase('round');
    try {
      audio.playStartImpact();
    } catch (e) {
      console.warn('[Audio] playStartImpact warning:', e);
    }
  }, []);

  const startIntro = useCallback(() => {
    // Prevent multiple parallel or overlapping invocations
    if (isStartingIntroRef.current && stateRef.current.phase === 'intro') {
      return;
    }
    isStartingIntroRef.current = true;

    if (introIntervalRef.current) {
      window.clearInterval(introIntervalRef.current);
      introIntervalRef.current = null;
    }
    if (endedIntervalRef.current) {
      window.clearInterval(endedIntervalRef.current);
      endedIntervalRef.current = null;
    }

    rebalanceTeams();
    stateRef.current.phase = 'intro';
    setPhase('intro');
    setRopeV(0);
    setTimeLeft(CONFIG.roundDuration);
    setSafeEvent(null);
    setRedLight({ state: 'green', timeRemaining: 0 });
    redLightTimerRef.current = 0;
    minRopeDeficitRef.current = { rojo: 0, azul: 0 };
    userAbilityUsageRef.current = {};
    setCurrentMiniCombo(null);
    nextSafeTriggerSecRef.current =
      Math.floor(Math.random() * (CONFIG.safeMaxSec - CONFIG.safeMinSec + 1)) + CONFIG.safeMinSec;

    // Reset round diamonds and team change lock on players
    setPlayers((prev) => {
      const reset: Record<string, Player> = {};
      Object.entries(prev).forEach(([id, p]) => {
        reset[id] = {
          ...p,
          points: 0,
          roundDiamonds: 0,
          hasChangedTeamThisRound: false,
          comboStreak: 0,
        };
      });
      return reset;
    });

    // 3 Second Countdown: 3, 2, 1, 0 ("¡YA!")
    setIntroCountdown(3);
    try {
      audio.playCountdownTick(3);
    } catch (e) {
      console.warn('[Audio] countdown tick warning:', e);
    }

    let count = 3;
    introIntervalRef.current = window.setInterval(() => {
      count--;
      if (count > 0) {
        setIntroCountdown(count);
        try {
          audio.playCountdownTick(count);
        } catch (e) {
          console.warn('[Audio] countdown tick warning:', e);
        }
      } else if (count === 0) {
        setIntroCountdown(0);
        try {
          audio.playStartImpact();
        } catch (e) {
          console.warn('[Audio] start impact warning:', e);
        }
      } else {
        if (introIntervalRef.current) {
          window.clearInterval(introIntervalRef.current);
          introIntervalRef.current = null;
        }
        isStartingIntroRef.current = false;
        stateRef.current.phase = 'round';
        setPhase('round');
      }
    }, 1000);
  }, [rebalanceTeams]);

  const handleManualPull = useCallback(
    (team: Team) => {
      if (stateRef.current.phase === 'lobby') {
        startIntro();
      }

      // Proportional push with tactile effect
      const pushAmount = 3.5;
      setRopeV((prev) => {
        const delta = team === 'rojo' ? pushAmount : -pushAmount;
        return Math.max(-CONFIG.ropeMax, Math.min(CONFIG.ropeMax, prev + delta));
      });

      try {
        audio.playRoseChime();
      } catch (_e) {}
      haptics.triggerTap();
      addSideNotice(`¡Tirón de ${team === 'rojo' ? '🔴 Team Rojo' : '🔵 Team Azul'}!`, '✊');
    },
    [startIntro, haptics, addSideNotice]
  );

  const endRound = useCallback(
    (winner: Team | 'tie') => {
      if (endedIntervalRef.current) {
        window.clearInterval(endedIntervalRef.current);
        endedIntervalRef.current = null;
      }
      if (introIntervalRef.current) {
        window.clearInterval(introIntervalRef.current);
        introIntervalRef.current = null;
      }
      isStartingIntroRef.current = false;
      stateRef.current.phase = 'ended';
      setPhase('ended');
      setRoundWinner(winner);
      setEndedCountdown(CONFIG.endedDuration);

      // Audio collapse or fanfare
      if (winner !== 'tie') {
        try {
          audio.playPlatformCollapse();
        } catch (e) {
          console.warn('[Audio] platform collapse error:', e);
        }
        haptics.triggerWin();
      }

      // Series update
      let nextRojoWins = seriesScore.rojo;
      let nextAzulWins = seriesScore.azul;
      let newSeriesWinner: Team | null = null;

      if (winner === 'rojo') {
        nextRojoWins += 1;
      } else if (winner === 'azul') {
        nextAzulWins += 1;
      }

      if (nextRojoWins >= CONFIG.seriesWin) {
        newSeriesWinner = 'rojo';
      } else if (nextAzulWins >= CONFIG.seriesWin) {
        newSeriesWinner = 'azul';
      }

      setSeriesWon(newSeriesWinner);

      if (newSeriesWinner) {
        try {
          audio.playRoundEndResolution('seriesWin');
        } catch (e) {
          console.warn('[Audio] round resolution error:', e);
        }
        const updatedHistorical = {
          ...seriesHistoricalWins,
          [newSeriesWinner]: seriesHistoricalWins[newSeriesWinner] + 1,
        };
        setSeriesHistoricalWins(updatedHistorical);
        storage.saveSeriesWins(updatedHistorical);
        // Reset series score
        setSeriesScore({ rojo: 0, azul: 0 });
        setRoundNumber(1);
      } else {
        try {
          audio.playRoundEndResolution(winner === 'tie' ? 'tie' : 'win');
        } catch (e) {
          console.warn('[Audio] round resolution error:', e);
        }
        setSeriesScore({ rojo: nextRojoWins, azul: nextAzulWins });
        setRoundNumber((r) => r + 1);
      }

      // Countdown to next round
      let countdown = CONFIG.endedDuration;
      endedIntervalRef.current = window.setInterval(() => {
        countdown--;
        setEndedCountdown(countdown);
        if (countdown <= 0) {
          if (endedIntervalRef.current) {
            window.clearInterval(endedIntervalRef.current);
            endedIntervalRef.current = null;
          }
          setSeriesWon(null);
          startIntro();
        }
      }, 1000);
    },
    [seriesScore, seriesHistoricalWins, startIntro, haptics]
  );

  // Clean up any pending intervals on unmount
  useEffect(() => {
    return () => {
      if (introIntervalRef.current) window.clearInterval(introIntervalRef.current);
      if (endedIntervalRef.current) window.clearInterval(endedIntervalRef.current);
    };
  }, []);

  // --- MAIN GAME TICK (100 ms Interval) ---
  useEffect(() => {
    const tickInterval = window.setInterval(() => {
      const s = stateRef.current;

      // 1. LOBBY PHASE
      if (s.phase === 'lobby') {
        const rList = Object.values(s.players).filter((p) => p.team === 'rojo');
        const aList = Object.values(s.players).filter((p) => p.team === 'azul');
        // Auto-start once each team has >= 1 player and not already transitioning
        if (rList.length >= 1 && aList.length >= 1 && !isStartingIntroRef.current) {
          startIntro();
        }
        return;
      }

      // 2. INTRO PHASE (3 Seconds Countdown: 3, 2, 1, ¡YA!)
      if (s.phase === 'intro') {
        // Handled via introIntervalRef
        return;
      }

      // 3. ROUND PHASE (120 Seconds Active Match)
      if (s.phase === 'round') {
        // Safe box event countdown
        if (s.safeEvent && s.safeEvent.active) {
          setSafeEvent((prev) => {
            if (!prev || !prev.active) return prev;
            const nextTime = prev.timeRemaining - 0.1;
            if (nextTime <= 0) {
              addSideNotice('Caja Fuerte expiró sin abrirse', '🔒');
              return { ...prev, active: false };
            }
            return { ...prev, timeRemaining: nextTime };
          });
        }

        // Red Light / Green Light timer & random intervals
        if (CONFIG.redLightEnabled) {
          redLightTimerRef.current += 0.1;

          if (s.redLight.state === 'green') {
            // Check if time to trigger amber warning (cannot happen during safe event or last 20s)
            if (
              redLightTimerRef.current >= nextRedLightIntervalRef.current &&
              (!s.safeEvent || !s.safeEvent.active) &&
              s.timeLeft > CONFIG.tensionSeconds + 5
            ) {
              setRedLight({ state: 'amber', timeRemaining: CONFIG.redLightWarningDuration });
              try {
                audio.playAmberAlert();
              } catch (e) {
                console.warn(e);
              }
              redLightTimerRef.current = 0;
            }
          } else if (s.redLight.state === 'amber') {
            const nextAmber = s.redLight.timeRemaining - 0.1;
            if (nextAmber <= 0) {
              setRedLight({ state: 'red', timeRemaining: CONFIG.redLightDuration });
              try {
                audio.playRedLightStart();
              } catch (e) {
                console.warn(e);
              }
            } else {
              setRedLight((prev) => ({ ...prev, timeRemaining: nextAmber }));
            }
          } else if (s.redLight.state === 'red') {
            const nextRed = s.redLight.timeRemaining - 0.1;
            if (nextRed <= 0) {
              setRedLight({ state: 'green', timeRemaining: 0 });
              try {
                audio.playGreenLightReturn();
              } catch (e) {
                console.warn(e);
              }
              // Schedule next interval
              nextRedLightIntervalRef.current =
                Math.floor(
                  Math.random() * (CONFIG.redLightMaxInterval - CONFIG.redLightMinInterval + 1)
                ) + CONFIG.redLightMinInterval;
              redLightTimerRef.current = 0;
            } else {
              setRedLight((prev) => ({ ...prev, timeRemaining: nextRed }));
            }
          }
        }

        // Safe box spawn check (random second between 30 and 80)
        const roundElapsed = CONFIG.roundDuration - s.timeLeft;
        if (
          !s.safeEvent &&
          roundElapsed >= nextSafeTriggerSecRef.current &&
          s.redLight.state === 'green'
        ) {
          setSafeEvent({
            active: true,
            timeRemaining: CONFIG.safeDuration,
            rojoCount: 0,
            azulCount: 0,
            winner: null,
          });
          try {
            audio.playSafeBoxArpeggio();
          } catch (e) {
            console.warn(e);
          }
          addAnnouncement({
            type: 'gift',
            title: '¡CAJA FUERTE SUSPENDIDA!',
            subtitle: '¡Primer equipo con 25 comentarios gana +20 de empuje!',
            icon: '🔐',
            durationMs: 3000,
          });
        }

        // Check Instant Win by reaching ±100
        if (s.ropeV >= CONFIG.ropeMax) {
          endRound('rojo');
          return;
        } else if (s.ropeV <= -CONFIG.ropeMax) {
          endRound('azul');
          return;
        }

        // Decrease timeLeft every 100ms
        setTimeLeft((prev) => {
          const next = Math.max(0, parseFloat((prev - 0.1).toFixed(1)));
          if (next <= 0) {
            // Time expired: determine winner by rope sign
            const finalWinner = s.ropeV > 0 ? 'rojo' : s.ropeV < 0 ? 'azul' : 'tie';
            endRound(finalWinner);
            return 0;
          }
          return next;
        });
      }
    }, 100);

    return () => window.clearInterval(tickInterval);
  }, [startIntro, endRound]);

  // Comprehensive Bot Simulator for Testing Mode
  useEffect(() => {
    if (!testBotSimulatorRef.current) {
      testBotSimulatorRef.current = new TestBotSimulator((event) => {
        processIncomingEvent(event);
      });
    }

    const sim = testBotSimulatorRef.current;
    sim.setIntensity(botIntensity);
    sim.setTheme(botTheme);

    if (isSimulatingChat && !tiktokConnected) {
      sim.start(() => ({
        phase: stateRef.current.phase,
        timeLeft: stateRef.current.timeLeft,
        ropeV: stateRef.current.ropeV,
        players: stateRef.current.players,
        redLight: stateRef.current.redLight,
        safeEvent: stateRef.current.safeEvent,
      }));
    } else {
      sim.stop();
    }

    return () => {
      sim.stop();
    };
  }, [isSimulatingChat, tiktokConnected, botIntensity, processIncomingEvent]);

  // MVPs calculation for ended overlay
  const sortedRojo = [...rojoPlayers].sort((a, b) => b.points - a.points);
  const sortedAzul = [...azulPlayers].sort((a, b) => b.points - a.points);
  const rojoMVP = sortedRojo[0] || null;
  const azulMVP = sortedAzul[0] || null;

  const duelWinner =
    rojoMVP && azulMVP
      ? rojoMVP.points >= azulMVP.points
        ? { player: rojoMVP, team: 'rojo' as Team }
        : { player: azulMVP, team: 'azul' as Team }
      : null;

  const handleUpdateTikTokUsername = async (newUsername: string) => {
    try {
      const res = await fetch('/api/tiktok/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await res.json();
      if (data.username) {
        setTiktokUsername(data.username);
        addSideNotice(`Buscando LIVE de @${data.username}...`, '🔍');
      } else {
        setTiktokUsername(null);
        addSideNotice('Modo prueba activado', '⚙️');
      }
    } catch (err) {
      console.log('[Update Username Notice]:', err);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-start p-2 sm:p-4 select-none font-['Outfit']">
      {/* 9:16 Vertical Live Stream Container (Max 720px for desktop & TikTok Live Studio capture) */}
      <div className="relative w-full max-w-[720px] flex flex-col gap-2.5 items-center">
        {/* Top Scoreboard & Controls */}
        <TopBar
          phase={phase}
          timeLeft={Math.ceil(timeLeft)}
          seriesScore={seriesScore}
          seriesHistoricalWins={seriesHistoricalWins}
          rojoCount={rojoPlayers.length}
          azulCount={azulPlayers.length}
          championDuel={getChampionDuel()}
          collectiveGoal={collectiveGoal}
          isGoldenRound={goldenRound.active}
          goldenRoundTimeRemaining={Math.ceil(goldenRound.timeRemaining)}
          isAudioUnlocked={isAudioUnlocked}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          activeEffects={activeEffects}
          tiktokConnected={tiktokConnected}
          tiktokUsername={tiktokUsername}
          isSimulatingChat={isSimulatingChat}
          onToggleSimulateChat={() => setIsSimulatingChat((prev) => !prev)}
          onStartRound={phase === 'intro' ? startRoundDirectly : startIntro}
        />

        {/* 8-Bit Pixel Art Game Scene */}
        <div className="relative w-full">
          <PixelScene
            ropeV={ropeV}
            phase={phase}
            losingTeam={phase === 'ended' && roundWinner !== 'tie' ? (roundWinner === 'rojo' ? 'azul' : 'rojo') : null}
            rojoPlayers={rojoPlayers}
            azulPlayers={azulPlayers}
            rojoCaptain={rojoCaptain}
            azulCaptain={azulCaptain}
            safeEvent={safeEvent}
            redLight={redLight}
            isGoldenRound={goldenRound.active}
            isTension={phase === 'round' && timeLeft <= CONFIG.tensionSeconds}
            customAssets={customAssets}
            onManualPull={handleManualPull}
            onOpenAssetManager={() => setIsAssetModalOpen(true)}
            onToggleReferenceOverlay={() => {
              setCustomAssets((prev) => {
                const next = {
                  ...prev,
                  referenceVisible: !prev.referenceVisible,
                };
                storage.saveCustomAssets?.(next);
                return next;
              });
            }}
          />

          {/* Central Animated Announcements & Alerts */}
          <Announcements
            currentAnnouncement={currentAnnouncement}
            currentMiniCombo={currentMiniCombo}
            sideNotices={sideNotices}
            onDismissAnnouncement={() => setCurrentAnnouncement(null)}
            onDismissMiniCombo={() => setCurrentMiniCombo(null)}
          />

          {/* Fullscreen Non-Clickable Overlays (Intro 3s & End 9s) */}
          <Overlays
            phase={phase}
            roundNumber={roundNumber}
            introCountdown={introCountdown}
            endedCountdown={endedCountdown}
            seriesScore={seriesScore}
            seriesWon={seriesWon}
            roundWinner={roundWinner}
            rojoMVP={rojoMVP}
            azulMVP={azulMVP}
            duelWinner={duelWinner}
            bestComboOfRound={bestComboOfRound}
            rojoCount={rojoPlayers.length}
            azulCount={azulPlayers.length}
            onSkipIntro={startRoundDirectly}
          />
        </div>

        {/* Real-time Top 5 Leaderboards */}
        <Leaderboards
          rojoPlayers={rojoPlayers}
          azulPlayers={azulPlayers}
          rojoCaptain={rojoCaptain}
          azulCaptain={azulCaptain}
        />

        {/* Instructions footer for TikTok viewers */}
        <div className="w-full text-center text-[10px] sm:text-xs text-neutral-400 bg-[#12121a]/80 py-2 px-3 rounded-xl border border-white/5 flex items-center justify-around">
          <span>Comenta <strong className="text-red-400">!rojo</strong> o <strong className="text-blue-400">!azul</strong> para unirte</span>
          <span className="hidden sm:inline">•</span>
          <span>Likes y Rosas 🌹 halan la soga</span>
          <span className="hidden sm:inline">•</span>
          <span><strong className="text-yellow-400">!cambio</strong> para cambiar equipo</span>
        </div>
      </div>

      {/* Streamer Panel & Thank-You Queue (Positioned outside capture zone) */}
      <StreamerPanel
        isOpen={isStreamerPanelOpen}
        onToggleOpen={() => setIsStreamerPanelOpen((prev) => !prev)}
        onSimulateEvent={processIncomingEvent}
        onForceStart={phase === 'intro' ? startRoundDirectly : startIntro}
        onClearVictories={() => {
          const reset = { rojo: 0, azul: 0 };
          setSeriesHistoricalWins(reset);
          storage.saveSeriesWins(reset);
        }}
        isSimulatingChat={isSimulatingChat}
        onToggleSimulateChat={() => setIsSimulatingChat((prev) => !prev)}
        botIntensity={botIntensity}
        onSetBotIntensity={(intensity) => setBotIntensity(intensity)}
        botTheme={botTheme}
        onSelectBotTheme={handleSelectBotTheme}
        onSpawnBots={() => testBotSimulatorRef.current?.spawnAllBots()}
        onTriggerCombo10={() => {
          if (testBotSimulatorRef.current) {
            testBotSimulatorRef.current.triggerRoseCombo('rojo', 10);
          } else {
            for (let i = 0; i < 10; i++) {
              processIncomingEvent({
                type: 'gift',
                user: 'JugadorCombo',
                giftName: 'Rosa',
                count: 1,
                value: 1,
              });
            }
          }
        }}
        onTriggerGiftRain={() => {
          ['UserA', 'UserB', 'UserC', 'UserD', 'UserE'].forEach((u) => {
            processIncomingEvent({
              type: 'gift',
              user: u,
              giftName: 'Rosa',
              count: 1,
              value: 1,
            });
          });
        }}
        onTriggerSync={() => {
          if (testBotSimulatorRef.current) {
            testBotSimulatorRef.current.triggerSynchrony('rojo');
          } else {
            ['Bot1', 'Bot2', 'Bot3', 'Bot4', 'Bot5', 'Bot6', 'Bot7', 'Bot8', 'Bot9', 'Bot10'].forEach(
              (u) => {
                joinPlayer(u, 'rojo');
                processIncomingEvent({ type: 'comment', user: u, text: 'Halen!' });
              }
            );
          }
        }}
        onTriggerComeback={() => {
          setRopeV(-65);
        }}
        onTriggerSafeBox={() => {
          setSafeEvent({
            active: true,
            timeRemaining: CONFIG.safeDuration,
            rojoCount: 0,
            azulCount: 0,
            winner: null,
          });
          audio.playSafeBoxArpeggio();
        }}
        onTriggerRedLight={() => {
          setRedLight({ state: 'amber', timeRemaining: CONFIG.redLightWarningDuration });
          audio.playAmberAlert();
        }}
        onTriggerGoldenRound={() => {
          triggerGoldenRound(CONFIG.goldenRoundDuration);
        }}
        onTriggerSurge={(team) => {
          testBotSimulatorRef.current?.triggerSurge(team, 20);
        }}
        thankYouQueue={thankYouQueue}
        onAcknowledgeDonor={(id) => {
          setThankYouQueue((prev) =>
            prev.map((item) => (item.id === id ? { ...item, acknowledged: true } : item))
          );
        }}
        onClearThankYouQueue={() => setThankYouQueue([])}
        tiktokConnected={tiktokConnected}
        tiktokUsername={tiktokUsername}
        tiktokMode={tiktokMode}
        onUpdateTikTokUsername={handleUpdateTikTokUsername}
        retroTrack={retroTrack}
        onSelectRetroTrack={handleSelectRetroTrack}
        onOpenAssetManager={() => setIsAssetModalOpen(true)}
      />

      {/* Estudio de Sprites, Activos y Referencia */}
      <SpriteStudioModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        customAssets={customAssets}
        onSaveAssets={(updated) => {
          setCustomAssets(updated);
          storage.saveCustomAssets?.(updated);
        }}
        onResetAssets={() => {
          setCustomAssets(DEFAULT_CUSTOM_ASSETS);
          storage.saveCustomAssets?.(DEFAULT_CUSTOM_ASSETS);
        }}
      />
    </main>
  );
}
