<template>
  <section class="card card-pad">
    <h2>Notificaciones</h2>
    <p>Actualizaciones de tus solicitudes de viáticos.</p>
    <button class="btn btn-outline" :disabled="loading" @click="load">Actualizar</button>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="loading">Cargando…</p>
    <p v-else-if="!items.length">No tienes notificaciones.</p>
    <article v-for="item in items" :key="item.id" class="card card-pad">
      <strong>{{ item.mensaje }}</strong>
      <p>{{ new Date(item.fecha).toLocaleString('es-CO') }}</p>
      <button v-if="!item.leida" class="btn btn-primary" @click="read(item)">Marcar como leída</button>
      <span v-else>Leída</span>
    </article>
  </section>
</template>
<script setup>
import { onMounted, ref } from 'vue';
import http from '@/services/http';
const items = ref([]),
  error = ref(''),
  loading = ref(false);
async function load() {
  loading.value = true;
  error.value = '';
  try {
    items.value = (await http.get('/notificaciones')).data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
async function read(item) {
  try {
    await http.patch(`/notificaciones/${item.id}/leer`);
    item.leida = true;
  } catch (err) {
    error.value = err.message;
  }
}
onMounted(load);
</script>
