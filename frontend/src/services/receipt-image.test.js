import { describe, expect, it } from 'vitest';
import { contrastLevels, luminance, stretchContrast, trimBounds } from './receipt-image';

// Imagen en escala de grises: fondo uniforme con un "recibo" rectangular que contiene líneas de texto.
function receiptOnTable({ width = 200, height = 300, table = 40, paper = 235, ink = 30, box = [50, 40, 100, 200] }) {
  const values = new Uint8ClampedArray(width * height).fill(table);
  const [bx, by, bw, bh] = box;
  for (let y = by; y < by + bh; y += 1) {
    for (let x = bx; x < bx + bw; x += 1) values[y * width + x] = (y - by) % 12 < 2 && x < bx + bw - 10 ? ink : paper;
  }
  return values;
}

describe('recorte de bordes', () => {
  it('encuentra el recibo sobre una mesa oscura y deja un margen', () => {
    const box = trimBounds(receiptOnTable({}), 200, 300);
    expect(box).not.toBeNull();
    expect(box.x).toBeLessThanOrEqual(50);
    expect(box.x).toBeGreaterThanOrEqual(40);
    expect(box.y).toBeLessThanOrEqual(40);
    expect(box.x + box.width).toBeGreaterThanOrEqual(150);
    expect(box.y + box.height).toBeGreaterThanOrEqual(240);
  });

  it('no recorta un documento que ya ocupa toda la imagen', () => {
    expect(trimBounds(receiptOnTable({ box: [0, 0, 200, 300] }), 200, 300)).toBeNull();
  });

  it('no recorta cuando el fondo tiene textura', () => {
    const values = receiptOnTable({});
    for (let i = 0; i < values.length; i += 3) if (values[i] === 40) values[i] = 140;
    expect(trimBounds(values, 200, 300)).toBeNull();
  });

  it('no deja un recorte demasiado pequeño', () => {
    expect(trimBounds(receiptOnTable({ box: [95, 140, 10, 20] }), 200, 300)).toBeNull();
  });
});

describe('contraste', () => {
  it('estira el rango de un tiquete desteñido', () => {
    const faded = new Uint8ClampedArray(1000).map((_, i) => (i % 10 === 0 ? 150 : 210));
    const levels = contrastLevels(faded);
    expect(levels).toMatchObject({ low: 150, high: 210, apply: true });
    const rgba = new Uint8ClampedArray([150, 150, 150, 255, 210, 210, 210, 255, 180, 180, 180, 255]);
    expect(Array.from(stretchContrast(rgba, levels))).toEqual([0, 0, 0, 255, 255, 255, 255, 255, 128, 128, 128, 255]);
  });

  it('deja igual una imagen que ya tiene buen contraste', () => {
    const sharp = new Uint8ClampedArray(1000).map((_, i) => (i % 10 === 0 ? 10 : 245));
    expect(contrastLevels(sharp).apply).toBe(false);
  });

  it('no estira una imagen casi plana para no amplificar ruido', () => {
    expect(contrastLevels(new Uint8ClampedArray(1000).fill(128)).apply).toBe(false);
  });

  it('calcula la luminancia de píxeles RGBA', () => {
    expect(Array.from(luminance(new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255])))).toEqual([255, 0]);
  });
});
