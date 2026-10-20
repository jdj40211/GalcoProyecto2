export const formatCurrency = (value, currency = 'COP') =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  });

export const formatDateTime = (value) => (value ? new Date(value).toLocaleString('es-CO') : '—');

export const money = formatCurrency;

export const decimal = (value, digits = 2) =>
  Number(value || 0).toLocaleString('es-CO', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });

export const dateShort = (value) => (value ? new Date(value).toLocaleDateString('es-CO') : '—');

export const estadoBadgeClass = (estado) =>
  ({
    borrador: 'badge-muted',
    enviada: 'badge-info',
    aprobada: 'badge-success',
    rechazada: 'badge-danger',
    anulada: 'badge-muted'
  })[estado] || 'badge-muted';

export function downloadText(content, filename) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No fue posible leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

// Reduce las fotos de celular a JPEG de máximo 2000 px: el OCR responde más rápido y cuesta menos.
export async function prepareReceiptFile(file, { maxSide = 2000, quality = 0.85, minBytes = 600 * 1024 } = {}) {
  const original = async () => ({
    file: { name: file.name, type: file.type, size: file.size },
    dataUrl: await fileToDataUrl(file)
  });
  if (!file.type.startsWith('image/') || typeof createImageBitmap !== 'function') return original();
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= minBytes) {
      bitmap.close();
      return original();
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return original();
    return {
      file: { name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', size: blob.size },
      dataUrl: await fileToDataUrl(blob)
    };
  } catch {
    return original();
  }
}
