<!--
  QuoteIndicatorsView.vue

  Indicadores de cotizaciones (HU-12): resultados, tiempos de respuesta y desgloses.
  Un comercial ve los de sus cotizaciones; contabilidad ve los de todos los vendedores.
-->

<template>
  <div class="page">
    <header class="module-heading">
      <div>
        <div class="eyebrow">GALCO · Cotizador</div>
        <h2>Indicadores de cotizaciones</h2>
      </div>
      <div class="head-actions">
        <router-link to="/cotizador/historial" class="btn btn-ghost">
          <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
          Ver historial
        </router-link>
      </div>
    </header>

    <section class="card card-pad mb-4">
      <div class="filters">
        <div>
          <label for="indicators-from">Desde</label>
          <input id="indicators-from" v-model="filtros.desde" type="date" :max="filtros.hasta || undefined" />
        </div>
        <div>
          <label for="indicators-to">Hasta</label>
          <input id="indicators-to" v-model="filtros.hasta" type="date" :min="filtros.desde || undefined" />
        </div>
        <div class="filter-actions">
          <button class="btn btn-ghost" type="button" @click="limpiar">
            <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
            Todo el período
          </button>
        </div>
      </div>
    </section>

    <div v-if="cargando && !datos" class="loading-state">
      <span class="spinner spinner-primary"></span>Calculando indicadores…
    </div>
    <EmptyState
      v-else-if="datos && !datos.total"
      icon="fa-chart-line"
      title="Sin cotizaciones en el período"
      message="Cambia las fechas o crea una cotización para ver sus indicadores."
    />
    <template v-else-if="datos">
      <div class="kpi-grid">
        <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card">
          <div class="kpi-icon" :class="kpi.class"><i class="fas" :class="kpi.icon"></i></div>
          <div>
            <strong>{{ kpi.value }}</strong
            ><span>{{ kpi.label }}</span>
            <small v-if="kpi.hint" class="kpi-hint">{{ kpi.hint }}</small>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-box">
          <h3><i class="fas fa-chart-column"></i>Valor cotizado por mes</h3>
          <div class="chart-canvas"><canvas ref="monthCanvas" aria-label="Valor cotizado por mes"></canvas></div>
        </div>
        <div class="chart-box">
          <h3><i class="fas fa-chart-pie"></i>Cotizaciones por estado</h3>
          <div class="chart-canvas"><canvas ref="stateCanvas" aria-label="Cotizaciones por estado"></canvas></div>
        </div>
      </div>

      <div v-if="!auth.isCommercial" class="table-wrapper chart-table">
        <table class="data-table">
          <caption>
            Resultados por vendedor
          </caption>
          <thead>
            <tr>
              <th>Vendedor</th>
              <th class="num">Cotizaciones</th>
              <th class="num">Valor cotizado</th>
              <th class="num">Aprobadas</th>
              <th class="num">Rechazadas</th>
              <th class="num">Tasa de aprobación</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in datos.porVendedor" :key="row.nombre">
              <td>{{ row.nombre }}</td>
              <td class="num">{{ row.cantidad }}</td>
              <td class="num">{{ money(row.valor) }}</td>
              <td class="num">{{ row.aprobadas }}</td>
              <td class="num">{{ row.rechazadas }}</td>
              <td class="num">{{ rate(row) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-wrapper chart-table">
        <table class="data-table">
          <caption>
            Resultados por tipo de poste
          </caption>
          <thead>
            <tr>
              <th>Tipo de poste</th>
              <th class="num">Cotizaciones</th>
              <th class="num">Valor cotizado</th>
              <th class="num">Aprobadas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in datos.porTipoPoste" :key="row.nombre">
              <td>{{ row.nombre }}</td>
              <td class="num">{{ row.cantidad }}</td>
              <td class="num">{{ money(row.valor) }}</td>
              <td class="num">{{ row.aprobadas }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-sm text-mute">
        Los tiempos promedian solo las cotizaciones con historial de estados; las anteriores a esta versión cuentan en
        los totales.
      </p>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import EmptyState from '@/components/EmptyState.vue';
import cotizadorApi from '@/services/cotizador.service';
import { formatDuration, money } from '@/services/format';
import { quoteStates } from '@/config/domain';
import { useAuthStore } from '@/stores/auth.store';
import { useToastStore } from '@/stores/toast.store';

const auth = useAuthStore();
const toast = useToastStore();
const filtros = reactive({ desde: '', hasta: '' });
const datos = ref(null);
const cargando = ref(false);
const monthCanvas = ref(null);
const stateCanvas = ref(null);
let monthChart;
let stateChart;

const decididas = computed(() => datos.value.porEstado.aprobada.cantidad + datos.value.porEstado.rechazada.cantidad);
const kpis = computed(() => [
  { label: 'Cotizaciones', value: datos.value.total, icon: 'fa-file-invoice-dollar', class: 'kpi-info' },
  { label: 'Valor cotizado', value: money(datos.value.valorTotal), icon: 'fa-sack-dollar', class: 'kpi-primary' },
  { label: 'Valor aprobado', value: money(datos.value.valorAprobado), icon: 'fa-circle-check', class: 'kpi-success' },
  {
    label: 'Tasa de aprobación',
    value: datos.value.tasaAprobacion == null ? '—' : `${datos.value.tasaAprobacion.toLocaleString('es-CO')} %`,
    hint: decididas.value ? `de ${decididas.value} decididas` : 'Aún no hay cotizaciones decididas',
    icon: 'fa-percent',
    class: 'kpi-accent'
  },
  {
    label: 'Tiempo de respuesta',
    value: formatDuration(datos.value.tiempoRespuestaHoras),
    hint: 'De creada a enviada al cliente',
    icon: 'fa-stopwatch',
    class: 'kpi-warning'
  },
  {
    label: 'Tiempo de decisión',
    value: formatDuration(datos.value.tiempoDecisionHoras),
    hint: 'De enviada a aprobada o rechazada',
    icon: 'fa-hourglass-half',
    class: 'kpi-info'
  }
]);
const rate = (row) => {
  const total = row.aprobadas + row.rechazadas;
  return total ? `${Math.round((row.aprobadas / total) * 100)} %` : '—';
};
const monthName = (key) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
};

let timer;
watch(filtros, () => {
  clearTimeout(timer);
  timer = setTimeout(cargar, 150);
});
onMounted(cargar);
onBeforeUnmount(destruir);

async function cargar() {
  cargando.value = true;
  try {
    const params = {};
    if (filtros.desde) params.desde = filtros.desde;
    if (filtros.hasta) params.hasta = filtros.hasta;
    datos.value = await cotizadorApi.indicadores(params);
  } catch (error) {
    toast.show(error.message, 'danger');
  } finally {
    cargando.value = false;
    await nextTick();
    dibujar();
  }
}
function limpiar() {
  Object.assign(filtros, { desde: '', hasta: '' });
}
function destruir() {
  monthChart?.destroy();
  stateChart?.destroy();
  monthChart = null;
  stateChart = null;
}
function dibujar() {
  destruir();
  if (!datos.value?.total) return;
  const colors = {
    borrador: '#9CA3AF',
    enviada: '#0053A1',
    aprobada: '#7DB928',
    rechazada: '#DC2626',
    anulada: '#4B5563'
  };
  if (monthCanvas.value)
    monthChart = new Chart(monthCanvas.value, {
      type: 'bar',
      data: {
        labels: datos.value.porMes.map((row) => monthName(row.nombre)),
        datasets: [
          {
            data: datos.value.porMes.map((row) => row.valor),
            backgroundColor: '#0053A1',
            borderRadius: 6,
            maxBarThickness: 56
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const row = datos.value.porMes[ctx.dataIndex];
                return `${money(row.valor)} · ${row.cantidad} cotizaciones · ${row.aprobadas} aprobadas`;
              }
            }
          }
        },
        scales: { y: { beginAtZero: true, ticks: { callback: (value) => `$${Math.round(value / 1e6)} M` } } }
      }
    });
  const keys = Object.keys(datos.value.porEstado).filter((key) => datos.value.porEstado[key].cantidad);
  if (stateCanvas.value)
    stateChart = new Chart(stateCanvas.value, {
      type: 'doughnut',
      data: {
        labels: keys.map((key) => quoteStates[key]),
        datasets: [
          {
            data: keys.map((key) => datos.value.porEstado[key].cantidad),
            backgroundColor: keys.map((key) => colors[key]),
            borderWidth: 2,
            borderColor: '#fff'
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}
</script>

<style scoped>
.page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 0 60px;
}
.module-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  margin-bottom: 24px;
}
.module-heading > div:first-child {
  padding-left: 12px;
  border-left: 4px solid var(--accent);
}
.module-heading h2 {
  margin: 0;
  color: var(--primary);
  font-size: 26px;
}
.module-heading .eyebrow {
  margin-bottom: 2px;
}
.head-actions {
  display: flex;
  gap: 10px;
}
.filters {
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(0, 220px) auto;
  gap: 14px;
  align-items: end;
}
/* Los campos de fecha tienen un ancho mínimo propio: sin esto se salen de la grilla en celular. */
.filters > div {
  min-width: 0;
}
.filters input {
  min-width: 0;
}
/* Seis indicadores: dos filas de tres, sin huecos. */
.kpi-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
@media (max-width: 1000px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 700px) {
  .page {
    padding: 0 0 40px;
  }
  .module-heading {
    margin-bottom: 20px;
    gap: 12px;
  }
  .module-heading .btn {
    width: auto;
    min-height: 38px;
    padding: 8px 10px;
    font-size: 12px;
  }
  .module-heading h2 {
    font-size: 23px;
  }
  .filters {
    grid-template-columns: 1fr;
  }
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
