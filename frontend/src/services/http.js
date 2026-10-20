import axios from 'axios';
import { isAuthDevMode, useAuthStore } from '@/stores/auth.store';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

http.interceptors.request.use(async (config) => {
  const auth = useAuthStore();
  const token = await auth.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // La cabecera de desarrollo solo aplica cuando el backend corre con AUTH_BYPASS.
  if (auth.user && isAuthDevMode()) {
    config.headers['X-Dev-User'] = encodeURIComponent(JSON.stringify(auth.user));
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = {
      status: error.response?.status || 0,
      message: error.response?.data?.message || error.message || 'No fue posible completar la operación.',
      details: error.response?.data || null
    };
    // Un token vencido o revocado cierra la sesión y lleva al login con el aviso correspondiente.
    const auth = useAuthStore();
    if (normalized.status === 401 && auth.user) {
      // Se marca antes de rechazar para que la pantalla que hizo la petición no muestre además un toast de error.
      auth.endReason = 'expirada';
      auth
        .logout('expirada')
        .then(() => import('@/router'))
        .then(({ default: router }) => router.replace({ name: 'login' }));
    }
    return Promise.reject(normalized);
  }
);

export default http;
