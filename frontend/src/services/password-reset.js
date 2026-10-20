// Recuperación de contraseña con Firebase (HU-04). Firebase envía el correo con el enlace;
// la respuesta es la misma exista o no la cuenta, para no revelar qué usuarios hay.
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth as firebaseAuth } from '@/services/firebase';
import { isAuthDevMode } from '@/stores/auth.store';

const resetErrors = {
  'auth/invalid-email': 'Escribe un usuario o un correo válido.',
  'auth/missing-email': 'Escribe tu usuario o tu correo.',
  'auth/too-many-requests': 'Se enviaron demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'Sin conexión con el servicio de autenticación. Revisa tu conexión a internet.'
};

// El usuario corto (jdiaz) se completa con el dominio institucional, igual que en el inicio de sesión.
export const emailFor = (usuario, domain = import.meta.env.VITE_FIREBASE_EMAIL_DOMAIN || 'galco.com.co') =>
  usuario.includes('@') ? usuario : `${usuario}@${domain}`;

export async function requestPasswordReset(usuario) {
  const value = String(usuario || '').trim();
  if (!value) throw new Error(resetErrors['auth/missing-email']);
  if (isAuthDevMode()) throw new Error('La recuperación de contraseña no está disponible en el modo de prueba.');
  firebaseAuth.languageCode = 'es';
  try {
    await sendPasswordResetEmail(firebaseAuth, emailFor(value));
  } catch (error) {
    // Una cuenta inexistente recibe el mismo mensaje que una existente.
    if (error.code === 'auth/user-not-found') return;
    throw new Error(resetErrors[error.code] || 'No fue posible enviar el enlace. Inténtalo de nuevo.', {
      cause: error
    });
  }
}
