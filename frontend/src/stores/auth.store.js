import { defineStore } from 'pinia';
import axios from 'axios';
import { auth as firebaseAuth, isFirebaseConfigured } from '@/services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const SESSION_KEY = 'galco.viaticos.session';
const demo = !isFirebaseConfigured || import.meta.env.VITE_AUTH_BYPASS === 'true';
const sessionApi = axios.create({ baseURL: import.meta.env.VITE_API_BASE || '/api' });
const ROLES = ['admin', 'comercial', 'contabilidad'];
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
  state: () => ({ user: null, ready: false, token: null, expiresAt: 0 }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    isAccounting: (state) => state.user?.rol === 'contabilidad',
    isCommercial: (state) => state.user?.rol === 'comercial',
    home: (state) =>
      state.user?.rol === 'admin' ? '/usuarios' : state.user?.rol === 'contabilidad' ? '/contabilidad' : '/carga'
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
        this.token = sessionStorage.getItem(`${SESSION_KEY}.token`);
        this.expiresAt = Number(sessionStorage.getItem(`${SESSION_KEY}.expires`));
        if (!this.token || this.expiresAt <= Date.now()) this.clear();
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
          this.ready = true;
          resolve();
        })
      );
    },
    async login(usuario, password) {
      if (!isFirebaseConfigured || import.meta.env.VITE_AUTH_BYPASS === 'true') {
        let data;
        try {
          ({ data } = await sessionApi.post('/sesion', { usuario, password }));
        } catch (error) {
          throw new Error(error.response?.data?.message || 'No fue posible iniciar sesión.', { cause: error });
        }
        this.user = data.user;
        this.token = data.token;
        this.expiresAt = data.expiresAt;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.user));
        sessionStorage.setItem(`${SESSION_KEY}.token`, this.token);
        sessionStorage.setItem(`${SESSION_KEY}.expires`, String(this.expiresAt));
        this.ready = true;
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
    },
    async getToken() {
      if (demo) {
        if (this.expiresAt <= Date.now()) this.clear();
        return this.token;
      }
      if (!firebaseAuth?.currentUser) return null;
      return firebaseAuth.currentUser.getIdToken(Date.now() > this.expiresAt - 60000);
    },
    async logout() {
      if (demo && this.token) {
        try {
          await sessionApi.delete('/sesion', { headers: { Authorization: `Bearer ${this.token}` } });
        } finally {
          this.clear();
        }
        return;
      }
      if (isFirebaseConfigured && firebaseAuth) {
        await signOut(firebaseAuth);
      }
      this.clear();
    },
    clear() {
      this.user = null;
      this.token = null;
      this.expiresAt = 0;
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(`${SESSION_KEY}.token`);
      sessionStorage.removeItem(`${SESSION_KEY}.expires`);
    }
  }
});
