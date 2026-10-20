import { defineStore } from 'pinia';
import { auth as firebaseAuth, isFirebaseConfigured } from '@/services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { clearActivity, idleLimitMs, isIdleExpired, readActivity, recordActivity } from '@/services/session';

const SESSION_KEY = 'galco.viaticos.session';
const ROLES = ['comercial', 'contabilidad'];
const devMode = () => !isFirebaseConfigured || import.meta.env.VITE_AUTH_BYPASS === 'true';

const loginErrors = {
  'auth/invalid-credential': 'Usuario o contraseña incorrectos.',
  'auth/invalid-email': 'Usuario o contraseña incorrectos.',
  'auth/user-not-found': 'Usuario o contraseña incorrectos.',
  'auth/wrong-password': 'Usuario o contraseña incorrectos.',
  'auth/user-disabled': 'Este usuario está desactivado. Contacta al administrador.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'Sin conexión con el servicio de autenticación. Revisa tu conexión a internet.'
};

export { devMode as isAuthDevMode };

export const useAuthStore = defineStore('auth', {
  // endReason explica en el login por qué se cerró la sesión: 'inactividad' o 'expirada'.
  state: () => ({ user: null, ready: false, token: null, expiresAt: 0, endReason: '' }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    isAccounting: (state) => state.user?.rol === 'contabilidad',
    isCommercial: (state) => state.user?.rol === 'comercial'
  },
  actions: {
    async setFirebaseUser(fbUser) {
      if (!fbUser) {
        this.clear();
        return;
      }
      const result = await fbUser.getIdTokenResult();
      const claims = result.claims || {};
      // Solo las cuentas con rol asignado por el script de usuarios pueden entrar.
      if (!ROLES.includes(claims.role)) {
        await signOut(firebaseAuth);
        this.clear();
        throw new Error('Tu usuario no tiene un rol asignado. Contacta al administrador.');
      }
      this.user = {
        uid: fbUser.uid,
        nombre: fbUser.displayName || claims.name || fbUser.email,
        usuario: claims.usuario || fbUser.email,
        rol: claims.role,
        email: fbUser.email
      };
      this.token = result.token;
      this.expiresAt = new Date(result.expirationTime).getTime();
    },
    async init() {
      if (this.ready) return;
      if (devMode()) {
        try {
          this.user = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
        } catch {
          this.user = null;
        }
        this.token = this.user ? 'dev-token' : null;
        await this.expireIfIdle();
        this.ready = true;
        return;
      }
      await new Promise((resolve) =>
        onAuthStateChanged(firebaseAuth, async (fbUser) => {
          try {
            await this.setFirebaseUser(fbUser);
          } catch {
            this.clear();
          }
          if (!this.ready) await this.expireIfIdle();
          this.ready = true;
          resolve();
        })
      );
    },
    async login(usuario, password) {
      if (devMode()) {
        const users = [
          { nombre: 'Juan Díaz', usuario: 'jdiaz', password: '1234', rol: 'comercial' },
          { nombre: 'Laura Gómez', usuario: 'lgomez', password: '1234', rol: 'comercial' },
          { nombre: 'Carlos Rueda', usuario: 'crueda', password: '1234', rol: 'comercial' },
          { nombre: 'Andrés Castro', usuario: 'acastro', password: 'conta2024', rol: 'contabilidad' }
        ];
        const found = users.find((item) => item.usuario === usuario && item.password === password);
        if (!found) throw new Error('Usuario o contraseña incorrectos.');
        this.user = { nombre: found.nombre, usuario: found.usuario, rol: found.rol, uid: `dev-${found.usuario}` };
        this.token = 'dev-token';
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.user));
        this.startSession();
        return;
      }
      const email = usuario.includes('@')
        ? usuario
        : `${usuario}@${import.meta.env.VITE_FIREBASE_EMAIL_DOMAIN || 'galco.com.co'}`;
      let credential;
      try {
        credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      } catch (error) {
        throw new Error(loginErrors[error.code] || 'No fue posible iniciar sesión.', { cause: error });
      }
      await this.setFirebaseUser(credential.user);
      this.startSession();
    },
    startSession() {
      this.endReason = '';
      recordActivity();
    },
    // Una sesión que quedó abierta más allá del límite de inactividad (pestaña cerrada,
    // equipo suspendido) se cierra al volver a abrir la aplicación.
    async expireIfIdle() {
      if (this.user && isIdleExpired(readActivity(), idleLimitMs())) await this.logout('inactividad');
    },
    async getToken() {
      if (devMode()) return this.token;
      if (!firebaseAuth?.currentUser) return null;
      return firebaseAuth.currentUser.getIdToken(Date.now() > this.expiresAt - 60000);
    },
    async logout(reason = '') {
      if (isFirebaseConfigured && firebaseAuth) {
        await signOut(firebaseAuth);
      }
      this.clear();
      clearActivity();
      this.endReason = reason;
    },
    clear() {
      this.user = null;
      this.token = null;
      this.expiresAt = 0;
      sessionStorage.removeItem(SESSION_KEY);
    }
  }
});
