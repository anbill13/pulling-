import { StorageAdapter, CustomGameAssets } from './types';

export const STORAGE_KEY_DIAMONDS_PREFIX = 'tya_user_diamonds_';
export const STORAGE_KEY_SERIES_WINS = 'tya_series_wins';
export const STORAGE_KEY_CUSTOM_ASSETS = 'tya_custom_assets';
export const STORAGE_PROBE_KEY = '__tya_storage_test_probe__';

export const DEFAULT_CUSTOM_ASSETS: CustomGameAssets = {
  enabled: false,
  handHeightPercent: 50,
  characterScalePercent: 100, // Escala grande y visible hasta el límite de victoria
  chicaScalePercent: 100,
  chicoScalePercent: 100,
  chicaPositionPercent: 8, // Alejado cómodamente de la meta, ajustable
  chicoPositionPercent: 8,
  ropeHeightPercent: 50, // Altura vertical independiente de la cuerda (arriba y abajo)
  ropeOffsetYPx: 0,
  characterHeightPercent: 50, // Altura vertical independiente de los personajes
  chicaHeightPercent: 50,
  chicoHeightPercent: 50,
  semaphoreHeightPercent: 32, // Altura vertical independiente de los semáforos (arriba y abajo)
  semaphoreLeftHeightPercent: 32,
  semaphoreRightHeightPercent: 32,
  metaRojoPercent: 34, // Línea de meta independiente para rojo
  metaAzulPercent: 66, // Línea de meta independiente para azul
  showMetaLines: true, // Visibilidad de las líneas de meta (permite ocultarlas)
  difficultyMode: 'hard', // Modo competitivo difícil por defecto
  pointScaleMultiplier: 0.35, // Menos puntos y empuje para mayor esfuerzo competitivo
  ropeWidthPercent: 160, // Extensión/ancho de la soga (permite encogerla)
  ropeThicknessPx: 14,
  bandanaScalePercent: 85,
  bandanaOffsetYPx: 0, // Desplazamiento vertical para subir o bajar la bandana
  pilaresUrl: undefined,
  referenceImageUrl: undefined,
  referenceOpacity: 50,
  referenceVisible: false,
  chicaMode: 'frames',
  chicoMode: 'frames',
  chicaFps: 18,
  chicoFps: 18,
};

export interface StorageValidationResult {
  isAvailable: boolean;
  mode: 'localStorage' | 'memory';
  initialSeriesWins: { rojo: number; azul: number };
  message: string;
}

/**
 * In-memory fallback adapter when localStorage is blocked (e.g. private browsing,
 * iframe cookie restrictions, or disabled storage).
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private memoryMap = new Map<string, string>();
  private seriesWins = { rojo: 0, azul: 0 };
  private customAssets: CustomGameAssets = { ...DEFAULT_CUSTOM_ASSETS };

  getLifetimeDiamonds(username: string): number {
    const key = STORAGE_KEY_DIAMONDS_PREFIX + username.toLowerCase().trim();
    const val = this.memoryMap.get(key);
    return val ? parseInt(val, 10) || 0 : 0;
  }

  saveLifetimeDiamonds(username: string, diamonds: number): void {
    const key = STORAGE_KEY_DIAMONDS_PREFIX + username.toLowerCase().trim();
    this.memoryMap.set(key, Math.max(0, diamonds).toString());
  }

  getSeriesWins(): { rojo: number; azul: number } {
    return { ...this.seriesWins };
  }

  saveSeriesWins(wins: { rojo: number; azul: number }): void {
    this.seriesWins = {
      rojo: typeof wins?.rojo === 'number' && !isNaN(wins.rojo) ? Math.max(0, wins.rojo) : 0,
      azul: typeof wins?.azul === 'number' && !isNaN(wins.azul) ? Math.max(0, wins.azul) : 0,
    };
  }

  getCustomAssets(): CustomGameAssets {
    return { ...this.customAssets };
  }

  saveCustomAssets(assets: CustomGameAssets): void {
    this.customAssets = { ...assets };
  }
}

/**
 * Default LocalStorage Adapter with robust error handling (try/catch).
 */
export class LocalStorageAdapter implements StorageAdapter {
  getLifetimeDiamonds(username: string): number {
    try {
      const key = STORAGE_KEY_DIAMONDS_PREFIX + username.toLowerCase().trim();
      const val = window.localStorage.getItem(key);
      const parsed = val ? parseInt(val, 10) : 0;
      return typeof parsed === 'number' && !isNaN(parsed) ? Math.max(0, parsed) : 0;
    } catch (_e) {
      return 0;
    }
  }

  saveLifetimeDiamonds(username: string, diamonds: number): void {
    try {
      const key = STORAGE_KEY_DIAMONDS_PREFIX + username.toLowerCase().trim();
      window.localStorage.setItem(key, Math.max(0, diamonds).toString());
    } catch (_e) {
      // Inaccessible or quota reached
    }
  }

