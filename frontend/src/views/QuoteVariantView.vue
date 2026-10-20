<template>
  <section class="card card-pad">
    <h2>Editar variante {{ quote?.consecutivo }}</h2>
    <p>El original se conserva al duplicarlo. Guardar cambios recalcula esta variante con los precios vigentes.</p>
    <p v-if="error" class="alert error" role="alert">{{ error }}</p>
    <p v-if="loading">Cargando cotización…</p>
    <form v-else-if="quote" @submit.prevent="save">
      <div class="form-group">
        <label for="variant-client">Cliente</label
        ><input id="variant-client" v-model="quote.metadata.cliente" required />
      </div>
      <div class="form-group">
        <label for="variant-seller">Vendedor</label
        ><input id="variant-seller" :value="quote.metadata.vendedor" readonly />
      </div>
      <div class="form-group">
        <label for="variant-type">Tipo de poste</label>
        <select id="variant-type" v-model="quote.configuracion.tipoPoste" @change="resetArm">
          <option v-for="t in catalog.tiposPoste" :key="t">{{ t }}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="variant-height">Altura</label
        ><select id="variant-height" v-model.number="quote.configuracion.altura">
          <option v-for="h in catalog.alturas" :key="h" :value="h">{{ h }}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="variant-arm">Brazo / ancho</label>
        <select v-if="arms" id="variant-arm" v-model.number="quote.configuracion.brazo">
          <option v-for="a in arms" :key="a" :value="a">{{ a }}</option>
        </select>
        <input
          v-else
          id="variant-arm"
          v-model.number="quote.configuracion.brazo"
          type="number"
          min="0.1"
          max="20"
          step="0.1"
          required
        />
      </div>
      <div class="form-group">
        <label for="variant-quantity">Cantidad</label
        ><input
          id="variant-quantity"
          v-model.number="quote.configuracion.cantidad"
          type="number"
          min="1"
          max="10000"
          required
        />
      </div>
      <div class="form-group">
        <label for="variant-paint">Pintura</label
        ><select id="variant-paint" v-model="quote.configuracion.pintura">
          <option :value="true">Sí</option>
          <option :value="false">No</option>
        </select>
      </div>
      <div class="form-group">
        <label for="variant-validity">Vigencia</label
        ><input id="variant-validity" v-model="quote.metadata.vigenciaHasta" type="date" required />
      </div>
      <p>Último total guardado: {{ money(quote.precios.precioFinal) }}</p>
      <button class="btn btn-primary" :disabled="busy || quote.estado !== 'borrador'">Guardar variante</button>
      <RouterLink class="btn btn-outline" to="/cotizador/historial">Volver al historial</RouterLink>
      <p role="status">{{ message }}</p>
    </form>
  </section>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import http from '@/services/http';
import api from '@/services/cotizador.service';
import { money } from '@/services/format';
const route = useRoute(),
  quote = ref(null),
  catalog = ref(null),
  loading = ref(true),
  busy = ref(false),
  error = ref(''),
  message = ref('');
const arms = computed(() => catalog.value?.brazos[quote.value?.configuracion.tipoPoste]);
function resetArm() {
  quote.value.configuracion.brazo = arms.value?.[0] || 1;
}
async function save() {
  busy.value = true;
  error.value = '';
  message.value = '';
  try {
    const { cliente, observaciones, vigenciaHasta } = quote.value.metadata;
    const metadata = { cliente, observaciones, vigenciaHasta };
    quote.value = (
      await http.put(`/cotizador/${route.params.id}`, { configuracion: quote.value.configuracion, metadata })
    ).data.data;
    message.value = 'Variante guardada y recalculada.';
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
onMounted(async () => {
  try {
    [quote.value, catalog.value] = await Promise.all([api.obtener(route.params.id), api.catalogos()]);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>
