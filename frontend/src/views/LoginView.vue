<template>
  <main class="login-page">
    <section class="login-wrap" aria-labelledby="login-title">
      <div class="login-brand">
        <div class="login-logo-box"><img src="/logo-galco.png" alt="Galco" /></div>
        <h1 id="login-title">Suite de Operaciones</h1>
        <p>Viáticos y cotización de postes</p>
      </div>
      <form class="login-card" @submit.prevent="submit">
        <div v-if="error" class="alert alert-danger" role="alert">
          <i class="fas fa-circle-exclamation"></i>{{ error }}
        </div>
        <div class="form-group">
          <label for="username">Usuario</label>
          <div class="input-icon-wrap">
            <i class="fas fa-user"></i
            ><input
              id="username"
              v-model.trim="username"
              autocomplete="username"
              required
              autofocus
              placeholder="Tu usuario"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="input-icon-wrap">
            <i class="fas fa-lock"></i>
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              placeholder="Tu contraseña"
            />
            <button
              class="input-action"
              type="button"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPassword = !showPassword"
            >
              <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
          </div>
        </div>
        <button class="btn btn-primary btn-block btn-lg" :disabled="loading">
          <span v-if="loading" class="spinner"></span><i v-else class="fas fa-sign-in-alt"></i
          >{{ loading ? 'Ingresando…' : 'Iniciar sesión' }}
        </button>
        <div v-if="devMode" class="login-hint">
          <strong>Usuarios de prueba</strong>
          <div><span class="role-badge role-comercial">Comercial</span><code>jdiaz</code> / <code>1234</code></div>
          <div>
            <span class="role-badge role-contabilidad">Contabilidad</span><code>acastro</code> / <code>conta2024</code>
          </div>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');
const devMode = import.meta.env.VITE_AUTH_BYPASS === 'true' || !import.meta.env.VITE_FIREBASE_API_KEY;

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(username.value, password.value);
    await auth.init();
    const destination = route.query.redirect || (auth.isAccounting ? '/contabilidad' : '/carga');
    await router.replace(destination);
  } catch (_err) {
    error.value = 'Usuario o contraseña incorrectos.';
  } finally {
    loading.value = false;
  }
}
</script>
