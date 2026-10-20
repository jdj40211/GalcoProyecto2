import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendPasswordResetEmail = vi.fn();
const firebaseAuth = {};
let devMode = false;
vi.mock('firebase/auth', () => ({ sendPasswordResetEmail: (...args) => sendPasswordResetEmail(...args) }));
vi.mock('@/services/firebase', () => ({ auth: firebaseAuth }));
vi.mock('@/stores/auth.store', () => ({ isAuthDevMode: () => devMode }));

const { emailFor, requestPasswordReset } = await import('./password-reset');

describe('recuperación de contraseña', () => {
  beforeEach(() => {
    sendPasswordResetEmail.mockReset();
    devMode = false;
  });

  it('completa el usuario corto con el dominio institucional', () => {
    expect(emailFor('jdiaz', 'galco.com.co')).toBe('jdiaz@galco.com.co');
    expect(emailFor('ana@empresa.com', 'galco.com.co')).toBe('ana@empresa.com');
  });

  it('envía el correo en español al usuario indicado', async () => {
    await requestPasswordReset('  jdiaz ');
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(firebaseAuth, 'jdiaz@galco.com.co');
    expect(firebaseAuth.languageCode).toBe('es');
  });

  it('responde igual cuando la cuenta no existe', async () => {
    sendPasswordResetEmail.mockRejectedValue({ code: 'auth/user-not-found' });
    await expect(requestPasswordReset('nadie')).resolves.toBeUndefined();
  });

  it('explica los errores en español', async () => {
    sendPasswordResetEmail.mockRejectedValue({ code: 'auth/too-many-requests' });
    await expect(requestPasswordReset('jdiaz')).rejects.toThrow(/demasiadas solicitudes/);
    await expect(requestPasswordReset('')).rejects.toThrow(/usuario o tu correo/);
  });

  it('no intenta enviar nada en el modo de prueba', async () => {
    devMode = true;
    await expect(requestPasswordReset('jdiaz')).rejects.toThrow(/modo de prueba/);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
