import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

export async function requestRecovery(
  email,
  provider = sendPasswordResetEmail,
  enabled = isFirebaseConfigured && import.meta.env.VITE_AUTH_BYPASS !== 'true'
) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Escribe un correo válido.');
  if (!enabled)
    throw new Error(
      'La recuperación por correo requiere Firebase configurado. En demo, usa las credenciales de prueba.'
    );
  try {
    await provider(auth, email);
  } catch (error) {
    if (!['auth/user-not-found', 'auth/invalid-email'].includes(error.code))
      throw new Error('No fue posible solicitar la recuperación. Intenta más tarde.', { cause: error });
  }
  return 'Si el correo corresponde a una cuenta habilitada, recibirás instrucciones para recuperar el acceso.';
}