  getSeriesWins(): { rojo: number; azul: number } {
    try {
      const val = window.localStorage.getItem(STORAGE_KEY_SERIES_WINS);
      if (val) {
        const parsed = JSON.parse(val);
        const rojo = typeof parsed?.rojo === 'number' && !isNaN(parsed.rojo) ? Math.max(0, parsed.rojo) : 0;
        const azul = typeof parsed?.azul === 'number' && !isNaN(parsed.azul) ? Math.max(0, parsed.azul) : 0;
        return { rojo, azul };
      }
    } catch (_e) {
      // Fallback
    }
    return { rojo: 0, azul: 0 };
  }

  saveSeriesWins(wins: { rojo: number; azul: number }): void {
    try {
      const sanitized = {
        rojo: typeof wins?.rojo === 'number' && !isNaN(wins.rojo) ? Math.max(0, wins.rojo) : 0,
        azul: typeof wins?.azul === 'number' && !isNaN(wins.azul) ? Math.max(0, wins.azul) : 0,
      };
      window.localStorage.setItem(STORAGE_KEY_SERIES_WINS, JSON.stringify(sanitized));
    } catch (_e) {
      // Inaccessible or quota reached
    }
  }

  getCustomAssets(): CustomGameAssets {
    try {
      const val = window.localStorage.getItem(STORAGE_KEY_CUSTOM_ASSETS);
      if (val) {
        const parsed = JSON.parse(val);
        return {
          ...DEFAULT_CUSTOM_ASSETS,
          ...parsed,
        };
      }
    } catch (_e) {
      // Fallback
    }
    return { ...DEFAULT_CUSTOM_ASSETS };
  }

  saveCustomAssets(assets: CustomGameAssets): void {
    try {
      const lightCopy = { ...assets };
      if (lightCopy.chicaCustomFrames && lightCopy.chicaCustomFrames.length > 3) {
        delete lightCopy.chicaCustomFrames;
      }
      if (lightCopy.chicoCustomFrames && lightCopy.chicoCustomFrames.length > 3) {
        delete lightCopy.chicoCustomFrames;
      }
      window.localStorage.setItem(STORAGE_KEY_CUSTOM_ASSETS, JSON.stringify(lightCopy));
    } catch (_e) {
      // Inaccessible or quota reached
    }
  }
}

let activeAdapter: StorageAdapter = new LocalStorageAdapter();

/**
 * Comprehensive probe utility to validate storage accessibility and data integrity
 * before the match starts, falling back gracefully to memory adapter if inaccessible.
 */
export function validateStoragePersistence(): StorageValidationResult {
  const defaultWins = { rojo: 0, azul: 0 };

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      activeAdapter = new MemoryStorageAdapter();
      return {
        isAvailable: false,
        mode: 'memory',
        initialSeriesWins: defaultWins,
        message: 'localStorage no disponible en este entorno. Usando persistencia en memoria.',
      };
    }

    // Write-read-delete canary probe to test access and permissions
    window.localStorage.setItem(STORAGE_PROBE_KEY, 'probe_test_ok');
    const probeVal = window.localStorage.getItem(STORAGE_PROBE_KEY);
    window.localStorage.removeItem(STORAGE_PROBE_KEY);

    if (probeVal !== 'probe_test_ok') {
      throw new Error('Canary probe test failed');
    }

    // Validate existing series wins
    const existingWins = activeAdapter.getSeriesWins();

    return {
      isAvailable: true,
      mode: 'localStorage',
      initialSeriesWins: existingWins,
      message: 'localStorage verificado correctamente.',
    };
  } catch (err: any) {
    // Storage is blocked or restricted (e.g. cross-origin iframe security restrictions or private browsing)
    activeAdapter = new MemoryStorageAdapter();
    return {
      isAvailable: false,
      mode: 'memory',
      initialSeriesWins: defaultWins,
      message: `localStorage inaccesible (${err?.message || 'bloqueado'}). Modo fallback en memoria activado.`,
    };
  }
}

/**
 * Delegating storage provider instance. Automatically delegates to activeAdapter.
 */
export const storage: StorageAdapter = {
  getLifetimeDiamonds: (user: string) => activeAdapter.getLifetimeDiamonds(user),
  saveLifetimeDiamonds: (user: string, d: number) => activeAdapter.saveLifetimeDiamonds(user, d),
  getSeriesWins: () => activeAdapter.getSeriesWins(),
  saveSeriesWins: (wins) => activeAdapter.saveSeriesWins(wins),
  getCustomAssets: () => (activeAdapter.getCustomAssets ? activeAdapter.getCustomAssets() : { ...DEFAULT_CUSTOM_ASSETS }),
  saveCustomAssets: (assets: CustomGameAssets) => activeAdapter.saveCustomAssets && activeAdapter.saveCustomAssets(assets),
};
