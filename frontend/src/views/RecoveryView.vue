<template>
  <main class="login-page">
    <section class="login-wrap">
      <h1>Recuperar contraseña</h1>
      <form class="login-card" @submit.prevent="submit">
        <label for="recovery-email">Correo institucional</label>
        <input id="recovery-email" v-model.trim="email" type="email" autocomplete="email" required />
        <p v-if="message" role="status">{{ message }}</p>
        <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
        <button class="btn btn-primary" :disabled="busy">Solicitar recuperación</button>
        <RouterLink class="btn btn-ghost" to="/login">Volver al ingreso</RouterLink>
      </form>
    </section>
  </main>
</template>
<script setup>
import { ref } from 'vue';
import { requestRecovery } from '@/services/recovery';
const email = ref(''),
  busy = ref(false),
  message = ref(''),
  error = ref('');
async function submit() {
  busy.value = true;
  message.value = '';
  error.value = '';
  try {
    message.value = await requestRecovery(email.value);
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
</script>
