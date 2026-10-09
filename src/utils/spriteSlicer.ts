/**
 * Utilidades para procesamiento y división de Sprite Sheets y fotogramas de animación
 */

export interface SpriteSheetGridOptions {
  columns: number;
  rows: number;
  frameCount?: number; // total frames (si la última fila no está llena)
}

/**
 * Ordena archivos de fotogramas alfanuméricamente de forma natural:
 * 0.png, 1.png ... 9.png, 10.png, 29.png (no orden lexicográfico '10' antes de '2')
 */
export function naturalSortFiles(files: File[]): File[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
}

/**
 * Lee un File como Data URL (base64)
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Carga una imagen HTML a partir de un DataURL o URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Error al cargar imagen para procesamiento: ${e}`));
    img.src = src;
  });
}

/**
 * Corta una tira o cuadrícula de Sprite Sheet continua en un array de fotogramas individuales (Data URLs)
 */
export async function sliceSpriteSheet(
  imageSource: string | HTMLImageElement,
  options: SpriteSheetGridOptions
): Promise<string[]> {
  const img = typeof imageSource === 'string' ? await loadImage(imageSource) : imageSource;
  const cols = Math.max(1, options.columns);
  const rows = Math.max(1, options.rows);
  const totalFrames = options.frameCount ?? cols * rows;

  const frameWidth = Math.floor(img.naturalWidth / cols);
  const frameHeight = Math.floor(img.naturalHeight / rows);

  if (frameWidth <= 0 || frameHeight <= 0) {
    throw new Error('Dimensiones de fotograma inválidas calculadas a partir del Sprite Sheet');
  }

  const canvas = document.createElement('canvas');
  canvas.width = frameWidth;
  canvas.height = frameHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No se pudo obtener el contexto 2D del Canvas');
  }

  const frames: string[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (frames.length >= totalFrames) break;

      const sx = c * frameWidth;
      const sy = r * frameHeight;

      ctx.clearRect(0, 0, frameWidth, frameHeight);
      ctx.drawImage(img, sx, sy, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);

      frames.push(canvas.toDataURL('image/png'));
    }
  }

  return frames;
}
