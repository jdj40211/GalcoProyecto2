// Control de inactividad de la sesión (HU-02). La última actividad se guarda en localStorage
// para que todas las pestañas abiertas compartan el mismo reloj.
export const ACTIVITY_KEY = 'galco.session.lastActivity';
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'];
const WRITE_EVERY_MS = 15000;
const CHECK_EVERY_MS = 30000;

export function idleLimitMs(minutes = import.meta.env.VITE_SESSION_IDLE_MINUTES) {
  const value = Number(minutes);
  return (Number.isFinite(value) && value >= 1 ? value : 30) * 60000;
}

export function readActivity(storage = globalThis.localStorage) {
  try {
    return Number(storage?.getItem(ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function recordActivity(storage = globalThis.localStorage, now = Date.now()) {
  try {
    storage?.setItem(ACTIVITY_KEY, String(now));
  } catch {
    /* almacenamiento bloqueado: la sesión sigue controlada en esta pestaña */
  }
}

export function clearActivity(storage = globalThis.localStorage) {
  try {
    storage?.removeItem(ACTIVITY_KEY);
  } catch {
    /* almacenamiento bloqueado */
  }
}

export const isIdleExpired = (lastActivity, limitMs, now = Date.now()) =>
  lastActivity > 0 && now - lastActivity >= limitMs;

export function startIdleWatch({
  limitMs = idleLimitMs(),
  onExpire,
  storage = globalThis.localStorage,
  target = globalThis.window,
  now = () => Date.now()
}) {
  let lastWrite = 0;
  let expired = false;
  const touch = () => {
    const current = now();
    if (current - lastWrite < WRITE_EVERY_MS) return;
    lastWrite = current;
    recordActivity(storage, current);
  };
  const check = () => {
    if (expired || !isIdleExpired(readActivity(storage), limitMs, now())) return;
    expired = true;
    stop();
    onExpire();
  };
  // Al volver a una pestaña dormida se revisa de inmediato, sin esperar el intervalo.
  const doc = target?.document;
  const onVisible = () => {
    if (doc?.visibilityState !== 'hidden') check();
  };

  recordActivity(storage, now());
  lastWrite = now();
  ACTIVITY_EVENTS.forEach((name) => target?.addEventListener(name, touch, { passive: true }));
  doc?.addEventListener('visibilitychange', onVisible);
  const timer = setInterval(check, Math.min(CHECK_EVERY_MS, limitMs));

  function stop() {
    clearInterval(timer);
    ACTIVITY_EVENTS.forEach((name) => target?.removeEventListener(name, touch));
    doc?.removeEventListener('visibilitychange', onVisible);
  }
  return stop;
}
