import React, { useState, useRef, useEffect } from 'react';
import { CustomGameAssets } from '../types';
import { storage } from '../storage';
import { saveSpriteFramesToDB, getSpriteFramesFromDB, clearSpriteFramesFromDB } from '../utils/spriteDb';

interface AssetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customAssets: CustomGameAssets;
  onUpdateAssets: (newAssets: CustomGameAssets) => void;
  initialTab?: 'sprites' | 'sizes' | 'assets' | 'sheets';
}

export const AssetManagerModal: React.FC<AssetManagerModalProps> = ({
  isOpen,
  onClose,
  customAssets,
  onUpdateAssets,
  initialTab = 'sprites',
}) => {
  const [assets, setAssets] = useState<CustomGameAssets>(customAssets);
  const [activeTab, setActiveTab] = useState<'sprites' | 'sizes' | 'assets' | 'sheets'>(initialTab);

  // Chica preview states
  const [chicaPreviewFrames, setChicaPreviewFrames] = useState<string[]>([]);
  const [chicaPreviewIndex, setChicaPreviewIndex] = useState<number>(0);
  const [chicaIsPlaying, setChicaIsPlaying] = useState<boolean>(true);
  const [chicaLoading, setChicaLoading] = useState<boolean>(false);
  const chicaFileInputRef = useRef<HTMLInputElement>(null);
  const chicaMultiFileInputRef = useRef<HTMLInputElement>(null);

  // Chico preview states
  const [chicoPreviewFrames, setChicoPreviewFrames] = useState<string[]>([]);
  const [chicoPreviewIndex, setChicoPreviewIndex] = useState<number>(0);
  const [chicoIsPlaying, setChicoIsPlaying] = useState<boolean>(true);
  const [chicoLoading, setChicoLoading] = useState<boolean>(false);
  const chicoFileInputRef = useRef<HTMLInputElement>(null);
  const chicoMultiFileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when customAssets prop changes
  useEffect(() => {
    setAssets(customAssets);
  }, [customAssets]);

  // Load existing frames from IndexedDB or defaults on mount
  useEffect(() => {
    if (!isOpen) return;

    // Load Chica frames
    if (customAssets.chicaCustomFrames && customAssets.chicaCustomFrames.length > 0) {
      setChicaPreviewFrames(customAssets.chicaCustomFrames);
    } else {
      getSpriteFramesFromDB('chica').then((frames) => {
        if (frames && frames.length > 0) {
          setChicaPreviewFrames(frames);
        } else {
          // Default 30 frames
          const defs = Array.from({ length: 30 }, (_, i) => `/assets/chica_crop/${String(i).padStart(2, '0')}.png`);
          setChicaPreviewFrames(defs);
        }
      });
    }

    // Load Chico frames
    if (customAssets.chicoCustomFrames && customAssets.chicoCustomFrames.length > 0) {
      setChicoPreviewFrames(customAssets.chicoCustomFrames);
    } else {
      getSpriteFramesFromDB('chico').then((frames) => {
        if (frames && frames.length > 0) {
          setChicoPreviewFrames(frames);
        } else {
          // Default 28 frames
          const defs = Array.from({ length: 28 }, (_, i) => `/assets/chico_crop/${String(i).padStart(2, '0')}.png`);
          setChicoPreviewFrames(defs);
        }
      });
    }
  }, [isOpen, customAssets]);

  // Chica preview animation loop
  useEffect(() => {
    if (!isOpen || !chicaIsPlaying || chicaPreviewFrames.length <= 1) return;
    const fps = assets.chicaFps || 18;
    const interval = window.setInterval(() => {
      setChicaPreviewIndex((prev) => (prev + 1) % chicaPreviewFrames.length);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [isOpen, chicaIsPlaying, chicaPreviewFrames, assets.chicaFps]);

  // Chico preview animation loop
  useEffect(() => {
    if (!isOpen || !chicoIsPlaying || chicoPreviewFrames.length <= 1) return;
    const fps = assets.chicoFps || 18;
    const interval = window.setInterval(() => {
      setChicoPreviewIndex((prev) => (prev + 1) % chicoPreviewFrames.length);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [isOpen, chicoIsPlaying, chicoPreviewFrames, assets.chicoFps]);

  if (!isOpen) return null;

  // Process folder upload or multi-file selection
  const handleSpriteFiles = async (
    character: 'chica' | 'chico',
    fileList: FileList | null
  ) => {
    if (!fileList || fileList.length === 0) return;

    if (character === 'chica') setChicaLoading(true);
    else setChicoLoading(true);

    try {
      // Filter for image files
      const files: File[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
          files.push(file);
        }
      }

      if (files.length === 0) {
        alert('No se encontraron imágenes válidas (.png, .jpg) en la carpeta seleccionada.');
        return;
      }

      // Natural sort by filename (e.g. 00.png, 01.png, 02.png... or frame1, frame2...)
      files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      // Read files to data URLs
      const readers = files.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      });

      const dataUrls = await Promise.all(readers);

      // Save to IndexedDB
      await saveSpriteFramesToDB(character, dataUrls);

      // Update state & parent
      if (character === 'chica') {
        setChicaPreviewFrames(dataUrls);
        setChicaPreviewIndex(0);
        const updated: CustomGameAssets = {
          ...assets,
          enabled: true,
          chicaMode: 'custom_folder',
          chicaCustomFrames: dataUrls,
          useOfficialSheetChica: false,
        };
        setAssets(updated);
        onUpdateAssets(updated);
        storage.saveCustomAssets?.(updated);
      } else {
        setChicoPreviewFrames(dataUrls);
        setChicoPreviewIndex(0);
        const updated: CustomGameAssets = {
          ...assets,
          enabled: true,
          chicoMode: 'custom_folder',
          chicoCustomFrames: dataUrls,
          useOfficialSheetChico: false,
        };
        setAssets(updated);
        onUpdateAssets(updated);
        storage.saveCustomAssets?.(updated);
      }
    } catch (err) {
      console.error('Error procesando carpeta de sprites:', err);
      alert('Error leyendo las imágenes de la carpeta. Por favor verifica que sean archivos PNG o JPG válidos.');
    } finally {
      if (character === 'chica') setChicaLoading(false);
      else setChicoLoading(false);
    }
  };

  const handleUseOfficialCrop = async (character: 'chica' | 'chico') => {
    await clearSpriteFramesFromDB(character);
    if (character === 'chica') {
      const defs = Array.from({ length: 30 }, (_, i) => `/assets/chica_crop/${String(i).padStart(2, '0')}.png`);
      setChicaPreviewFrames(defs);
      setChicaPreviewIndex(0);
      const updated: CustomGameAssets = {
        ...assets,
        chicaMode: 'frames',
        chicaCustomFrames: undefined,
        useOfficialSheetChica: false,
      };
      setAssets(updated);
      onUpdateAssets(updated);
      storage.saveCustomAssets?.(updated);
    } else {
      const defs = Array.from({ length: 28 }, (_, i) => `/assets/chico_crop/${String(i).padStart(2, '0')}.png`);
      setChicoPreviewFrames(defs);
      setChicoPreviewIndex(0);
      const updated: CustomGameAssets = {
        ...assets,
        chicoMode: 'frames',
        chicoCustomFrames: undefined,
        useOfficialSheetChico: false,
      };
      setAssets(updated);
      onUpdateAssets(updated);
      storage.saveCustomAssets?.(updated);
    }
  };

  const handleUseOfficialSheet = (character: 'chica' | 'chico') => {
    if (character === 'chica') {
      const updated: CustomGameAssets = {
        ...assets,
        enabled: true,
        chicaMode: 'sheet',
        useOfficialSheetChica: true,
      };
      setAssets(updated);
      onUpdateAssets(updated);
      storage.saveCustomAssets?.(updated);
    } else {
      const updated: CustomGameAssets = {
        ...assets,
        enabled: true,
        chicoMode: 'sheet',
        useOfficialSheetChico: true,
      };
      setAssets(updated);
      onUpdateAssets(updated);
      storage.saveCustomAssets?.(updated);
    }
  };

  const handleFpsChange = (character: 'chica' | 'chico', fps: number) => {
    const updated: CustomGameAssets = {
      ...assets,
      [character === 'chica' ? 'chicaFps' : 'chicoFps']: fps,
    };
    setAssets(updated);
    onUpdateAssets(updated);
    storage.saveCustomAssets?.(updated);
  };

  const handleScalePreset = (percent: number) => {
    const updated: CustomGameAssets = {
      ...assets,
      characterScalePercent: percent,
      chicaScalePercent: percent,
      chicoScalePercent: percent,
    };
    setAssets(updated);
    onUpdateAssets(updated);
    storage.saveCustomAssets?.(updated);
  };

  const handleAssetUrlChange = (
    key: keyof Pick<CustomGameAssets, 'fondoUrl' | 'sogaUrl' | 'bandanaUrl'>,
    url: string
  ) => {
    const updated = {
      ...assets,
      [key]: url.trim() || undefined,
    };
    setAssets(updated);
    onUpdateAssets(updated);
    storage.saveCustomAssets?.(updated);
  };

  const handleSingleFileUpload = (
    key: keyof Pick<CustomGameAssets, 'fondoUrl' | 'sogaUrl' | 'bandanaUrl'>,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (dataUrl) {
        const updated = {
          ...assets,
          [key]: dataUrl,
          enabled: true,
        };
        setAssets(updated);
        onUpdateAssets(updated);
        storage.saveCustomAssets?.(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetAsset = (key: keyof Pick<CustomGameAssets, 'fondoUrl' | 'sogaUrl' | 'bandanaUrl'>) => {
    const updated = {
      ...assets,
      [key]: undefined,
    };
    setAssets(updated);
    onUpdateAssets(updated);
    storage.saveCustomAssets?.(updated);
  };

  const toggleEnabled = () => {
    const updated = {
      ...assets,
      enabled: !assets.enabled,
    };
    setAssets(updated);
    onUpdateAssets(updated);
    storage.saveCustomAssets?.(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#121520] border-2 border-red-500/40 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.25)] text-white overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-red-950/40 via-neutral-900 to-blue-950/40">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">📁</span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide font-pixel text-white flex items-center gap-2">
                GESTOR DE SPRITES Y ACTIVOS
              </h2>
              <p className="text-xs text-neutral-300">
                Sube carpetas de sprites, ajusta tamaños para que no queden gigantes y controla las animaciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleEnabled}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                assets.enabled
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
            >
              {assets.enabled ? '✓ Activos Activos' : '○ Activos Desactivados'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center font-bold text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-white/10 bg-neutral-950/60 px-4 pt-2 gap-1 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab('sprites')}
            className={`px-4 py-2.5 text-xs font-bold font-pixel rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'sprites'
                ? 'bg-[#121520] text-yellow-300 border-yellow-500/50 border-b-transparent shadow-sm'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            <span>📁</span>
            <span>Subir Carpeta de Sprites</span>
            {(assets.chicaCustomFrames?.length || assets.chicoCustomFrames?.length) ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('sizes')}
            className={`px-4 py-2.5 text-xs font-bold font-pixel rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'sizes'
                ? 'bg-[#121520] text-cyan-300 border-cyan-500/50 border-b-transparent shadow-sm'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            <span>📏</span>
            <span>Ajustar Tamaños (Evitar Gigantes)</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2.5 text-xs font-bold font-pixel rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'assets'
                ? 'bg-[#121520] text-emerald-300 border-emerald-500/50 border-b-transparent shadow-sm'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            <span>🌄</span>
            <span>Fondo, Soga y Bandana</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2.5 text-xs font-bold font-pixel rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'sheets'
                ? 'bg-[#121520] text-purple-300 border-purple-500/50 border-b-transparent shadow-sm'
                : 'text-neutral-400 hover:text-white border-transparent'
            }`}
          >
            <span>🎬</span>
            <span>Sprite Sheets Oficiales</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* ============================================================== */}
          {/* TAB 1: SUBIR CARPETA DE SPRITES (CHICA Y CHICO)                */}
          {/* ============================================================== */}
          {activeTab === 'sprites' && (
            <div className="space-y-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3.5 text-xs text-yellow-200/90 flex items-start gap-2.5">
                <span className="text-lg">💡</span>
                <div>
                  <strong className="text-yellow-300">¿Cómo subir la carpeta de sprites?</strong>
                  <p className="mt-0.5 text-neutral-300">
                    Haz clic en <strong className="text-white">"📂 Subir Carpeta"</strong> y selecciona tu carpeta con los archivos PNG o JPG (por ejemplo <code>00.png, 01.png...</code>). El sistema los ordenará automáticamente y generará la animación en bucle. También puedes usar el botón de múltiples imágenes.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* ---------------- CHICA (TEAM ROJO) ---------------- */}
                <div className="bg-neutral-900/80 border border-red-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        <h3 className="font-pixel text-xs text-red-300 font-bold uppercase">
                          Chica (Team Rojo - Izquierda)
                        </h3>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-200 border border-red-800">
                        {chicaPreviewFrames.length} frames
                      </span>
                    </div>

                    {/* Preview Box */}
                    <div className="h-44 bg-neutral-950 rounded-lg border border-white/10 flex flex-col items-center justify-center relative overflow-hidden p-2">
                      {chicaLoading ? (
                        <div className="flex flex-col items-center gap-2 text-red-400">
                          <span className="animate-spin text-2xl">⏳</span>
                          <span className="text-xs font-mono">Cargando frames...</span>
                        </div>
                      ) : chicaPreviewFrames.length > 0 ? (
                        <>
                          <img
                            src={chicaPreviewFrames[chicaPreviewIndex]}
                            alt={`Chica frame ${chicaPreviewIndex}`}
                            className="max-h-32 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                          />
                          <div className="absolute bottom-1.5 inset-x-2 flex items-center justify-between text-[10px] text-neutral-400 font-mono bg-black/60 px-2 py-0.5 rounded">
                            <span>
                              Frame {chicaPreviewIndex + 1}/{chicaPreviewFrames.length}
                            </span>
                            <button
                              onClick={() => setChicaIsPlaying(!chicaIsPlaying)}
                              className="text-white hover:text-yellow-400 cursor-pointer"
                            >
                              {chicaIsPlaying ? '⏸ Pausar' : '▶ Reproducir'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-neutral-500">Sin frames cargados</span>
                      )}
                    </div>

                    {/* Frame Scrubber */}
                    {chicaPreviewFrames.length > 1 && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-[10px] text-neutral-400">Frame:</span>
                        <input
                          type="range"
                          min="0"
                          max={chicaPreviewFrames.length - 1}
                          value={chicaPreviewIndex}
                          onChange={(e) => {
                            setChicaIsPlaying(false);
                            setChicaPreviewIndex(parseInt(e.target.value, 10));
                          }}
                          className="w-full accent-red-500"
                        />
                      </div>
                    )}

                    {/* FPS Slider */}
                    <div className="mt-2 flex items-center justify-between text-xs text-neutral-300">
                      <span>Velocidad (FPS):</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="6"
                          max="30"
                          value={assets.chicaFps || 18}
                          onChange={(e) => handleFpsChange('chica', parseInt(e.target.value, 10))}
                          className="w-24 accent-red-500"
                        />
                        <span className="font-mono text-[11px] text-red-300 w-8 text-right">
                          {assets.chicaFps || 18} fps
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Upload Actions */}
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                    {/* Folder upload input (webkitdirectory) */}
                    <input
                      ref={chicaFileInputRef}
                      type="file"
                      // @ts-expect-error webkitdirectory is standard for folders in WebKit/Blink/Gecko
                      webkitdirectory=""
                      directory=""
                      multiple
                      className="hidden"
                      onChange={(e) => handleSpriteFiles('chica', e.target.files)}
                    />

                    {/* Multi files upload input */}
                    <input
                      ref={chicaMultiFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSpriteFiles('chica', e.target.files)}
                    />

                    <button
                      onClick={() => chicaFileInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-pixel text-[11px] rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-bold border border-red-400/50"
                    >
                      <span>📂</span>
                      <span>Subir Carpeta de Sprites (Chica)</span>
                    </button>

                    <button
                      onClick={() => chicaMultiFileInputRef.current?.click()}
                      className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                    >
                      <span>🖼️</span>
                      <span>O Seleccionar Imágenes Sueltas</span>
                    </button>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleUseOfficialCrop('chica')}
                        className="flex-1 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-neutral-300 rounded border border-white/10 cursor-pointer"
                        title="Restaurar a los 30 frames de Chica oficiales"
                      >
                        Frames Oficiales (30)
                      </button>
                      <button
                        onClick={() => handleUseOfficialSheet('chica')}
                        className="flex-1 py-1 text-[10px] bg-red-950/60 hover:bg-red-900/60 text-red-300 rounded border border-red-700/50 cursor-pointer"
                        title="Activar chica_sheet.png"
                      >
                        Usar Sprite Sheet
                      </button>
                    </div>
                  </div>
                </div>

                {/* ---------------- CHICO (TEAM AZUL) ---------------- */}
                <div className="bg-neutral-900/80 border border-blue-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                        <h3 className="font-pixel text-xs text-blue-300 font-bold uppercase">
                          Chico (Team Azul - Pose Arrastre)
                        </h3>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-200 border border-blue-800">
                        {chicoPreviewFrames.length} frames
                      </span>
                    </div>

                    {/* Preview Box */}
                    <div className="h-44 bg-neutral-950 rounded-lg border border-white/10 flex flex-col items-center justify-center relative overflow-hidden p-2">
                      {chicoLoading ? (
                        <div className="flex flex-col items-center gap-2 text-blue-400">
                          <span className="animate-spin text-2xl">⏳</span>
                          <span className="text-xs font-mono">Cargando frames...</span>
                        </div>
                      ) : chicoPreviewFrames.length > 0 ? (
                        <>
                          <img
                            src={chicoPreviewFrames[chicoPreviewIndex]}
                            alt={`Chico frame ${chicoPreviewIndex}`}
                            className="max-h-32 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                          />
                          <div className="absolute bottom-1.5 inset-x-2 flex items-center justify-between text-[10px] text-neutral-400 font-mono bg-black/60 px-2 py-0.5 rounded">
                            <span>
                              Frame {chicoPreviewIndex + 1}/{chicoPreviewFrames.length}
                            </span>
                            <button
                              onClick={() => setChicoIsPlaying(!chicoIsPlaying)}
                              className="text-white hover:text-yellow-400 cursor-pointer"
                            >
                              {chicoIsPlaying ? '⏸ Pausar' : '▶ Reproducir'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-neutral-500">Sin frames cargados</span>
                      )}
                    </div>

                    {/* Frame Scrubber */}
                    {chicoPreviewFrames.length > 1 && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-[10px] text-neutral-400">Frame:</span>
                        <input
                          type="range"
                          min="0"
                          max={chicoPreviewFrames.length - 1}
                          value={chicoPreviewIndex}
                          onChange={(e) => {
                            setChicoIsPlaying(false);
                            setChicoPreviewIndex(parseInt(e.target.value, 10));
                          }}
                          className="w-full accent-blue-500"
                        />
                      </div>
                    )}

                    {/* FPS Slider */}
                    <div className="mt-2 flex items-center justify-between text-xs text-neutral-300">
                      <span>Velocidad (FPS):</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="6"
                          max="30"
                          value={assets.chicoFps || 18}
                          onChange={(e) => handleFpsChange('chico', parseInt(e.target.value, 10))}
                          className="w-24 accent-blue-500"
                        />
                        <span className="font-mono text-[11px] text-blue-300 w-8 text-right">
                          {assets.chicoFps || 18} fps
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Upload Actions */}
                  <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                    {/* Folder upload input (webkitdirectory) */}
                    <input
                      ref={chicoFileInputRef}
                      type="file"
                      // @ts-expect-error webkitdirectory is standard for folders in WebKit/Blink/Gecko
                      webkitdirectory=""
                      directory=""
                      multiple
                      className="hidden"
                      onChange={(e) => handleSpriteFiles('chico', e.target.files)}
                    />

                    {/* Multi files upload input */}
                    <input
                      ref={chicoMultiFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSpriteFiles('chico', e.target.files)}
                    />

                    <button
                      onClick={() => chicoFileInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-pixel text-[11px] rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-bold border border-blue-400/50"
                    >
                      <span>📂</span>
                      <span>Subir Carpeta de Sprites (Chico)</span>
                    </button>

                    <button
                      onClick={() => chicoMultiFileInputRef.current?.click()}
                      className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                    >
                      <span>🖼️</span>
                      <span>O Seleccionar Imágenes Sueltas</span>
                    </button>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleUseOfficialCrop('chico')}
                        className="flex-1 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-neutral-300 rounded border border-white/10 cursor-pointer"
                        title="Restaurar a los 28 frames de Chico oficiales"
                      >
                        Frames Oficiales (28)
                      </button>
                      <button
                        onClick={() => handleUseOfficialSheet('chico')}
                        className="flex-1 py-1 text-[10px] bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 rounded border border-blue-700/50 cursor-pointer"
                        title="Activar chico_sheet.png"
                      >
                        Usar Sprite Sheet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: AJUSTE DE TAMAÑOS (SOLUCIÓN "IMÁGENES MUY GRANDES")     */}
          {/* ============================================================== */}
          {activeTab === 'sizes' && (
            <div className="space-y-6">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-xs text-cyan-200">
                <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                  <span>📐</span>
                  <span>Solución para imágenes demasiado grandes</span>
                </h3>
                <p className="mt-1 text-neutral-300">
                  Usa los botones rápidos o los controles deslizantes para ajustar la escala exacta de los personajes, el grosor de la soga y la posición de las manos para que encaje perfectamente con tu pantalla y streaming.
                </p>
              </div>

              {/* Botones Rápidos de Escala */}
              <div className="bg-neutral-900 p-4 rounded-xl border border-white/10 space-y-3">
                <label className="text-xs font-bold text-white uppercase font-pixel">
                  Presets Rápidos de Tamaño de Personajes
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: 'Mini (60%)', val: 60, desc: 'Muy compacto' },
                    { label: 'Normal (75%)', val: 75, desc: 'Recomendado' },
                    { label: 'Medio (90%)', val: 90, desc: 'Moderado' },
                    { label: 'Grande (110%)', val: 110, desc: 'Máximo' },
                  ].map((p) => (
                    <button
                      key={p.val}
                      onClick={() => handleScalePreset(p.val)}
                      className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                        assets.characterScalePercent === p.val
                          ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-neutral-800/60 border-white/10 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">{p.label}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Controles Deslizantes Detallados */}
              <div className="space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-white/10">
                {/* Escala General de Personajes */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span>Escala General de Personajes</span>
                    <span className="font-mono text-cyan-400">{assets.characterScalePercent ?? 75}%</span>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="140"
                    step="5"
                    value={assets.characterScalePercent ?? 75}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const updated = {
                        ...assets,
                        characterScalePercent: val,
                        chicaScalePercent: val,
                        chicoScalePercent: val,
                      };
                      setAssets(updated);
                      onUpdateAssets(updated);
                      storage.saveCustomAssets?.(updated);
                    }}
                    className="w-full accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5">
                    <span>45% (Pequeño)</span>
                    <span>75% (Ideal)</span>
                    <span>140% (Gigante)</span>
                  </div>
                </div>

                {/* Altura de Soga / Manos */}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span>Altura Vertical de Soga y Manos (Alineación)</span>
                    <span className="font-mono text-yellow-400">{assets.handHeightPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="65"
                    step="1"
                    value={assets.handHeightPercent}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const updated = { ...assets, handHeightPercent: val };
                      setAssets(updated);
                      onUpdateAssets(updated);
                      storage.saveCustomAssets?.(updated);
                    }}
                    className="w-full accent-yellow-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5">
                    <span>35% (Más arriba)</span>
                    <span>50% (Centro soga)</span>
                    <span>65% (Más abajo)</span>
                  </div>
                </div>

                {/* Grosor de la Soga */}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span>Grosor de la Soga (píxeles)</span>
                    <span className="font-mono text-emerald-400">{assets.ropeThicknessPx ?? 12}px</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="22"
                    step="1"
                    value={assets.ropeThicknessPx ?? 12}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const updated = { ...assets, ropeThicknessPx: val };
                      setAssets(updated);
                      onUpdateAssets(updated);
                      storage.saveCustomAssets?.(updated);
                    }}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Escala de la Bandana */}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span>Tamaño de la Bandana Central</span>
                    <span className="font-mono text-red-400">{assets.bandanaScalePercent ?? 75}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="140"
                    step="5"
                    value={assets.bandanaScalePercent ?? 75}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const updated = { ...assets, bandanaScalePercent: val };
                      setAssets(updated);
                      onUpdateAssets(updated);
                      storage.saveCustomAssets?.(updated);
                    }}
                    className="w-full accent-red-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: FONDO, SOGA Y BANDANA                                   */}
          {/* ============================================================== */}
          {activeTab === 'assets' && (
            <div className="space-y-5">
              {/* FONDO */}
              <div className="bg-neutral-900 p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase font-pixel text-neutral-200">
                    Capa 1: Fondo de la Arena
                  </label>
                  {assets.fondoUrl && (
                    <button
                      onClick={() => handleResetAsset('fondoUrl')}
                      className="text-[10px] text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Restaurar fondo predeterminado
                    </button>
                  )}
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-24 h-16 bg-neutral-950 rounded border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={assets.fondoUrl || '/assets/fondo.png'}
                      alt="Fondo preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Pega la URL de imagen de fondo..."
                      value={assets.fondoUrl || ''}
                      onChange={(e) => handleAssetUrlChange('fondoUrl', e.target.value)}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded text-xs text-white placeholder-neutral-500 font-mono"
                    />
                    <label className="inline-block px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs rounded border border-white/10 cursor-pointer">
                      <span>📁 Subir Imagen de Fondo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleSingleFileUpload('fondoUrl', e)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* SOGA */}
              <div className="bg-neutral-900 p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase font-pixel text-neutral-200">
                    Capa 2: Soga
                  </label>
                  {assets.sogaUrl && (
                    <button
                      onClick={() => handleResetAsset('sogaUrl')}
                      className="text-[10px] text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Restaurar soga predeterminada
                    </button>
                  )}
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-24 h-16 bg-neutral-950 rounded border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-2">
                    <img
                      src={assets.sogaUrl || '/assets/soga_strip_ext.png'}
                      alt="Soga preview"
                      className="w-full h-4 object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Pega la URL de la soga..."
                      value={assets.sogaUrl || ''}
                      onChange={(e) => handleAssetUrlChange('sogaUrl', e.target.value)}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded text-xs text-white placeholder-neutral-500 font-mono"
                    />
                    <label className="inline-block px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs rounded border border-white/10 cursor-pointer">
                      <span>📁 Subir Imagen de Soga</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleSingleFileUpload('sogaUrl', e)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* BANDANA */}
              <div className="bg-neutral-900 p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase font-pixel text-neutral-200">
                    Capa 3: Bandana (Nudo Rojo)
                  </label>
                  {assets.bandanaUrl && (
                    <button
                      onClick={() => handleResetAsset('bandanaUrl')}
                      className="text-[10px] text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Restaurar bandana predeterminada
                    </button>
                  )}
                </div>
                <div className="flex gap-3 items-center">
                  <div className="w-24 h-16 bg-neutral-950 rounded border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-2">
                    <img
                      src={assets.bandanaUrl || '/assets/bandana_crop.png'}
                      alt="Bandana preview"
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Pega la URL de la bandana..."
                      value={assets.bandanaUrl || ''}
                      onChange={(e) => handleAssetUrlChange('bandanaUrl', e.target.value)}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded text-xs text-white placeholder-neutral-500 font-mono"
                    />
                    <label className="inline-block px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs rounded border border-white/10 cursor-pointer">
                      <span>📁 Subir Imagen de Bandana</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleSingleFileUpload('bandanaUrl', e)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: SPRITE SHEETS OFICIALES                                 */}
          {/* ============================================================== */}
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-xs text-purple-200">
                <h3 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                  <span>🎬</span>
                  <span>Sprite Sheets Incluidos</span>
                </h3>
                <p className="mt-1 text-neutral-300">
                  El juego ya tiene integrados los Sprite Sheets horizontales de alta definición:
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1 font-mono text-[11px] text-purple-200">
                  <li><code>/assets/chica_sheet.png</code> (7680x459 px, 30 frames de 256x459 px)</li>
                  <li><code>/assets/chico_sheet.png</code> (7168x459 px, 28 frames de 256x459 px)</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-neutral-900 p-4 rounded-xl border border-red-500/30 space-y-3">
                  <h4 className="font-pixel text-xs text-red-300 font-bold">Chica Sheet</h4>
                  <div className="h-20 bg-neutral-950 rounded border border-white/10 overflow-hidden flex items-center">
                    <img src="/assets/chica_sheet.png" alt="Chica sheet" className="w-full h-auto object-cover" />
                  </div>
                  <button
                    onClick={() => handleUseOfficialSheet('chica')}
                    className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-pixel text-xs rounded-lg cursor-pointer"
                  >
                    Activar Chica Sprite Sheet
                  </button>
                </div>

                <div className="bg-neutral-900 p-4 rounded-xl border border-blue-500/30 space-y-3">
                  <h4 className="font-pixel text-xs text-blue-300 font-bold">Chico Sheet (Pose Arrastre)</h4>
                  <div className="h-20 bg-neutral-950 rounded border border-white/10 overflow-hidden flex items-center">
                    <img src="/assets/chico_sheet.png" alt="Chico sheet" className="w-full h-auto object-cover" />
                  </div>
                  <button
                    onClick={() => handleUseOfficialSheet('chico')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-pixel text-xs rounded-lg cursor-pointer"
                  >
                    Activar Chico Sprite Sheet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10 bg-neutral-950/80 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400">
            {assets.enabled ? (
              <span className="text-emerald-400 font-bold">✓ Modo personalizado activo</span>
            ) : (
              <span>Modo por defecto activo</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-pixel text-xs font-bold rounded-lg shadow-lg cursor-pointer transition-all"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
