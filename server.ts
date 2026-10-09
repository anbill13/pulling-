import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return parseInt(process.env.PORT || '3000', 10);
}

const PORT = getPort();
let activeTikTokUsername = (process.env.TIKTOK_USERNAME || '').trim().replace(/^@+/, '');

// Handle port conflicts gracefully
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[Server] Puerto ${PORT} en uso. Reintentando en 1.5s...`);
    setTimeout(() => {
      try {
        server.close();
      } catch (_) {}
      if (!server.listening) {
        server.listen(PORT, '0.0.0.0');
      }
    }, 1500);
  } else {
    console.error('[Server Error]:', err);
  }
});

// Handle upgrade requests specifically for /ws
server.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  } catch (_e) {
    socket.destroy();
  }
});

function cleanUsername(raw: string): string {
  return (raw || '').trim().replace(/^@+/, '');
}

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ limit: '60mb', extended: true }));

const assetsDir = path.join(process.cwd(), 'public', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}
app.use('/assets', express.static(assetsDir));

// Set of connected frontend WebSockets
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);

  // Send initial connection status
  ws.send(
    JSON.stringify({
      type: 'status',
      connected: isTikTokConnected,
      username: activeTikTokUsername || null,
      mode: isTikTokConnected ? 'live' : activeTikTokUsername ? 'offline' : 'test',
    })
  );

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.log('[WS Client Notice]:', (err as any)?.message || err);
    clients.delete(ws);
  });
});

/**
 * Broadcast event to all connected frontends
 */
export function broadcast(event: {
  type: 'comment' | 'like' | 'gift' | 'status';
  user?: string;
  text?: string;
  count?: number;
  value?: number;
  giftName?: string;
  connected?: boolean;
  username?: string | null;
  mode?: string;
}) {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.log('[WS Broadcast Notice]:', (err as any)?.message || err);
      }
    }
  }
}

// REST status endpoint
app.get('/api/status', (_req, res) => {
  res.json({
    connected: isTikTokConnected,
    username: activeTikTokUsername || null,
    mode: isTikTokConnected ? 'live' : activeTikTokUsername ? 'offline' : 'test',
    clients: clients.size,
  });
});

// REST endpoint to upload and save custom background music
app.post('/api/upload-bgm', (req, res) => {
  try {
    const { audioData, filename } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'Faltan datos de audio' });
    }
    const base64Data = audioData
      .replace(/^data:audio\/\w+;base64,/, '')
      .replace(/^data:application\/octet-stream;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = filename && filename.endsWith('.wav') ? '.wav' : filename && filename.endsWith('.ogg') ? '.ogg' : '.mp3';
    const fileName = `custom_bgm${ext}`;
    const targetPath = path.join(process.cwd(), 'public', 'assets', fileName);
    fs.writeFileSync(targetPath, buffer);
    console.log(`[Audio] Nueva música de fondo guardada en: ${targetPath} (${buffer.length} bytes)`);
    res.json({
      success: true,
      url: `/assets/${fileName}`,
      size: buffer.length,
    });
  } catch (err: any) {
    console.error('[Audio Upload Error]:', err);
    res.status(500).json({ error: err.message || 'Error al guardar audio' });
  }
});

// REST endpoint to check if custom background music exists
app.get('/api/custom-bgm', (_req, res) => {
  const mp3Path = path.join(process.cwd(), 'public', 'assets', 'custom_bgm.mp3');
  const wavPath = path.join(process.cwd(), 'public', 'assets', 'custom_bgm.wav');
  const oggPath = path.join(process.cwd(), 'public', 'assets', 'custom_bgm.ogg');
  if (fs.existsSync(mp3Path)) {
    return res.json({ exists: true, url: '/assets/custom_bgm.mp3' });
  }
  if (fs.existsSync(wavPath)) {
    return res.json({ exists: true, url: '/assets/custom_bgm.wav' });
  }
  if (fs.existsSync(oggPath)) {
    return res.json({ exists: true, url: '/assets/custom_bgm.ogg' });
  }
  return res.json({ exists: false, url: null });
});

// REST endpoint to change TikTok username at runtime
app.post('/api/tiktok/username', (req, res) => {
  const { username } = req.body;
  activeTikTokUsername = cleanUsername(username || '');
  console.log(`[TikTok] Updated target username to: @${activeTikTokUsername || '(none)'}`);

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  cleanupClient();
  initTikTokConnector();

  res.json({
    success: true,
    username: activeTikTokUsername || null,
    mode: activeTikTokUsername ? 'connecting' : 'test',
  });
});

// REST simulate endpoint for testing
app.post('/api/simulate', (req, res) => {
  const { type, user, text, count, value, giftName } = req.body;
  if (!type || !user) {
    res.status(400).json({ error: 'type and user are required' });
    return;
  }
  broadcast({
    type,
    user: String(user),
    text: text ? String(text) : '',
    count: Number(count) || 1,
    value: Number(value) || 0,
    giftName: giftName ? String(giftName) : undefined,
  });
  res.json({ success: true });
});

// TikTok Connector Integration
let isTikTokConnected = false;
let tiktokClient: any = null;
let reconnectTimer: NodeJS.Timeout | null = null;
const lastGiftStreak: Record<string, number> = {};

function cleanupClient() {
  if (tiktokClient) {
    try {
      tiktokClient.removeAllListeners();
      if (typeof tiktokClient.disconnect === 'function') {
        tiktokClient.disconnect();
      }
    } catch (_) {}
    tiktokClient = null;
  }
}

async function initTikTokConnector() {
  cleanupClient();

  if (!activeTikTokUsername) {
    console.log('[TikTok] No TIKTOK_USERNAME configured. Running in test mode.');
    isTikTokConnected = false;
    broadcast({
      type: 'status',
      connected: false,
      username: null,
      mode: 'test',
    });
    return;
  }

  try {
    const tiktokConnectorModule = await import('tiktok-live-connector');
    const ConnectorClass =
      (tiktokConnectorModule as any).TikTokLiveConnection ||
      (tiktokConnectorModule as any).WebcastPushConnection ||
      (tiktokConnectorModule as any).default;

    if (!ConnectorClass) {
      console.warn('[TikTok] No connector class found in tiktok-live-connector package');
      return;
    }

    tiktokClient = new ConnectorClass(activeTikTokUsername, {
      processInitialData: false,
      enableExtendedGiftInfo: true,
      requestPollingIntervalMs: 1000,
    });

    tiktokClient.on('connected', (state: any) => {
      isTikTokConnected = true;
      console.log(`[TikTok] Conectado exitosamente al LIVE de @${activeTikTokUsername} (Room ID: ${state?.roomId})`);
      broadcast({
        type: 'status',
        connected: true,
        username: activeTikTokUsername,
        mode: 'live',
      });
    });

    tiktokClient.on('disconnected', () => {
      isTikTokConnected = false;
      console.log(`[TikTok] Desconectado de @${activeTikTokUsername}. Reconectando en 10s...`);
      broadcast({
        type: 'status',
        connected: false,
        username: activeTikTokUsername,
        mode: 'reconnecting',
      });
      scheduleReconnect();
    });

    tiktokClient.on('error', (err: any) => {
      const errMsg = err?.exception?.message || err?.message || String(err);
      const isOffline =
        err?.exception?.name === 'UserOfflineError' ||
        err?.name === 'UserOfflineError' ||
        errMsg.includes("isn't online") ||
        errMsg.includes('offline');

      isTikTokConnected = false;

      if (isOffline) {
        console.log(`[TikTok] @${activeTikTokUsername} no está transmitiendo en vivo en este momento. Modo prueba activo. Reintentando en 10 s...`);
        broadcast({
          type: 'status',
          connected: false,
          username: activeTikTokUsername,
          mode: 'offline',
        });
      } else {
        console.log(`[TikTok] Aviso de conexión para @${activeTikTokUsername}: ${errMsg}`);
        broadcast({
          type: 'status',
          connected: false,
          username: activeTikTokUsername,
          mode: 'reconnecting',
        });
      }

      scheduleReconnect();
    });

    // Chat / Comment event
    tiktokClient.on('chat', (data: any) => {
      const user = data.uniqueId || data.nickname || 'Anónimo';
      const comment = data.comment || '';
      broadcast({
        type: 'comment',
        user,
        text: comment,
        count: 1,
        value: 0,
      });
    });

    // Like event
    tiktokClient.on('like', (data: any) => {
      const user = data.uniqueId || data.nickname || 'Anónimo';
      const count = data.likeCount || 1;
      broadcast({
        type: 'like',
        user,
        text: '',
        count,
        value: 0,
      });
    });

    // Gift event: value = diamantes y se cuenta una sola vez por regalo (no por cada repetición de racha)
    tiktokClient.on('gift', (data: any) => {
      const user = data.uniqueId || data.nickname || 'Anónimo';
      const diamondUnit = Number(data.diamondCount) || 1;
      const giftName = data.giftName || 'Regalo';
      let deltaCount = 1;

      // Handle streakable repeat gifts
      if (data.giftType === 1) {
        const streakKey = `${data.userId || user}_${data.giftId}_${data.groupId || 'g'}`;
        const prevCount = lastGiftStreak[streakKey] || 0;
        const currentCount = Number(data.repeatCount) || 1;
        if (currentCount > prevCount) {
          deltaCount = currentCount - prevCount;
          lastGiftStreak[streakKey] = currentCount;
        } else {
          deltaCount = 0; // already broadcast
        }
        if (data.repeatEnd) {
          delete lastGiftStreak[streakKey];
        }
      } else {
        deltaCount = Number(data.repeatCount) || 1;
      }

      if (deltaCount > 0) {
        broadcast({
          type: 'gift',
          user,
          text: giftName,
          count: deltaCount,
          value: diamondUnit * deltaCount,
          giftName,
        });
      }
    });

    console.log(`[TikTok] Conectando a @${activeTikTokUsername}...`);
    await tiktokClient.connect();
  } catch (err: any) {
    const errMsg = err?.exception?.message || err?.message || String(err);
    const isOffline =
      err?.exception?.name === 'UserOfflineError' ||
      err?.name === 'UserOfflineError' ||
      errMsg.includes("isn't online") ||
      errMsg.includes('offline');

    isTikTokConnected = false;

    if (isOffline) {
      console.log(`[TikTok] @${activeTikTokUsername} no está transmitiendo en vivo. Modo prueba activo. Reintentando en 10 s...`);
      broadcast({
        type: 'status',
        connected: false,
        username: activeTikTokUsername,
        mode: 'offline',
      });
    } else {
      console.log(`[TikTok] Aviso de intento de conexión para @${activeTikTokUsername}: ${errMsg}`);
      broadcast({
        type: 'status',
        connected: false,
        username: activeTikTokUsername,
        mode: 'reconnecting',
      });
    }

    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initTikTokConnector();
  }, 10000); // Reconexión automática cada 10 s
}

// Start TikTok listener
initTikTokConnector();

// Serve frontend in dev (via Vite middleware) or prod (via dist)
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!server.listening) {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Tira y Afloja running on http://0.0.0.0:${PORT}`);
    });
  }
}

function handleExit() {
  cleanupClient();
  for (const client of clients) {
    try {
      client.close();
    } catch (_) {}
  }
  server.close();
}

process.on('SIGTERM', handleExit);
process.on('SIGINT', handleExit);

startServer();
