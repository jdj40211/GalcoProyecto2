import { describe, it, expect } from 'vitest';
import { imageGeometry } from './image-preprocess';
// HU-04 se prueba en password-reset.test.js, junto con la interfaz que quedó (modal del login).
describe('HU-25 preparación de imagen', () => {
  it('recorta, limita resolución y gira las dimensiones', () => {
    const g = imageGeometry(4000, 3000, 10, 90);
    expect(g.width).toBe(1800);
    expect(g.height).toBe(2400);
    expect(g.x).toBe(400);
    expect(g.y).toBe(300);
  });
  it('rechaza recortes excesivos o rotaciones inválidas', () => {
    expect(() => imageGeometry(100, 100, 30)).toThrow();
    expect(() => imageGeometry(100, 100, 0, 45)).toThrow();
  });
});
