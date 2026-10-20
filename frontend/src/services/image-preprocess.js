export function imageGeometry(width, height, cropPercent = 0, rotation = 0) {
  if (width <= 0 || height <= 0 || cropPercent < 0 || cropPercent > 20 || ![0, 90, 180, 270].includes(rotation))
    throw new Error('Parámetros de imagen inválidos.');
  const margin = cropPercent / 100;
  const sourceWidth = width * (1 - 2 * margin),
    sourceHeight = height * (1 - 2 * margin);
  const scale = Math.min(1, 2400 / Math.max(sourceWidth, sourceHeight));
  const w = Math.round(sourceWidth * scale),
    h = Math.round(sourceHeight * scale);
  return {
    x: width * margin,
    y: height * margin,
    sourceWidth,
    sourceHeight,
    w,
    h,
    width: rotation % 180 ? h : w,
    height: rotation % 180 ? w : h
  };
}

export async function preprocessImage(dataUrl, { crop = 0, rotation = 0, contrast = 1 } = {}) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const g = imageGeometry(img.naturalWidth, img.naturalHeight, Number(crop), Number(rotation));
  const canvas = document.createElement('canvas');
  canvas.width = g.width;
  canvas.height = g.height;
  const context = canvas.getContext('2d');
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((Number(rotation) * Math.PI) / 180);
  context.filter = `contrast(${Math.max(0.5, Math.min(2, Number(contrast)))})`;
  context.drawImage(img, g.x, g.y, g.sourceWidth, g.sourceHeight, -g.w / 2, -g.h / 2, g.w, g.h);
  return canvas.toDataURL('image/jpeg', 0.92);
}
