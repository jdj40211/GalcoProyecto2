<template>
  <form class="forgot-form" @submit.prevent="send">
    <p class="forgot-intro">
      Escribe tu usuario y te enviaremos a tu correo institucional un enlace para crear una contraseña nueva.
    </p>
    <div v-if="error" class="alert alert-danger" role="alert"><i class="fas fa-circle-exclamation"></i>{{ error }}</div>
    <div v-else-if="sent" class="alert" role="status">
      <i class="fas fa-envelope-circle-check"></i>Si el usuario existe, enviamos el enlace a {{ sentTo }}. Revisa
      también la carpeta de correo no deseado; el enlace vence en una hora.
    </div>
    <div class="form-group">
      <label for="reset-username">Usuario o correo</label>
      <div class="input-icon-wrap">
        <i class="fas fa-user"></i
        ><input id="reset-username" v-model.trim="usuario" autocomplete="username" required placeholder="Tu usuario" />
      </div>
    </div>
    <div class="button-row">
      <button class="btn btn-primary" :disabled="sending || cooldown > 0">
        <span v-if="sending" class="spinner"></span><i v-else class="fas fa-paper-plane"></i
        >{{ cooldown > 0 ? `Reenviar en ${cooldown} s` : 'Enviar enlace' }}
      </button>
      <button class="btn btn-outline" type="button" @click="$emit('close')">Volver</button>
    </div>
  </form>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { emailFor, requestPasswordReset } from '@/services/password-reset';

const props = defineProps({ initialUser: { type: String, default: '' } });
defineEmits(['close']);
const usuario = ref(props.initialUser);
const sending = ref(false);
const sent = ref(false);
const sentTo = ref('');
const error = ref('');
// Una espera entre envíos evita llenar el buzón y los bloqueos por exceso de solicitudes.
const cooldown = ref(0);
let timer;

async function send() {
  error.value = '';
  sent.value = false;
  sending.value = true;
  try {
    await requestPasswordReset(usuario.value);
    sentTo.value = emailFor(usuario.value);
    sent.value = true;
    cooldown.value = 60;
    clearInterval(timer);
    timer = setInterval(() => {
      cooldown.value -= 1;
      if (cooldown.value <= 0) clearInterval(timer);
    }, 1000);
  } catch (err) {
    error.value = err.message;
  } finally {
    sending.value = false;
  }
}
onBeforeUnmount(() => clearInterval(timer));
</script>
