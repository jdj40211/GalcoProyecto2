import { defineStore } from 'pinia';
import { auth as firebaseAuth, isFirebaseConfigured } from '@/services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const SESSION_KEY = 'galco.viaticos.session';

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, ready: false, token: null, expiresAt: 0 }),
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
      this.user = {
        uid: fbUser.uid,
        nombre: fbUser.displayName || claims.name || fbUser.email,
        usuario: claims.usuario || fbUser.email,
        rol: claims.role || 'comercial',
        email: fbUser.email
      };
      this.token = result.token;
      this.expiresAt = new Date(result.expirationTime).getTime();
    },
    async init() {
      if (this.ready) return;
      if (!isFirebaseConfigured || import.meta.env.VITE_AUTH_BYPASS === 'true') {
        try {
          this.user = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
        } catch {
          this.user = null;
        }
        this.token = this.user ? 'dev-token' : null;
        this.ready = true;
        return;
      }
      await new Promise((resolve) =>
        onAuthStateChanged(firebaseAuth, async (fbUser) => {
          await this.setFirebaseUser(fbUser);
          this.ready = true;
          resolve();
        })
      );
    },
    async login(usuario, password) {
      if (!isFirebaseConfigured || import.meta.env.VITE_AUTH_BYPASS === 'true') {
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
        return;
      }
      const email = usuario.includes('@')
        ? usuario
        : `${usuario}@${import.meta.env.VITE_FIREBASE_EMAIL_DOMAIN || 'galco.com.co'}`;
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      await this.setFirebaseUser(credential.user);
    },
    async getToken() {
      if (!isFirebaseConfigured || import.meta.env.VITE_AUTH_BYPASS === 'true') return this.token;
      if (!firebaseAuth?.currentUser) return null;
      return firebaseAuth.currentUser.getIdToken(Date.now() > this.expiresAt - 60000);
    },
    async logout() {
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
    }
  }
});
