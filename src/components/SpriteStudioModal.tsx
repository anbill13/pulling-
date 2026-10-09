import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CustomGameAssets } from '../types';
import { naturalSortFiles, readFileAsDataUrl, sliceSpriteSheet } from '../utils/spriteSlicer';
import { saveSpriteFramesToDB } from '../utils/spriteDb';
import { calibrateElementsWithReference, CalibrationResult } from '../utils/referenceCalibrator';

interface SpriteStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  customAssets: CustomGameAssets;
  onSaveAssets: (assets: CustomGameAssets) => void;
  onResetAssets: () => void;
}

type TabType = 'reference' | 'static' | 'chica' | 'chico' | 'calibration';

export const SpriteStudioModal: React.FC<SpriteStudioModalProps> = ({
  isOpen,
  onClose,
  customAssets,
  onSaveAssets,
  onResetAssets,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('reference');
  const [assets, setAssets] = useState<CustomGameAssets>(customAssets);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationToast, setCalibrationToast] = useState<string | null>(null);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);

  // Sincronizar estado local cuando se abra el modal
  useEffect(() => {
    setAssets(customAssets);
  }, [customAssets, isOpen]);

  // Manejador de guardado instantáneo y persistencia
  const updateAssets = useCallback(
    (updater: (prev: CustomGameAssets) => CustomGameAssets) => {
      setAssets((prev) => {
        const next = updater(prev);
        onSaveAssets(next);
        return next;
      });
    },
    [onSaveAssets]
  );

  // Ejecuta la calibración y auto-escalado contra la imagen de referencia
  const runAutoCalibration = useCallback(async (): Promise<CustomGameAssets | null> => {
    if (!assets.referenceImageUrl) return null;

    setIsCalibrating(true);
    setCalibrationToast('Analizando imagen de referencia y escalando elementos...');
    try {
      const chicaFirstFrame = assets.chicaCustomFrames?.[0] || '/assets/chica_crop/00.png';
      const chicoFirstFrame = assets.chicoCustomFrames?.[0] || '/assets/chico_crop/00.png';

      const result = await calibrateElementsWithReference({
        referenceImageUrl: assets.referenceImageUrl,
        chicaFrameUrl: chicaFirstFrame,
        chicoFrameUrl: chicoFirstFrame,
        sogaUrl: assets.sogaUrl || '/assets/soga_strip_ext.png',
        bandanaUrl: assets.bandanaUrl || '/assets/bandana_crop.png',
      });

      setCalibrationResult(result);

      const calibratedAssets: CustomGameAssets = {
        ...assets,
        enabled: true,
        handHeightPercent: result.handHeightPercent,
        ropeHeightPercent: assets.ropeHeightPercent ?? result.handHeightPercent,
        characterHeightPercent: assets.characterHeightPercent ?? result.handHeightPercent,
        chicaHeightPercent: assets.chicaHeightPercent ?? result.handHeightPercent,
        chicoHeightPercent: assets.chicoHeightPercent ?? result.handHeightPercent,
        characterScalePercent: result.characterScalePercent,
        chicaScalePercent: result.chicaScalePercent,
        chicoScalePercent: result.chicoScalePercent,
        bandanaScalePercent: result.bandanaScalePercent,
        ropeThicknessPx: result.ropeThicknessPx,
      };

      setAssets(calibratedAssets);
      onSaveAssets(calibratedAssets);

      setCalibrationToast(
        `✓ Elementos escalados con éxito: Chica ${result.chicaScalePercent}%, Chico ${result.chicoScalePercent}%, Altura ${result.handHeightPercent}%, Soga ${result.ropeThicknessPx}px`
      );

      setTimeout(() => {
        setCalibrationToast(null);
      }, 5000);

      return calibratedAssets;
    } catch (err) {
      console.error('Error al calibrar con la referencia:', err);
      setCalibrationToast('No se pudo analizar la imagen de referencia para el escalado automático.');
      setTimeout(() => setCalibrationToast(null), 4000);
      return null;
    } finally {
      setIsCalibrating(false);
    }
  }, [assets, onSaveAssets]);

  // Al hacer clic en Guardar: si hay imagen de referencia, calibra y escala los elementos automáticamente
  const handleSaveAndClose = async () => {
    if (assets.referenceImageUrl) {
      await runAutoCalibration();
    } else {
      onSaveAssets(assets);
    }
    setTimeout(() => {
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0e0f17] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 font-sans">
        {/* ENCABEZADO */}
        <div className="p-4 sm:px-6 bg-[#141522] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-red-500 flex items-center justify-center text-lg shadow-lg">
              🎨
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Estudio de Sprites, Activos y Referencia
              </h2>
              <p className="text-xs text-neutral-400">
                Sube tu arte de referencia, elementos estáticos y administra los fotogramas en loop de los personajes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {assets.referenceImageUrl && (
              <button
                onClick={() => runAutoCalibration()}
                disabled={isCalibrating}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all border border-purple-400/40 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Ajusta y escala todos los elementos automáticamente para que coincidan con la imagen de referencia"
              >
                <span>{isCalibrating ? '⏳' : '✨'}</span>
                <span className="hidden sm:inline">Auto-Escalar a Referencia</span>
              </button>
            )}

            <button
              onClick={handleSaveAndClose}
              disabled={isCalibrating}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors border border-emerald-400/30 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>💾</span>
              <span>Guardar</span>
            </button>

            <button
              onClick={onClose}
              className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg transition-colors border border-white/10 cursor-pointer"
              title="Cerrar sin calibrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* NOTIFICACIÓN / TOAST DE CALIBRACIÓN */}
        {calibrationToast && (
          <div className="bg-purple-950/90 border-b border-purple-500/40 px-4 py-2 text-xs font-medium text-purple-200 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <span>✨</span>
              <span>{calibrationToast}</span>
            </div>
            <button
              onClick={() => setCalibrationToast(null)}
              className="text-purple-400 hover:text-white font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="flex border-b border-white/10 px-4 pt-2.5 bg-[#10111d] text-xs font-semibold gap-1.5 overflow-x-auto select-none">
          <TabButton
            active={activeTab === 'reference'}
            onClick={() => setActiveTab('reference')}
            icon="🖼️"
            label="Imagen de Referencia"
            badge={assets.referenceImageUrl ? 'Cargada' : undefined}
          />
          <TabButton
            active={activeTab === 'static'}
            onClick={() => setActiveTab('static')}
            icon="🧩"
            label="Elementos Estáticos"
          />
          <TabButton
            active={activeTab === 'chica'}
            onClick={() => setActiveTab('chica')}
            icon="👧"
            label="Chica Rojo (Sprites)"
            badge={`${assets.chicaCustomFrames?.length ?? 30} cuadros`}
          />
          <TabButton
            active={activeTab === 'chico'}
            onClick={() => setActiveTab('chico')}
            icon="👦"
            label="Chico Azul (Sprites)"
            badge={`${assets.chicoCustomFrames?.length ?? 28} cuadros`}
          />
          <TabButton
            active={activeTab === 'calibration'}
            onClick={() => setActiveTab('calibration')}
            icon="📏"
            label="Calibración & Escalas"
          />
        </div>

        {/* CONTENIDO PRINCIPAL POR PESTAÑA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'reference' && (
            <ReferenceTab
              assets={assets}
              updateAssets={updateAssets}
              onAutoCalibrate={runAutoCalibration}
              isCalibrating={isCalibrating}
              calibrationResult={calibrationResult}
            />
          )}

          {activeTab === 'static' && (
            <StaticElementsTab
              assets={assets}
              updateAssets={updateAssets}
            />
          )}

          {activeTab === 'chica' && (
            <CharacterSpriteManagerTab
              teamName="Team Rojo"
              characterName="Chica"
              characterRole="Capitana Izquierda"
              defaultFrameCount={30}
              officialFramesPath="/assets/chica_crop"
              customFrames={assets.chicaCustomFrames}
              fps={assets.chicaFps ?? 18}
              scalePercent={assets.chicaScalePercent ?? assets.characterScalePercent ?? 75}
              onUpdateFrames={(frames) => {
                saveSpriteFramesToDB('chica', frames);
                updateAssets((prev) => ({
                  ...prev,
                  enabled: true,
                  chicaCustomFrames: frames,
                }));
              }}
              onUpdateFps={(fps) =>
                updateAssets((prev) => ({ ...prev, chicaFps: fps }))
              }
              onUpdateScale={(scale) =>
                updateAssets((prev) => ({ ...prev, chicaScalePercent: scale }))
              }
              onResetOfficial={() => {
                saveSpriteFramesToDB('chica', []);
                updateAssets((prev) => ({ ...prev, chicaCustomFrames: undefined }));
              }}
            />
          )}

          {activeTab === 'chico' && (
            <CharacterSpriteManagerTab
              teamName="Team Azul"
              characterName="Chico"
              characterRole="Capitán Derecha (Pose Arrastre)"
              defaultFrameCount={28}
              officialFramesPath="/assets/chico_crop"
              customFrames={assets.chicoCustomFrames}
              fps={assets.chicoFps ?? 18}
              scalePercent={assets.chicoScalePercent ?? assets.characterScalePercent ?? 75}
              onUpdateFrames={(frames) => {
                saveSpriteFramesToDB('chico', frames);
                updateAssets((prev) => ({
                  ...prev,
                  enabled: true,
                  chicoCustomFrames: frames,
                }));
              }}
              onUpdateFps={(fps) =>
                updateAssets((prev) => ({ ...prev, chicoFps: fps }))
              }
              onUpdateScale={(scale) =>
                updateAssets((prev) => ({ ...prev, chicoScalePercent: scale }))
              }
              onResetOfficial={() => {
                saveSpriteFramesToDB('chico', []);
                updateAssets((prev) => ({ ...prev, chicoCustomFrames: undefined }));
              }}
            />
          )}

          {activeTab === 'calibration' && (
            <CalibrationTab
              assets={assets}
              updateAssets={updateAssets}
              onResetAll={onResetAssets}
            />
          )}
        </div>

        {/* PIE DE PÁGINA INFORMATIVO */}
        <div className="p-3.5 bg-[#141522] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Los cambios se aplican y guardan automáticamente en vivo</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-white">
              <input
                type="checkbox"
                checked={assets.enabled}
                onChange={(e) =>
                  updateAssets((prev) => ({ ...prev, enabled: e.target.checked }))
                }
                className="w-4 h-4 rounded text-red-500 focus:ring-red-500"
              />
              <span>Activar Activos Personalizados</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* PESTAÑA 1: IMAGEN DE REFERENCIA & OVERLAY                                  */
/* -------------------------------------------------------------------------- */
interface ReferenceTabProps {
  assets: CustomGameAssets;
  updateAssets: (updater: (prev: CustomGameAssets) => CustomGameAssets) => void;
  onAutoCalibrate?: () => void;
  isCalibrating?: boolean;
  calibrationResult?: CalibrationResult | null;
}

const ReferenceTab: React.FC<ReferenceTabProps> = ({
  assets,
  updateAssets,
  onAutoCalibrate,
  isCalibrating,
  calibrationResult,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateAssets((prev) => ({
        ...prev,
        enabled: true,
        referenceImageUrl: dataUrl,
        referenceVisible: true,
      }));
    } catch (err) {
      console.error('Error al subir imagen de referencia:', err);
    }
  };

  const handleRemove = () => {
    updateAssets((prev) => ({
      ...prev,
      referenceImageUrl: undefined,
      referenceVisible: false,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#151624] p-4.5 rounded-xl border border-white/10 flex flex-col md:flex-row gap-5 items-start justify-between">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>🖼️</span> Subir Imagen de Referencia (Mockup Completo)
          </h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Sube el diseño o captura completa de cómo debe quedar el juego con todos los elementos juntos.
            Al subir elementos y hacer clic en <strong>Guardar</strong> (o en <strong>Auto-Escalar</strong>),
            el sistema analizará esta imagen para escalar y posicionar automáticamente a los personajes, la soga
            y las manos a las proporciones de tu arte.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>📁</span>
              <span>{assets.referenceImageUrl ? 'Cambiar Imagen de Referencia' : 'Subir Imagen de Referencia'}</span>
            </button>

            {assets.referenceImageUrl && onAutoCalibrate && (
              <button
                onClick={onAutoCalibrate}
                disabled={isCalibrating}
                className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{isCalibrating ? '⏳' : '✨'}</span>
                <span>Auto-Escalar Elementos a la Referencia</span>
              </button>
            )}

            {assets.referenceImageUrl && (
              <button
                onClick={handleRemove}
                className="px-3 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-semibold rounded-lg transition-colors border border-red-500/30 cursor-pointer"
              >
                Eliminar Referencia
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* CONTROLES DE OVERLAY */}
        <div className="bg-[#1c1d2e] p-4 rounded-xl border border-white/10 w-full md:w-64 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Superposición en Arena</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(assets.referenceVisible && assets.referenceImageUrl)}
                disabled={!assets.referenceImageUrl}
                onChange={(e) =>
                  updateAssets((prev) => ({ ...prev, referenceVisible: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
            </label>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Opacidad:</span>
              <span className="font-mono text-purple-300 font-bold">{assets.referenceOpacity ?? 50}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={assets.referenceOpacity ?? 50}
              onChange={(e) =>
                updateAssets((prev) => ({
                  ...prev,
                  referenceOpacity: parseInt(e.target.value, 10),
                }))
              }
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          <p className="text-[10px] text-neutral-400 leading-tight">
            Consejo: ajusta la opacidad al 50% para ver la arena y tu referencia al mismo tiempo.
          </p>
        </div>
      </div>

      {/* TARJETA DE ESTADO DE CALIBRACIÓN */}
      {assets.referenceImageUrl && (
        <div className="bg-[#12131e] p-4 rounded-xl border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                <span>✨</span> Auto-Escalado a la Referencia Activado
              </span>
              <span className="text-[10px] font-mono bg-purple-950 px-2 py-0.5 rounded text-purple-300 border border-purple-500/40">
                Se recalibra al Guardar
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Escala Chica: <strong className="text-white font-mono">{assets.chicaScalePercent ?? 75}%</strong> ·
              Escala Chico: <strong className="text-white font-mono">{assets.chicoScalePercent ?? 75}%</strong> ·
              Altura Manos: <strong className="text-white font-mono">{assets.handHeightPercent}%</strong> ·
              Grosor Soga: <strong className="text-white font-mono">{assets.ropeThicknessPx ?? 12}px</strong>
            </p>
          </div>

          {calibrationResult && (
            <div className="text-[11px] text-neutral-400 max-w-xs text-right">
              {calibrationResult.details.slice(0, 2).map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VISTA PREVIA DE LA IMAGEN DE REFERENCIA */}
      {assets.referenceImageUrl ? (
        <div className="space-y-2">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Vista Previa del Mockup de Referencia
          </span>
          <div className="relative rounded-xl border border-white/15 overflow-hidden bg-black/60 max-h-[360px] flex items-center justify-center p-2">
            <img
              src={assets.referenceImageUrl}
              alt="Referencia de composición"
              className="max-h-[340px] w-auto object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-10 border-2 border-dashed border-white/15 hover:border-purple-500/50 rounded-xl bg-[#141522]/50 text-center cursor-pointer transition-colors"
        >
          <div className="text-4xl mb-2">🖼️</div>
          <p className="text-sm font-semibold text-white">Haz clic aquí para subir tu imagen de referencia</p>
          <p className="text-xs text-neutral-400 mt-1">Formatos soportados: PNG, JPG, WebP</p>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* PESTAÑA 2: ELEMENTOS ESTÁTICOS (FONDO, PILARES, SOGA, BANDANA)              */
/* -------------------------------------------------------------------------- */
interface StaticElementsTabProps {
  assets: CustomGameAssets;
  updateAssets: (updater: (prev: CustomGameAssets) => CustomGameAssets) => void;
}

const StaticElementsTab: React.FC<StaticElementsTabProps> = ({ assets, updateAssets }) => {
  return (
    <div className="space-y-5">
      <div className="bg-[#151624] p-4 rounded-xl border border-white/10">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>🧩</span> Subir Partes Individuales Estáticas
        </h3>
        <p className="text-xs text-neutral-300 mt-1">
          Cada uno de estos elementos es estático y se renderiza en su capa correspondiente según la arquitectura Z-Index.
          Puedes subir cada archivo individualmente en formato PNG transparente.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CAPA 1: FONDO */}
        <StaticPartCard
          layer="Capa 1 (z-index: 1)"
          title="Fondo del Escenario"
          description="Cielo, montañas y abismo que cubren la pantalla completa."
          currentUrl={assets.fondoUrl || '/assets/fondo.png'}
          isCustom={Boolean(assets.fondoUrl)}
          onUpload={(url) => updateAssets((prev) => ({ ...prev, enabled: true, fondoUrl: url }))}
          onReset={() => updateAssets((prev) => ({ ...prev, fondoUrl: undefined }))}
        />

        {/* CAPA 1.5: PILARES / BASES */}
        <StaticPartCard
          layer="Capa 1.5 (z-index: 2)"
          title="Pilares o Bases"
          description="Las plataformas rocosas sobre las que se apoyan los pies de los personajes."
          currentUrl={assets.pilaresUrl || ''}
          isCustom={Boolean(assets.pilaresUrl)}
          placeholderText="Opcional: Si tu fondo ya incluye las plataformas, puedes dejar esto vacío."
          onUpload={(url) => updateAssets((prev) => ({ ...prev, enabled: true, pilaresUrl: url }))}
          onReset={() => updateAssets((prev) => ({ ...prev, pilaresUrl: undefined }))}
        />

        {/* CAPA 2: SOGA */}
        <StaticPartCard
          layer="Capa 2 (z-index: 3)"
          title="Soga (Cuerda)"
          description="Tira horizontal de cuerda que se desplaza suavemente al halar."
          currentUrl={assets.sogaUrl || '/assets/soga_strip_ext.png'}
          isCustom={Boolean(assets.sogaUrl)}
          onUpload={(url) => updateAssets((prev) => ({ ...prev, enabled: true, sogaUrl: url }))}
          onReset={() => updateAssets((prev) => ({ ...prev, sogaUrl: undefined }))}
        />

        {/* CAPA 3: BANDANA */}
        <StaticPartCard
          layer="Capa 3 (z-index: 4)"
          title="Bandana (Pañuelo Central)"
          description="El pañuelo o lazo fijado en el centro exacto de la soga."
          currentUrl={assets.bandanaUrl || '/assets/bandana_crop.png'}
          isCustom={Boolean(assets.bandanaUrl)}
          onUpload={(url) => updateAssets((prev) => ({ ...prev, enabled: true, bandanaUrl: url }))}
          onReset={() => updateAssets((prev) => ({ ...prev, bandanaUrl: undefined }))}
        />
      </div>
    </div>
  );
};

/* Tarjeta individual para un elemento estático */
const StaticPartCard: React.FC<{
  layer: string;
  title: string;
  description: string;
  currentUrl: string;
  isCustom: boolean;
  placeholderText?: string;
  onUpload: (url: string) => void;
  onReset: () => void;
}> = ({ layer, title, description, currentUrl, isCustom, placeholderText, onUpload, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onUpload(dataUrl);
    } catch (err) {
      console.error('Error al subir imagen:', err);
    }
  };

  return (
    <div className="bg-[#151624] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-center justify-between text-[11px] text-purple-400 font-mono mb-1">
          <span>{layer}</span>
          {isCustom && <span className="text-emerald-400 font-sans font-bold">Personalizado</span>}
        </div>
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-neutral-400 mt-0.5">{description}</p>
      </div>

      {/* Miniatura */}
      <div className="h-28 bg-black/60 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden p-2">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={title}
            className="max-h-full max-w-full object-contain drop-shadow"
          />
        ) : (
          <span className="text-[11px] text-neutral-500 text-center px-3">
            {placeholderText || 'Sin imagen personalizada'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg transition-colors border border-white/10 cursor-pointer text-center"
        >
          {isCustom ? 'Reemplazar' : 'Subir Archivo'}
        </button>

        {isCustom && (
          <button
            onClick={onReset}
            className="py-1.5 px-2.5 bg-red-950/50 hover:bg-red-900/60 text-red-300 text-xs rounded-lg transition-colors border border-red-500/20 cursor-pointer"
            title="Restablecer original"
          >
            Restaurar
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/webp,image/jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* PESTAÑA 3 & 4: MANEJADOR DE FOTOGRAMAS Y SPRITES EN LOOP (CHICA & CHICO)   */
/* -------------------------------------------------------------------------- */
interface CharacterSpriteManagerProps {
  teamName: string;
  characterName: string;
  characterRole: string;
  defaultFrameCount: number;
  officialFramesPath: string; // e.g. '/assets/chica_crop'
  customFrames?: string[];
  fps: number;
  scalePercent: number;
  onUpdateFrames: (frames: string[]) => void;
  onUpdateFps: (fps: number) => void;
  onUpdateScale: (scale: number) => void;
  onResetOfficial: () => void;
}

const CharacterSpriteManagerTab: React.FC<CharacterSpriteManagerProps> = ({
  teamName,
  characterName,
  characterRole,
  defaultFrameCount,
  officialFramesPath,
  customFrames,
  fps,
  scalePercent,
  onUpdateFrames,
  onUpdateFps,
  onUpdateScale,
  onResetOfficial,
}) => {
  // Cuadros activos: los customizados si existen, o los oficiales por defecto
  const activeFrames =
    customFrames && customFrames.length > 0
      ? customFrames
      : Array.from(
          { length: defaultFrameCount },
          (_, i) => `${officialFramesPath}/${String(i).padStart(2, '0')}.png`
        );

  const totalFrames = activeFrames.length;

  // Estado del reproductor y scrubber
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [uploadMode, setUploadMode] = useState<'folder_multiple' | 'sprite_sheet'>('folder_multiple');

  // Configuración de Sprite Sheet continuo
  const [sheetColumns, setSheetColumns] = useState<number>(totalFrames);
  const [sheetRows, setSheetRows] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Referencias a inputs de archivos
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const sheetFileInputRef = useRef<HTMLInputElement>(null);

  // Loop de reproducción interactiva de fotogramas
  useEffect(() => {
    if (!isPlaying || totalFrames <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % totalFrames);
    }, 1000 / Math.max(1, fps));

    return () => clearInterval(interval);
  }, [isPlaying, totalFrames, fps]);

  // Manejo de subida de múltiples archivos sueltos (carpeta o selección múltiple)
  const handleMultipleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    try {
      const sortedFiles = naturalSortFiles(Array.from(fileList));
      const readPromises = sortedFiles.map((f) => readFileAsDataUrl(f));
      const dataUrls = await Promise.all(readPromises);
      onUpdateFrames(dataUrls);
      setCurrentFrameIndex(0);
    } catch (err) {
      console.error('Error al procesar fotogramas múltiples:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejo de subida de un Sprite Sheet continuo cortado con Canvas
  const handleSpriteSheetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const slicedFrames = await sliceSpriteSheet(dataUrl, {
        columns: sheetColumns,
        rows: sheetRows,
      });
      onUpdateFrames(slicedFrames);
      setCurrentFrameIndex(0);
    } catch (err) {
      console.error('Error al dividir el Sprite Sheet:', err);
      alert('Error al dividir el Sprite Sheet. Revisa las columnas y filas especificadas.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TARJETA SUPERIOR DE INFORMACIÓN */}
      <div className="bg-[#151624] p-4.5 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={teamName.includes('Rojo') ? 'text-red-400 font-bold' : 'text-blue-400 font-bold'}>
              {teamName}
            </span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-300">{characterRole}</span>
          </div>
          <h3 className="text-base font-bold text-white mt-0.5">
            Manejador de Fotogramas de {characterName}
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {customFrames ? (
              <span className="text-emerald-400 font-semibold">
                ✓ Usando animación personalizada ({customFrames.length} cuadros cargados)
              </span>
            ) : (
              <span>Usando {defaultFrameCount} fotogramas oficiales precargados en loop continuo.</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {customFrames && (
            <button
              onClick={onResetOfficial}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 rounded-lg transition-colors border border-white/10 cursor-pointer"
            >
              Restablecer Oficiales
            </button>
          )}
        </div>
      </div>

      {/* ÁREA DE TRABAJO: PREVIEW DE ANIMACIÓN + PANEL DE SUBIDA */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* PREVIEW EN VIVO Y CONTROLES DE TRANSPORTE (COLUMNA IZQUIERDA 6) */}
        <div className="md:col-span-6 bg-[#12131e] p-4.5 rounded-xl border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span className="font-semibold text-white">Previsualizador en Bucle</span>
              <span className="font-mono bg-black/40 px-2 py-0.5 rounded text-neutral-300">
                Cuadro: {currentFrameIndex + 1} / {totalFrames}
              </span>
            </div>

            {/* Canvas / Visor del fotograma actual */}
            <div className="relative h-64 bg-black/60 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
              {/* Línea de referencia de manos */}
              <div
                className="absolute inset-x-0 border-b border-dashed border-red-500/40 pointer-events-none z-10"
                style={{ top: '36%' }}
                title="Línea de altura de manos con soga"
              />

              {activeFrames[currentFrameIndex] && (
                <img
                  src={activeFrames[currentFrameIndex]}
                  alt={`${characterName} Frame ${currentFrameIndex}`}
                  className="max-h-56 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] transition-transform"
                />
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs font-bold text-purple-300">
                  Procesando fotogramas...
                </div>
              )}
            </div>
          </div>

          {/* CONTROLES DE TRANSPORTE (PLAY / PAUSE / SCRUBBER) */}
          <div className="space-y-3 bg-[#181928] p-3 rounded-lg border border-white/10">
            {/* Scrubber slider */}
            <input
              type="range"
              min="0"
              max={Math.max(0, totalFrames - 1)}
              value={currentFrameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentFrameIndex(parseInt(e.target.value, 10));
              }}
              className="w-full accent-purple-500 cursor-pointer"
            />

            <div className="flex items-center justify-between gap-2">
              {/* Botones de reproducción */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentFrameIndex((prev) => (prev - 1 + totalFrames) % totalFrames);
                  }}
                  className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Cuadro anterior"
                >
                  ◀
                </button>

                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  className={`px-3.5 h-8 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <span>{isPlaying ? '⏸ Pausar' : '▶ Reproducir'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentFrameIndex((prev) => (prev + 1) % totalFrames);
                  }}
                  className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Cuadro siguiente"
                >
                  ▶
                </button>
              </div>

              {/* Control de FPS */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Velocidad:</span>
                <input
                  type="range"
                  min="6"
                  max="30"
                  value={fps}
                  onChange={(e) => onUpdateFps(parseInt(e.target.value, 10))}
                  className="w-20 accent-purple-500 cursor-pointer"
                />
                <span className="text-xs font-mono text-purple-300 font-bold w-12 text-right">
                  {fps} FPS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MÉTODOS DE SUBIDA (COLUMNA DERECHA 6) */}
        <div className="md:col-span-6 bg-[#12131e] p-4.5 rounded-xl border border-white/10 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📥</span> Métodos de Carga de Animación
          </h4>

          {/* Selector de modo dual */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#181928] rounded-lg border border-white/10">
            <button
              onClick={() => setUploadMode('folder_multiple')}
              className={`py-2 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                uploadMode === 'folder_multiple'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Múltiples PNGs / Carpeta
            </button>
            <button
              onClick={() => setUploadMode('sprite_sheet')}
              className={`py-2 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                uploadMode === 'sprite_sheet'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sprite Sheet Continuo
            </button>
          </div>

          {/* MODO 1: MÚLTIPLES ARCHIVOS / CARPETA */}
          {uploadMode === 'folder_multiple' && (
            <div className="space-y-3 p-4 bg-[#181928] rounded-xl border border-white/10">
              <p className="text-xs text-neutral-300 leading-relaxed">
                Selecciona todos los fotogramas PNG de la carpeta (ej. <code>00.png</code>, <code>01.png</code> ...).
                Se ordenarán automáticamente en secuencia numérica natural para el loop.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => multiFileInputRef.current?.click()}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>📁</span>
                  <span>Seleccionar Fotogramas de la Carpeta</span>
                </button>
                <input
                  ref={multiFileInputRef}
                  type="file"
                  accept="image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleMultipleFilesChange}
                />
              </div>

              <div className="text-[11px] text-neutral-400">
                Consejo: En el explorador puedes presionar <kbd className="bg-neutral-800 px-1 py-0.5 rounded">Ctrl+A</kbd> para seleccionar todos los cuadros de tu carpeta.
              </div>
            </div>
          )}

          {/* MODO 2: SPRITE SHEET CONTINUO CON DIVISIÓN CANVAS */}
          {uploadMode === 'sprite_sheet' && (
            <div className="space-y-3.5 p-4 bg-[#181928] rounded-xl border border-white/10">
              <p className="text-xs text-neutral-300 leading-relaxed">
                Sube una sola imagen de Sprite Sheet (tira horizontal o cuadrícula). Nuestro cortador en Canvas la dividirá automáticamente en cuadros individuales.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400">Columnas (ancho):</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={sheetColumns}
                    onChange={(e) => setSheetColumns(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-neutral-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-neutral-400">Filas (alto):</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={sheetRows}
                    onChange={(e) => setSheetRows(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-neutral-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => sheetFileInputRef.current?.click()}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>✂️</span>
                  <span>Subir y Dividir Sprite Sheet</span>
                </button>
                <input
                  ref={sheetFileInputRef}
                  type="file"
                  accept="image/png,image/webp"
                  className="hidden"
                  onChange={handleSpriteSheetChange}
                />
              </div>
            </div>
          )}

          {/* ESCALA INDIVIDUAL */}
          <div className="p-3.5 bg-[#181928] rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300">Escala de {characterName} (Hacia la línea de meta):</span>
              <span className="font-mono text-purple-300 font-bold">{scalePercent}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={scalePercent}
              onChange={(e) => onUpdateScale(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <span className="text-[10px] text-neutral-400 block">
              Aumenta la escala para que el personaje se vea grande y alcance el límite de la meta.
            </span>
          </div>
        </div>
      </div>

      {/* TIRA DE FOTOGRAMAS (TIMELINE MINIATURAS) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="font-bold uppercase tracking-wider text-neutral-300">
            Tira de Fotogramas ({totalFrames} cuadros)
          </span>
          <span>Haz clic en un cuadro para pausar e inspeccionarlo</span>
        </div>

        <div className="flex gap-2 overflow-x-auto p-2 bg-[#12131e] rounded-xl border border-white/10 max-h-24 scrollbar-thin">
          {activeFrames.map((frameSrc, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrameIndex(idx);
              }}
              className={`relative flex-shrink-0 w-14 h-16 rounded-lg border overflow-hidden p-1 bg-black/50 transition-all cursor-pointer ${
                idx === currentFrameIndex
                  ? 'border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] scale-105'
                  : 'border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={frameSrc}
                alt={`F${idx}`}
                className="w-full h-full object-contain"
              />
              <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-neutral-400 bg-black/60 px-1 rounded">
                {idx}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* PESTAÑA 5: CALIBRACIÓN & ESCALAS GLOBALES                                   */
/* -------------------------------------------------------------------------- */
interface CalibrationTabProps {
  assets: CustomGameAssets;
  updateAssets: (updater: (prev: CustomGameAssets) => CustomGameAssets) => void;
  onResetAll: () => void;
}

const CalibrationTab: React.FC<CalibrationTabProps> = ({ assets, updateAssets, onResetAll }) => {
  const [syncCharactersHeight, setSyncCharactersHeight] = useState<boolean>(
    (assets.chicaHeightPercent ?? 50) === (assets.chicoHeightPercent ?? 50)
  );
  const [syncSemaphoresHeight, setSyncSemaphoresHeight] = useState<boolean>(
    (assets.semaphoreLeftHeightPercent ?? 32) === (assets.semaphoreRightHeightPercent ?? 32)
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-[#151624] p-4.5 rounded-xl border border-white/10 space-y-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>📏</span> Calibración de Escalas, Alturas y Posición
        </h3>
        <p className="text-xs text-neutral-300">
          Ajusta de forma 100% independiente la altura de la cuerda, la altura de los personajes y
          la altura vertical de los semáforos para adaptarlos al milímetro con tu diseño.
        </p>
      </div>

      <div className="space-y-4 bg-[#151624] p-5 rounded-xl border border-white/10">
        {/* 1. ALTURA Y ENCOGER LA CUERDA */}
        <div className="space-y-3 bg-[#181928] p-3.5 rounded-xl border border-purple-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white font-bold flex items-center gap-1.5">
              <span>🧵</span> Altura y Medida de la Cuerda (Encoger / Alargar)
            </span>
            <span className="font-mono text-purple-300 font-bold text-xs">
              {assets.ropeHeightPercent ?? 50}%
              {assets.ropeOffsetYPx ? ` (${assets.ropeOffsetYPx > 0 ? '+' : ''}${assets.ropeOffsetYPx}px)` : ''}
            </span>
          </div>

          <p className="text-[11px] text-neutral-400">
            Sube o baja la cuerda sin alterar los personajes, y encoge o alarga la longitud de la soga.
          </p>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-semibold">Altura Vertical:</span>
              <span className="font-mono text-purple-300">{assets.ropeHeightPercent ?? 50}%</span>
            </div>
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>Arriba (15%)</span>
              <span>Centro (50%)</span>
              <span>Abajo (85%)</span>
            </div>
            <input
              type="range"
              min="15"
              max="85"
              value={assets.ropeHeightPercent ?? 50}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                updateAssets((prev) => ({
                  ...prev,
                  ropeHeightPercent: val,
                }));
              }}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          <div className="pt-1 flex items-center justify-between gap-3 text-xs">
            <span className="text-neutral-400 text-[11px]">Ajuste fino en píxeles:</span>
            <input
              type="range"
              min="-60"
              max="60"
              value={assets.ropeOffsetYPx ?? 0}
              onChange={(e) =>
                updateAssets((prev) => ({
                  ...prev,
                  ropeOffsetYPx: parseInt(e.target.value, 10),
                }))
              }
              className="w-36 accent-purple-500 cursor-pointer"
            />
            <span className="font-mono text-neutral-300 text-[11px] w-12 text-right">
              {assets.ropeOffsetYPx ?? 0}px
            </span>
          </div>

          {/* CONTROL PARA ENCOGER / ALARGAR LA SOGA */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-200 font-semibold flex items-center gap-1">
                <span>📏</span> Extensión / Ancho de la Soga (Encoger):
              </span>
              <span className="font-mono text-yellow-300 font-bold">
                {assets.ropeWidthPercent ?? 160}%
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">
              Disminuye el porcentaje para encoger más la soga hacia el centro y que no sobrepase a los personajes.
            </p>
            <input
              type="range"
              min="20"
              max="200"
              value={assets.ropeWidthPercent ?? 160}
              onChange={(e) =>
                updateAssets((prev) => ({
                  ...prev,
                  ropeWidthPercent: parseInt(e.target.value, 10),
                }))
              }
              className="w-full accent-yellow-500 cursor-pointer"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: 'Muy Corta (40%)', val: 40 },
                { label: 'Corta (70%)', val: 70 },
                { label: 'Media (100%)', val: 100 },
                { label: 'Estándar (160%)', val: 160 },
                { label: 'Larga (190%)', val: 190 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() =>
                    updateAssets((prev) => ({
                      ...prev,
                      ropeWidthPercent: p.val,
                    }))
                  }
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    (assets.ropeWidthPercent ?? 160) === p.val
                      ? 'bg-yellow-500/30 text-yellow-200 border-yellow-400/50 font-bold'
                      : 'bg-white/5 text-neutral-400 hover:text-white border-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. ALTURA VERTICAL DE LOS PERSONAJES (ARRIBA Y ABAJO) */}
        <div className="space-y-3 bg-[#181928] p-3.5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white font-bold flex items-center gap-1.5">
              <span>🧍</span> Altura Vertical de Personajes (Arriba / Abajo)
            </span>
            <label className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={syncCharactersHeight}
                onChange={(e) => setSyncCharactersHeight(e.target.checked)}
                className="rounded accent-purple-500"
              />
              <span>Sincronizar ambos</span>
            </label>
          </div>

          <p className="text-[11px] text-neutral-400">
            Ajusta la altura de los personajes para alinear sus manos con la cuerda o situarlos en sus bases.
          </p>

          {syncCharactersHeight ? (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300">Ambos Personajes:</span>
                <span className="font-mono text-purple-300 font-bold">
                  {assets.characterHeightPercent ?? assets.chicaHeightPercent ?? 50}%
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="85"
                value={assets.characterHeightPercent ?? assets.chicaHeightPercent ?? 50}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  updateAssets((prev) => ({
                    ...prev,
                    characterHeightPercent: val,
                    chicaHeightPercent: val,
                    chicoHeightPercent: val,
                    handHeightPercent: val,
                  }));
                }}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-red-400 font-semibold">Altura Chica (Rojo):</span>
                  <span className="font-mono text-red-300 font-bold">{assets.chicaHeightPercent ?? 50}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="85"
                  value={assets.chicaHeightPercent ?? 50}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateAssets((prev) => ({
                      ...prev,
                      chicaHeightPercent: val,
                    }));
                  }}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-400 font-semibold">Altura Chico (Azul):</span>
                  <span className="font-mono text-blue-300 font-bold">{assets.chicoHeightPercent ?? 50}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="85"
                  value={assets.chicoHeightPercent ?? 50}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateAssets((prev) => ({
                      ...prev,
                      chicoHeightPercent: val,
                    }));
                  }}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. ALTURA VERTICAL DE LOS SEMÁFOROS (ARRIBA Y ABAJO) */}
        <div className="space-y-3 bg-[#181928] p-3.5 rounded-xl border border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white font-bold flex items-center gap-1.5">
              <span>🚦</span> Altura de Semáforos (Mover de Arriba para Abajo)
            </span>
            <label className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={syncSemaphoresHeight}
                onChange={(e) => setSyncSemaphoresHeight(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span>Sincronizar ambos</span>
            </label>
          </div>

          <p className="text-[11px] text-neutral-400">
            Mueve los semáforos de Luz Roja/Verde hacia arriba o abajo para que encajen en el fondo o donde no tapen elementos.
          </p>

          {syncSemaphoresHeight ? (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300">Ambos Semáforos (Izquierda y Derecha):</span>
                <span className="font-mono text-amber-300 font-bold">
                  {assets.semaphoreHeightPercent ?? assets.semaphoreLeftHeightPercent ?? 32}%
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Arriba (5%)</span>
                <span>Por defecto (32%)</span>
                <span>Abajo (90%)</span>
              </div>
              <input
                type="range"
                min="5"
                max="90"
                value={assets.semaphoreHeightPercent ?? assets.semaphoreLeftHeightPercent ?? 32}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  updateAssets((prev) => ({
                    ...prev,
                    semaphoreHeightPercent: val,
                    semaphoreLeftHeightPercent: val,
                    semaphoreRightHeightPercent: val,
                  }));
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-red-400 font-semibold">Semáforo Izquierdo (Rojo):</span>
                  <span className="font-mono text-red-300 font-bold">
                    {assets.semaphoreLeftHeightPercent ?? assets.semaphoreHeightPercent ?? 32}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  value={assets.semaphoreLeftHeightPercent ?? assets.semaphoreHeightPercent ?? 32}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateAssets((prev) => ({
                      ...prev,
                      semaphoreLeftHeightPercent: val,
                    }));
                  }}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-400 font-semibold">Semáforo Derecho (Azul):</span>
                  <span className="font-mono text-blue-300 font-bold">
                    {assets.semaphoreRightHeightPercent ?? assets.semaphoreHeightPercent ?? 32}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="90"
                  value={assets.semaphoreRightHeightPercent ?? assets.semaphoreHeightPercent ?? 32}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateAssets((prev) => ({
                      ...prev,
                      semaphoreRightHeightPercent: val,
                    }));
                  }}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Líneas de meta independientes para Rojo y Azul */}
        <div className="space-y-2 bg-[#181928] p-3.5 rounded-xl border border-white/10">
          <span className="text-xs text-white font-bold flex items-center gap-1.5">
            <span>🏁</span> Líneas de Meta Independientes (Límite de Victoria)
          </span>
          <p className="text-[11px] text-neutral-400">
            Mueve cada línea de meta de forma individual para definir exactamente dónde se gana el juego.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-red-400 font-semibold">Línea Meta Rojo:</span>
                <span className="font-mono text-red-300 font-bold">{assets.metaRojoPercent ?? 34}%</span>
              </div>
              <input
                type="range"
                min="18"
                max="46"
                value={assets.metaRojoPercent ?? 34}
                onChange={(e) =>
                  updateAssets((prev) => ({
                    ...prev,
                    metaRojoPercent: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-red-500 cursor-pointer"
              />
              <span className="text-[10px] text-neutral-400 block">
                Por defecto: 34% (más a la derecha = meta más cerca del centro).
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-blue-400 font-semibold">Línea Meta Azul:</span>
                <span className="font-mono text-blue-300 font-bold">{assets.metaAzulPercent ?? 66}%</span>
              </div>
              <input
                type="range"
                min="54"
                max="82"
                value={assets.metaAzulPercent ?? 66}
                onChange={(e) =>
                  updateAssets((prev) => ({
                    ...prev,
                    metaAzulPercent: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
              <span className="text-[10px] text-neutral-400 block">
                Por defecto: 66% (más a la izquierda = meta más cerca del centro).
              </span>
            </div>
          </div>
        </div>

        {/* Posiciones de los personajes: Alejar o Acercar de la meta */}
        <div className="space-y-2 bg-[#181928] p-3.5 rounded-xl border border-white/10">
          <span className="text-xs text-white font-bold flex items-center gap-1.5">
            <span>🚶</span> Distancia de los Personajes (Alejar de la Meta)
          </span>
          <p className="text-[11px] text-neutral-400">
            Ajusta qué tan lejos o cerca de la meta se paran los personajes. Un porcentaje menor los aleja hacia su base.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-200 font-semibold">Posición Chica:</span>
                <span className="font-mono text-purple-300 font-bold">{assets.chicaPositionPercent ?? 8}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="26"
                value={assets.chicaPositionPercent ?? 8}
                onChange={(e) =>
                  updateAssets((prev) => ({
                    ...prev,
                    chicaPositionPercent: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-purple-500 cursor-pointer"
              />
              <span className="text-[10px] text-neutral-400 block">
                0% a 8% = Alejado hacia la base · 16%+ = Más cerca de la meta roja.
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-200 font-semibold">Posición Chico:</span>
                <span className="font-mono text-purple-300 font-bold">{assets.chicoPositionPercent ?? 8}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="26"
                value={assets.chicoPositionPercent ?? 8}
                onChange={(e) =>
                  updateAssets((prev) => ({
                    ...prev,
                    chicoPositionPercent: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-purple-500 cursor-pointer"
              />
              <span className="text-[10px] text-neutral-400 block">
                0% a 8% = Alejado hacia la base · 16%+ = Más cerca de la meta azul.
              </span>
            </div>
          </div>
        </div>

        {/* Escalas de personajes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-200 font-semibold">Escala Chica (Rojo):</span>
              <span className="font-mono text-purple-300 font-bold">{assets.chicaScalePercent ?? 100}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={assets.chicaScalePercent ?? 100}
              onChange={(e) =>
                updateAssets((prev) => ({
                  ...prev,
                  chicaScalePercent: parseInt(e.target.value, 10),
                }))
              }
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-200 font-semibold">Escala Chico (Azul):</span>
              <span className="font-mono text-purple-300 font-bold">{assets.chicoScalePercent ?? 100}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={assets.chicoScalePercent ?? 100}
              onChange={(e) =>
                updateAssets((prev) => ({
                  ...prev,
                  chicoScalePercent: parseInt(e.target.value, 10),
                }))
              }
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Subir y Bajar la Bandana + Tamaño */}
        <div className="space-y-3 bg-[#181928] p-3.5 rounded-xl border border-pink-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white font-bold flex items-center gap-1.5">
              <span>🎀</span> Bandana (Subir / Bajar y Tamaño)
            </span>
            <span className="font-mono text-pink-300 font-bold text-xs">
              {assets.bandanaOffsetYPx ?? 0}px
            </span>
          </div>

          <p className="text-[11px] text-neutral-400">
            Sube o baja la bandana verticalmente para acomodarla con precisión sobre la cuerda o ajustarla al milímetro.
          </p>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-200 font-semibold">Subir / Bajar Bandana (Vertical):</span>
              <span className="font-mono text-pink-300 font-bold">
                {assets.bandanaOffsetYPx ?? 0} px
                {assets.bandanaOffsetYPx && assets.bandanaOffsetYPx < 0 ? ' (Hacia arriba)' : ''}
                {assets.bandanaOffsetYPx && assets.bandanaOffsetYPx > 0 ? ' (Hacia abajo)' : ''}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Arriba (-100px)</span>
              <span>Centrado en soga (0px)</span>
              <span>Abajo (+100px)</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={assets.bandanaOffsetYPx ?? 0}
              onChange={(e) =>
                updateAssets((prev) => ({
                  ...prev,
                  bandanaOffsetYPx: parseInt(e.target.value, 10),
                }))
              }
              className="w-full accent-pink-500 cursor-pointer"
            />
            {/* Botones de ajuste fino para subir y bajar la bandana */}
            <div className="flex items-center justify-center gap-1.5 pt-1.5">
              <button
                type="button"
                onClick={() =>
                  updateAssets((prev) => ({
                    ...prev,
                    bandanaOffsetYPx: (prev.bandanaOffsetYPx ?? 0) - 5,
                  }))
                }
                className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-neutral-300 cursor-pointer"
              >
                ▲ -5px (Subir)
              </button>
              <button
                type="button"
                onClick={() =>
                  updateAssets((prev) => ({
                    ...prev,
                    bandanaOffsetYPx: (prev.bandanaOffsetYPx ?? 0) - 1,
                  }))
                }
                className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-neutral-300 cursor-pointer"
              >
                -1px
              </button>
              <button
                type="button"
                onClick={() =>
                  updateAssets((prev) => ({
                    ...prev,
                    bandanaOffsetYPx: 0,
                  }))
                }
                className="text-[10px] px-2.5 py-1 bg-pink-500/20 hover:bg-pink-500/30 rounded border border-pink-500/40 text-pink-200 font-semibold cursor-pointer"
              >
                0px (Centrado)
              </button>
              <button
                type="button"
                onClick={() =>
                  updateAssets((prev) => ({
                    ...prev,
                    bandanaOffsetYPx: (prev.bandanaOffsetYPx ?? 0) + 1,
                  }))
                }
                className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-neutral-300 cursor-pointer"
              >
                +1px
              </button>
              <button
                type="button"
                onClick={() =>
                  updateAssets((prev) => ({
                    ...prev,
                    bandanaOffsetYPx: (prev.bandanaOffsetYPx ?? 0) + 5,
                  }))
                }
                className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-neutral-300 cursor-pointer"
              >
                ▼ +5px (Bajar)
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-200 font-semibold">Tamaño de la Bandana (Escala):</span>
              <span className="font-mono text-purple-300 font-bold">{assets.bandanaScalePercent ?? 85}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="150"
              value={assets.bandanaScalePercent ?? 85}
              onChange={(e) =>
                updateAssets((prev) => ({
                  ...prev,
                  bandanaScalePercent: parseInt(e.target.value, 10),
                }))
              }
              className="w-full accent-pink-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Grosor de Soga (Encoger grosor) */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-200 font-semibold">Grosor de la Soga (Encoger / Engrosar):</span>
            <span className="font-mono text-purple-300 font-bold">{assets.ropeThicknessPx ?? 14} px</span>
          </div>
          <p className="text-[10px] text-neutral-400">
            Disminuye hasta 2px para una soga más delgada o encogida verticalmente.
          </p>
          <input
            type="range"
            min="2"
            max="36"
            value={assets.ropeThicknessPx ?? 14}
            onChange={(e) =>
              updateAssets((prev) => ({
                ...prev,
                ropeThicknessPx: parseInt(e.target.value, 10),
              }))
            }
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        {/* Botón de restablecer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onResetAll}
            className="px-4 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-semibold rounded-lg transition-colors border border-red-500/30 cursor-pointer"
          >
            Restablecer Todo a Valores de Fábrica
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* BOTÓN DE PESTAÑA REUTILIZABLE                                              */
/* -------------------------------------------------------------------------- */
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  badge?: string;
}> = ({ active, onClick, icon, label, badge }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2.5 rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
        active
          ? 'bg-[#151624] text-white border-t-2 border-purple-500 font-bold shadow'
          : 'text-neutral-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {badge && (
        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-950 text-purple-300 border border-purple-500/40 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
};
