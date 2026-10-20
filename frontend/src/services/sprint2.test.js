import { describe, it, expect, vi } from 'vitest';
import { requestRecovery } from './recovery';
import { imageGeometry } from './image-preprocess';
describe('HU-04 recuperación', () => {
  it('solicita recuperación sin revelar la existencia de la cuenta', async () => {
    const provider = vi.fn().mockResolvedValue(undefined);
    expect(await requestRecovery('persona@example.com', provider, true)).toContain('Si el correo');
    expect(provider).toHaveBeenCalledOnce();
    const absent = vi.fn().mockRejectedValue({ code: 'auth/user-not-found' });
    expect(await requestRecovery('ausente@example.com', absent, true)).toContain('Si el correo');
  });
  it('rechaza correo inválido y no simula un correo cuando falta configuración', async () => {
    const provider = vi.fn();
    await expect(requestRecovery('invalido', provider, true)).rejects.toThrow('correo válido');
    await expect(requestRecovery('persona@example.com', provider, false)).rejects.toThrow('Firebase');
    expect(provider).not.toHaveBeenCalled();
  });
});
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
