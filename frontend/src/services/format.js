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
