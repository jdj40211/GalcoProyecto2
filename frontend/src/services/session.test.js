import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACTIVITY_KEY, idleLimitMs, isIdleExpired, readActivity, startIdleWatch } from './session';

const memoryStorage = () => {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key)
  };
};

describe('límite de inactividad', () => {
  it('usa 30 minutos por defecto y respeta un valor configurado', () => {
    expect(idleLimitMs(undefined)).toBe(30 * 60000);
    expect(idleLimitMs('0')).toBe(30 * 60000);
    expect(idleLimitMs('15')).toBe(15 * 60000);
  });

  it('solo vence cuando hubo actividad registrada y pasó el límite', () => {
    expect(isIdleExpired(0, 1000, 5000)).toBe(false);
    expect(isIdleExpired(1000, 1000, 1999)).toBe(false);
    expect(isIdleExpired(1000, 1000, 2000)).toBe(true);
  });
});

describe('vigilancia de inactividad', () => {
  let clock;
  let storage;
  let target;
  beforeEach(() => {
    vi.useFakeTimers();
    clock = 1_000_000;
    storage = memoryStorage();
    target = new EventTarget();
  });
  afterEach(() => vi.useRealTimers());
  const advance = (ms) => {
    clock += ms;
    vi.advanceTimersByTime(ms);
  };

  it('cierra la sesión cuando no hay actividad durante el límite', () => {
    const onExpire = vi.fn();
    startIdleWatch({ limitMs: 60000, onExpire, storage, target, now: () => clock });
    expect(readActivity(storage)).toBe(1_000_000);
    advance(59000);
    expect(onExpire).not.toHaveBeenCalled();
    advance(31000);
    expect(onExpire).toHaveBeenCalledTimes(1);
    advance(120000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('la actividad del usuario reinicia el reloj', () => {
    const onExpire = vi.fn();
    startIdleWatch({ limitMs: 60000, onExpire, storage, target, now: () => clock });
    advance(45000);
    target.dispatchEvent(new Event('pointerdown'));
    advance(45000);
    expect(onExpire).not.toHaveBeenCalled();
    advance(30000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('la actividad en otra pestaña también mantiene viva la sesión', () => {
    const onExpire = vi.fn();
    startIdleWatch({ limitMs: 60000, onExpire, storage, target, now: () => clock });
    advance(50000);
    storage.setItem(ACTIVITY_KEY, clock);
    advance(50000);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('al detenerla deja de vigilar', () => {
    const onExpire = vi.fn();
    const stop = startIdleWatch({ limitMs: 60000, onExpire, storage, target, now: () => clock });
    stop();
    advance(600000);
    expect(onExpire).not.toHaveBeenCalled();
  });
});
