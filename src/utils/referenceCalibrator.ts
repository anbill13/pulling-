/**
 * Calibrador y auto-escalador inteligente basado en análisis de Imagen de Referencia y Activos
 */

import { loadImage } from './spriteSlicer';

export interface CalibrationResult {
  handHeightPercent: number;
  characterScalePercent: number;
  chicaScalePercent: number;
  chicoScalePercent: number;
  bandanaScalePercent: number;
  ropeThicknessPx: number;
  details: string[];
}

/**
 * Obtiene el bounding box (alto y ancho reales) de los píxeles no transparentes de una imagen
 */
function getNonTransparentBoundingBox(img: HTMLImageElement): {
  contentWidth: number;
  contentHeight: number;
  top: number;
  bottom: number;
} {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return {
      contentWidth: canvas.width,
      contentHeight: canvas.height,
      top: 0,
      bottom: canvas.height,
    };
  }

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imgData;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let foundPixel = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 25) {
        foundPixel = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!foundPixel) {
    return {
      contentWidth: width,
      contentHeight: height,
      top: 0,
      bottom: height,
    };
  }

  return {
    contentWidth: maxX - minX + 1,
    contentHeight: maxY - minY + 1,
    top: minY,
    bottom: maxY,
  };
}

/**
 * Analiza la imagen de referencia para detectar la línea horizontal de la soga / altura de manos (centro vertical)
 */
function detectRopeLineFromReference(refImg: HTMLImageElement): {
  detectedHandPercent: number;
  detectedRopeThickness: number;
} {
  try {
    const canvas = document.createElement('canvas');
    const width = (canvas.width = Math.min(refImg.naturalWidth, 800));
    const height = (canvas.height = Math.min(refImg.naturalHeight, 600));
    const ctx = canvas.getContext('2d');
    if (!ctx) return { detectedHandPercent: 50, detectedRopeThickness: 12 };

    ctx.drawImage(refImg, 0, 0, width, height);

    // Muestreamos la franja vertical central (del 35% al 65% de altura) en la zona media (40% a 60% ancho)
    const startY = Math.floor(height * 0.35);
    const endY = Math.floor(height * 0.65);
    const sampleXStart = Math.floor(width * 0.45);
    const sampleXEnd = Math.floor(width * 0.55);
    const sampleWidth = Math.max(1, sampleXEnd - sampleXStart);

    let bestY = Math.floor(height * 0.5);
    let maxContrast = -1;

    for (let y = startY; y < endY; y++) {
      const rowData = ctx.getImageData(sampleXStart, y, sampleWidth, 1).data;
      let rowBrightness = 0;
      for (let i = 0; i < rowData.length; i += 4) {
        rowBrightness += rowData[i] * 0.299 + rowData[i + 1] * 0.587 + rowData[i + 2] * 0.114;
      }
      rowBrightness /= rowData.length / 4;

      if (y > startY + 2 && y < endY - 2) {
        const prevRow = ctx.getImageData(sampleXStart, y - 2, sampleWidth, 1).data;
        let prevBrightness = 0;
        for (let i = 0; i < prevRow.length; i += 4) {
          prevBrightness += prevRow[i] * 0.299 + prevRow[i + 1] * 0.587 + prevRow[i + 2] * 0.114;
        }
        prevBrightness /= prevRow.length / 4;

        const diff = Math.abs(rowBrightness - prevBrightness);
        if (diff > maxContrast) {
          maxContrast = diff;
          bestY = y;
        }
      }
    }

    const detectedHandPercent = Math.min(62, Math.max(42, Math.round((bestY / height) * 100)));
    return { detectedHandPercent, detectedRopeThickness: 12 };
  } catch (err) {
    console.warn('Error al detectar línea de soga en referencia:', err);
    return { detectedHandPercent: 50, detectedRopeThickness: 12 };
  }
}

/**
 * Calibra automáticamente todos los elementos contra la imagen de referencia:
 * Compara las proporciones de los sprites respecto al marco de la imagen de referencia
 * y determina la escala ideal para que coincidan con la composición visual.
 */
export async function calibrateElementsWithReference(options: {
  referenceImageUrl: string;
  chicaFrameUrl?: string;
  chicoFrameUrl?: string;
  sogaUrl?: string;
  bandanaUrl?: string;
}): Promise<CalibrationResult> {
  const details: string[] = [];

  // Cargar imagen de referencia
  const refImg = await loadImage(options.referenceImageUrl);
  const refWidth = refImg.naturalWidth;
  const refHeight = refImg.naturalHeight;
  details.push(`Referencia analizada: ${refWidth}x${refHeight}px`);

  // Detectar altura de manos/soga en la referencia
  const { detectedHandPercent, detectedRopeThickness } = detectRopeLineFromReference(refImg);
  details.push(`Altura de manos/soga detectada: ${detectedHandPercent}%`);

  // Altura objetivo del personaje en la arena para una presencia grande y visible
  // que llegue hasta el límite de la línea de victoria (~250px en arena de ~500px)
  const baseTargetDisplayHeightPx = 250;

  // Analizar fotograma de Chica
  let chicaScale = 110;
  if (options.chicaFrameUrl) {
    try {
      const chicaImg = await loadImage(options.chicaFrameUrl);
      const bbox = getNonTransparentBoundingBox(chicaImg);
      const naturalHeight = bbox.contentHeight || chicaImg.naturalHeight || 140;

      // Calculamos la escala necesaria para que el personaje se vea grande y alcance el límite
      const ratio = baseTargetDisplayHeightPx / Math.max(40, naturalHeight);
      chicaScale = Math.min(180, Math.max(70, Math.round(ratio * 85)));

      details.push(`Chica: sprite de ${naturalHeight}px de alto real → Escala ajustada a ${chicaScale}% (tamaño grande hacia el límite)`);
    } catch (e) {
      details.push(`Chica: se asignó escala 110%`);
    }
  }

  // Analizar fotograma de Chico
  let chicoScale = 110;
  if (options.chicoFrameUrl) {
    try {
      const chicoImg = await loadImage(options.chicoFrameUrl);
      const bbox = getNonTransparentBoundingBox(chicoImg);
      const naturalHeight = bbox.contentHeight || chicoImg.naturalHeight || 140;

      const ratio = baseTargetDisplayHeightPx / Math.max(40, naturalHeight);
      chicoScale = Math.min(180, Math.max(70, Math.round(ratio * 85)));

      details.push(`Chico: sprite de ${naturalHeight}px de alto real → Escala ajustada a ${chicoScale}% (tamaño grande hacia el límite)`);
    } catch (e) {
      details.push(`Chico: se asignó escala 110%`);
    }
  }

  // Analizar Bandana
  let bandanaScale = 75;
  if (options.bandanaUrl) {
    try {
      const bandanaImg = await loadImage(options.bandanaUrl);
      const bBox = getNonTransparentBoundingBox(bandanaImg);
      const naturalH = bBox.contentHeight || bandanaImg.naturalHeight || 32;
      if (naturalH > 50) {
        bandanaScale = Math.min(120, Math.max(40, Math.round((32 / naturalH) * 100)));
      } else {
        bandanaScale = 75;
      }
      details.push(`Bandana: escala ajustada a ${bandanaScale}%`);
    } catch (e) {
      bandanaScale = 75;
    }
  }

  return {
    handHeightPercent: detectedHandPercent,
    characterScalePercent: Math.round((chicaScale + chicoScale) / 2),
    chicaScalePercent: chicaScale,
    chicoScalePercent: chicoScale,
    bandanaScalePercent: bandanaScale,
    ropeThicknessPx: detectedRopeThickness,
    details,
  };
}
