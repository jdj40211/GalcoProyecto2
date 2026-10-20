// Preprocesamiento de comprobantes antes del OCR (HU-25, CA2). El original no se modifica:
// esta copia solo se envía al servicio de extracción.
const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.9;

export const STEP_LABELS = {
  orientacion: 'orientación corregida',
  recorte: 'bordes recortados',
  escala: 'tamaño normalizado',
  contraste: 'contraste ajustado'
};

export function luminance(rgba) {
  const values = new Uint8ClampedArray(rgba.length / 4);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 1) {
    values[j] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  }
  return values;
}

// Niveles de corte al 1 % y 99 % del histograma. Solo propone estirar el contraste cuando la imagen
// usa poco rango (tinta desteñida, foto oscura); una imagen con buen contraste se deja igual.
export function contrastLevels(values, { clip = 0.01, minRange = 24, maxRange = 200 } = {}) {
  const histogram = new Uint32Array(256);
  for (const value of values) histogram[value] += 1;
  const limit = values.length * clip;
  let low = 0;
  for (let count = 0; low < 255 && count + histogram[low] <= limit; low += 1) count += histogram[low];
  let high = 255;
  for (let count = 0; high > 0 && count + histogram[high] <= limit; high -= 1) count += histogram[high];
  const range = high - low;
  return { low, high, apply: range >= minRange && range < maxRange };
}

export function stretchContrast(rgba, { low, high }) {
  const table = new Uint8ClampedArray(256);
  for (let value = 0; value < 256; value += 1) table[value] = ((value - low) * 255) / (high - low);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = table[rgba[i]];
    rgba[i + 1] = table[rgba[i + 1]];
    rgba[i + 2] = table[rgba[i + 2]];
  }
  return rgba;
}

// Busca el rectángulo del comprobante quitando bordes de color uniforme (la mesa, el fondo de un
// escáner). Es conservador: si el borde tiene textura o el recorte dejaría muy poco, no recorta.
export function trimBounds(values, width, height, { tolerance = 40, noise = 0.01, minKeep = 0.2, pad = 0.02 } = {}) {
  const frame = [];
  for (let x = 0; x < width; x += 1) frame.push(values[x], values[(height - 1) * width + x]);
  for (let y = 0; y < height; y += 1) frame.push(values[y * width], values[y * width + width - 1]);
  frame.sort((a, b) => a - b);
  const background = frame[Math.floor(frame.length / 2)];
  const differs = (index) => Math.abs(values[index] - background) > tolerance;
  const rowIsBackground = (y) => {
    let count = 0;
    for (let x = 0; x < width; x += 1) if (differs(y * width + x)) count += 1;
    return count <= width * noise;
  };
  const columnIsBackground = (x, top, bottom) => {
    let count = 0;
    for (let y = top; y <= bottom; y += 1) if (differs(y * width + x)) count += 1;
    return count <= (bottom - top + 1) * noise;
  };
  let top = 0;
  while (top < height - 1 && rowIsBackground(top)) top += 1;
  let bottom = height - 1;
  while (bottom > top && rowIsBackground(bottom)) bottom -= 1;
  let left = 0;
  while (left < width - 1 && columnIsBackground(left, top, bottom)) left += 1;
  let right = width - 1;
  while (right > left && columnIsBackground(right, top, bottom)) right -= 1;

  const padX = Math.round(width * pad);
  const padY = Math.round(height * pad);
  const box = {
    x: Math.max(0, left - padX),
    y: Math.max(0, top - padY),
    width: Math.min(width, right + padX + 1) - Math.max(0, left - padX),
    height: Math.min(height, bottom + padY + 1) - Math.max(0, top - padY)
  };
  const kept = (box.width * box.height) / (width * height);
  const trimmed = box.width < width * 0.95 || box.height < height * 0.95;
  return kept >= minKeep && trimmed ? box : null;
}

const canvasOf = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};
const toBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
const readAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No fue posible leer la imagen procesada.'));
    reader.readAsDataURL(blob);
  });

// Devuelve la copia para el OCR y los pasos aplicados, o null si el navegador no puede procesarla.
export async function preprocessReceiptImage(file) {
  if (!file.type.startsWith('image/') || typeof createImageBitmap !== 'function') return null;
  const steps = [];
  // 'from-image' aplica la rotación EXIF de las fotos de celular.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const raw = await createImageBitmap(file, { imageOrientation: 'none' }).catch(() => null);
  if (raw && (raw.width !== bitmap.width || raw.height !== bitmap.height)) steps.push('orientacion');
  raw?.close();

  // Se analiza una miniatura: basta para hallar bordes y niveles y es mucho más rápida.
  const sampleScale = Math.min(1, 400 / Math.max(bitmap.width, bitmap.height));
  const sample = canvasOf(Math.round(bitmap.width * sampleScale), Math.round(bitmap.height * sampleScale));
  const sampleContext = sample.getContext('2d', { willReadFrequently: true });
  sampleContext.fillStyle = '#ffffff';
  sampleContext.fillRect(0, 0, sample.width, sample.height);
  sampleContext.drawImage(bitmap, 0, 0, sample.width, sample.height);
  const box = trimBounds(
    luminance(sampleContext.getImageData(0, 0, sample.width, sample.height).data),
    sample.width,
    sample.height
  );
  const source = box
    ? {
        x: box.x / sampleScale,
        y: box.y / sampleScale,
        width: box.width / sampleScale,
        height: box.height / sampleScale
      }
    : { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  if (box) steps.push('recorte');

  const scale = Math.min(1, MAX_SIDE / Math.max(source.width, source.height));
  if (scale < 1) steps.push('escala');
  const canvas = canvasOf(Math.round(source.width * scale), Math.round(source.height * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, source.x, source.y, source.width, source.height, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const levels = contrastLevels(luminance(image.data));
  if (levels.apply) {
    stretchContrast(image.data, levels);
    context.putImageData(image, 0, 0);
    steps.push('contraste');
  }

  const blob = await toBlob(canvas);
  if (!blob) return null;
  return { dataUrl: await readAsDataUrl(blob), type: 'image/jpeg', size: blob.size, steps };
}
