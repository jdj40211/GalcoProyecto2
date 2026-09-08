import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

http.interceptors.request.use(async (config) => {
  const auth = useAuthStore();
  const token = await auth.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (auth.user) {
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
    if (normalized.status === 401) useAuthStore().clear();
    return Promise.reject(normalized);
  }
);

export default http;
