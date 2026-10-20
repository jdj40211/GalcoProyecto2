<template>
  <section class="card card-pad">
    <h2>Legalización de viáticos</h2>
    <p>Selecciona los soportes aprobados de tu viaje y compara su valor con el anticipo recibido.</p>
    <p v-if="error" class="alert error" role="alert">{{ error }}</p>
    <p v-if="loading">Cargando viajes y soportes…</p>
    <form v-else @submit.prevent="settle">
      <div class="form-group">
        <label for="settlement-request">Solicitud aprobada</label>
        <select id="settlement-request" v-model="selected" required @change="ids = []">
          <option value="">Selecciona un viaje</option>
          <option v-for="item in approved" :key="item.id" :value="item.id">
            {{ item.consecutivo }} — {{ item.destino }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label for="settlement-advance">Anticipo recibido (COP)</label>
        <input id="settlement-advance" v-model.number="advance" type="number" min="0" step="0.01" required />
      </div>
      <fieldset v-if="selected">
        <legend>Soportes aprobados por Contabilidad</legend>
        <p v-if="!available.length">
          No hay soportes aprobados asociados. Carga el comprobante, selecciona este viaje y solicita su revisión.
        </p>
        <label v-for="item in available" :key="item.id" class="receipt-option">
          <input v-model="ids" type="checkbox" :value="item.id" /> {{ item.concepto }} —
          {{ formatCurrency(item.valor) }}
        </label>
      </fieldset>
      <p>
        Total real: <strong>{{ formatCurrency(total) }}</strong>
      </p>
      <p>
        {{ advance - total >= 0 ? 'Por reintegrar a GALCO' : 'Por reembolsar al empleado' }}:
        <strong>{{ formatCurrency(Math.abs(advance - total)) }}</strong>
      </p>
      <button class="btn btn-primary" :disabled="busy || !selected || !ids.length">Confirmar legalización</button>
    </form>
    <h3>Viajes legalizados</h3>
    <p v-if="!closed.length">Aún no hay legalizaciones.</p>
    <article v-for="item in closed" :key="item.id" class="card card-pad">
      <strong>{{ item.consecutivo }} — {{ item.destino }}</strong>
      <p>
        Anticipo: {{ formatCurrency(item.legalizacion.anticipo) }} · Gastos:
        {{ formatCurrency(item.legalizacion.totalReal) }}
      </p>
      <p>{{ item.legalizacion.resultado }}: {{ formatCurrency(Math.abs(item.legalizacion.saldo)) }}</p>
    </article>
  </section>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue';
import http from '@/services/http';
import { formatCurrency } from '@/services/format';
const requests = ref([]),
  receipts = ref([]),
  selected = ref(''),
  ids = ref([]),
  advance = ref(0);
const loading = ref(true),
  busy = ref(false),
  error = ref('');
const approved = computed(() => requests.value.filter((item) => item.estado === 'aprobada'));
const closed = computed(() => requests.value.filter((item) => item.estado === 'legalizada'));
const available = computed(() =>
  receipts.value.filter(
    (item) => item.solicitudId === selected.value && item.estado === 'aprobado' && item.moneda === 'COP'
  )
);
const total = computed(() =>
  available.value.filter((item) => ids.value.includes(item.id)).reduce((sum, item) => sum + item.valor, 0)
);
async function load() {
  try {
    const [r, s] = await Promise.all([http.get('/solicitudes-viaticos'), http.get('/viaticos')]);
    requests.value = r.data.items;
    receipts.value = s.data.items;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
async function settle() {
  busy.value = true;
  error.value = '';
  try {
    await http.post(`/solicitudes-viaticos/${selected.value}/legalizar`, {
      anticipo: advance.value,
      soportes: ids.value
    });
    selected.value = '';
    ids.value = [];
    await load();
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
onMounted(load);
</script>
<style scoped>
.receipt-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}
.receipt-option input {
  width: 20px;
  height: 20px;
  min-height: 20px;
  flex: 0 0 20px;
  margin: 0;
}
fieldset {
  margin: 16px 0;
  border: 1px solid #dce2eb;
  border-radius: 8px;
}
</style>
