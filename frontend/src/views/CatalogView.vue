<template>
  <section class="card card-pad">
    <h2>Configuraciones de postes</h2>
    <form @submit.prevent="load">
      <label for="catalog-query">Código, nombre o tipo</label><input id="catalog-query" v-model="query" /><button
        class="btn btn-primary"
        :disabled="loading"
      >
        Buscar
      </button>
    </form>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="loading">Cargando…</p>
    <p v-else-if="!items.length">No hay configuraciones que coincidan.</p>
    <article v-for="item in items" :key="item.codigo" class="card card-pad">
      <h3>{{ item.nombre }}</h3>
      <p>{{ item.codigo }} · {{ item.activo ? 'Activa' : 'Inactiva' }} · {{ item.acabado }}</p>
      <details>
        <summary>Ver componentes y especificaciones</summary>
        <p v-for="part in item.componentes" :key="part.id">{{ part.nombre }} × {{ part.cantidad }}</p>
        <p v-for="(tube, key) in item.tubos" :key="key">
          {{ tube.tipo }}: {{ tube.diametro || '2"' }} · {{ tube.pesoPorMetro }} kg/m
        </p>
        <p>{{ item.especificacionPendiente }}</p>
      </details>
      <RouterLink
        v-if="item.activo"
        class="btn btn-outline"
        :to="{ path: '/cotizador', query: { codigo: item.codigo } }"
        >Usar configuración</RouterLink
      >
      <button v-if="auth.isAccounting" class="btn btn-ghost" :disabled="loading" @click="toggle(item)">
        {{ item.activo ? 'Desactivar' : 'Activar' }}
      </button>
    </article>
  </section>
</template>
<script setup>
import { onMounted, ref } from 'vue';
import http from '@/services/http';
import { useAuthStore } from '@/stores/auth.store';
const auth = useAuthStore(),
  query = ref(''),
  items = ref([]),
  error = ref(''),
  loading = ref(false);
async function load() {
  loading.value = true;
  error.value = '';
  try {
    items.value = (
      await http.get('/cotizador/configuraciones', { params: { q: query.value, incluirInactivas: auth.isAccounting } })
    ).data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
async function toggle(item) {
  try {
    await http.patch(`/cotizador/configuraciones/${encodeURIComponent(item.codigo)}`, { activo: !item.activo });
    await load();
  } catch (err) {
    error.value = err.message;
  }
}
onMounted(load);
</script>
