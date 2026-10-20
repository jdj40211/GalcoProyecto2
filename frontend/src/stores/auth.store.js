import { defineStore } from 'pinia';
import axios from 'axios';
import { auth as firebaseAuth, isFirebaseConfigured } from '@/services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const SESSION_KEY = 'galco.viaticos.session';
const demo = !isFirebaseConfigured || import.meta.env.VITE_AUTH_BYPASS === 'true';
const sessionApi = axios.create({ baseURL: import.meta.env.VITE_API_BASE || '/api' });

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
        this.token = sessionStorage.getItem(`${SESSION_KEY}.token`);
        this.expiresAt = Number(sessionStorage.getItem(`${SESSION_KEY}.expires`));
        if (!this.token || this.expiresAt <= Date.now()) this.clear();
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
        const { data } = await sessionApi.post('/sesion', { usuario, password });
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
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
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
