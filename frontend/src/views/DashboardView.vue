<template>
  <section class="card">
    <div class="card-header">
      <h2>Dashboard de análisis</h2>
      <p>Resumen visual del gasto en viáticos para el control financiero.</p>
    </div>
    <FiltersBar
      :model="filters"
      :users="users"
      show-user
      show-type
      id="dashboard"
      @update:model="Object.assign(filters, $event)"
      @clear="clearFilters"
    />
    <div v-if="loading" class="loading-state"><span class="spinner spinner-primary"></span>Cargando análisis…</div>
    <EmptyState
      v-else-if="!records.length"
      icon="fa-chart-pie"
      message="No hay datos para mostrar con los filtros seleccionados."
    />
    <template v-else>
      <div class="kpi-grid">
        <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card">
          <div class="kpi-icon" :class="kpi.class"><i class="fas" :class="kpi.icon"></i></div>
          <div>
            <strong>{{ kpi.value }}</strong
            ><span>{{ kpi.label }}</span>
          </div>
        </div>
      </div>
      <div class="charts-grid">
        <div class="chart-box">
          <h3><i class="fas fa-chart-column"></i>Gasto por tipo de gasto</h3>
          <div class="chart-canvas"><canvas ref="typeCanvas" aria-label="Gráfico de gasto por tipo"></canvas></div>
        </div>
        <div class="chart-box">
          <h3><i class="fas fa-chart-pie"></i>Viáticos por estado</h3>
          <div class="chart-canvas">
            <canvas ref="statusCanvas" aria-label="Gráfico de viáticos por estado"></canvas>
          </div>
        </div>
      </div>
      <div class="table-wrapper chart-table">
        <table class="data-table">
          <caption>
            Datos representados en las gráficas
          </caption>
          <thead>
            <tr>
              <th>Tipo de gasto</th>
              <th>Cantidad</th>
              <th>Valor total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in accessibleRows" :key="row.type">
              <td>{{ row.type }}</td>
              <td>{{ row.count }}</td>
              <td>{{ formatCurrency(row.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import FiltersBar from '@/components/FiltersBar.vue';
import EmptyState from '@/components/EmptyState.vue';
import { expenseTypes, statuses } from '@/config/domain';
import { formatCurrency } from '@/services/format';
import { viaticosService } from '@/services/viaticos.service';
import { useToastStore } from '@/stores/toast.store';

const toast = useToastStore();
const records = ref([]);
const users = ref([]);
const loading = ref(false);
const typeCanvas = ref(null);
const statusCanvas = ref(null);
let typeChart;
let statusChart;
const filters = reactive({ estado: 'todos', usuario: 'todos', tipoGasto: 'todos', desde: '', hasta: '' });
const approvedStates = ['aprobado', 'exportado', 'confirmado'];
const pendingStates = ['pendiente_revision', 'incompleto', 'pendiente'];
const total = computed(() => records.value.reduce((sum, record) => sum + Number(record.valor || 0), 0));
const kpis = computed(() => [
  { label: 'Total gastado', value: formatCurrency(total.value), icon: 'fa-sack-dollar', class: 'kpi-primary' },
  {
    label: 'Total aprobado',
    value: formatCurrency(
      records.value.filter((r) => approvedStates.includes(r.estado)).reduce((sum, r) => sum + Number(r.valor || 0), 0)
    ),
    icon: 'fa-circle-check',
    class: 'kpi-success'
  },
  {
    label: 'Total pendiente',
    value: formatCurrency(
      records.value.filter((r) => pendingStates.includes(r.estado)).reduce((sum, r) => sum + Number(r.valor || 0), 0)
    ),
    icon: 'fa-clock',
    class: 'kpi-warning'
  },
  { label: 'Cantidad de viáticos', value: records.value.length, icon: 'fa-receipt', class: 'kpi-info' },
  {
    label: 'Promedio por viático',
    value: formatCurrency(total.value / records.value.length),
    icon: 'fa-calculator',
    class: 'kpi-accent'
  }
]);
const accessibleRows = computed(() =>
  expenseTypes
    .map((type) => {
      const matches = records.value.filter((record) => record.tipoGasto === type.id);
      return {
        type: type.nombre,
        count: matches.length,
        total: matches.reduce((sum, record) => sum + Number(record.valor || 0), 0)
      };
    })
    .filter((row) => row.count)
);

let timer;
watch(
  filters,
  () => {
    clearTimeout(timer);
    timer = setTimeout(load, 150);
  },
  { deep: true }
);
onMounted(async () => {
  const all = await viaticosService.list();
  users.value = [...new Set(all.items.map((r) => r.usuario).filter(Boolean))];
  await load();
});
onBeforeUnmount(destroyCharts);
async function load() {
  loading.value = true;
  try {
    records.value = (await viaticosService.list(filters)).items;
  } catch (error) {
    toast.show(error.message, 'danger');
  } finally {
    loading.value = false;
    await nextTick();
    renderCharts();
  }
}
function clearFilters() {
  Object.assign(filters, { estado: 'todos', usuario: 'todos', tipoGasto: 'todos', desde: '', hasta: '' });
}
function destroyCharts() {
  typeChart?.destroy();
  statusChart?.destroy();
  typeChart = null;
  statusChart = null;
}
function renderCharts() {
  destroyCharts();
  if (!records.value.length) return;
  const palette = ['#0053A1', '#7DB928', '#003D78', '#5F8F1E', '#1A6BB8', '#EBF5DC', '#D97706', '#DC2626'];
  if (typeCanvas.value)
    typeChart = new Chart(typeCanvas.value, {
      type: 'bar',
      data: {
        labels: accessibleRows.value.map((row) => row.type),
        datasets: [
          {
            data: accessibleRows.value.map((row) => row.total),
            backgroundColor: palette,
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
          tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.parsed.y) } }
        },
        scales: { y: { beginAtZero: true, ticks: { callback: (value) => `$${value / 1000}k` } } }
      }
    });
  const grouped = records.value.reduce(
    (acc, record) => ({ ...acc, [record.estado]: (acc[record.estado] || 0) + 1 }),
    {}
  );
  const colors = {
    pendiente_revision: '#D97706',
    incompleto: '#D97706',
    aprobado: '#7DB928',
    rechazado: '#DC2626',
    exportado: '#0053A1',
    pendiente: '#D97706',
    confirmado: '#7DB928',
    procesado: '#0053A1',
    error: '#DC2626'
  };
  const keys = Object.keys(grouped);
  if (statusCanvas.value)
    statusChart = new Chart(statusCanvas.value, {
      type: 'doughnut',
      data: {
        labels: keys.map((key) => statuses[key]?.label || key),
        datasets: [
          {
            data: keys.map((key) => grouped[key]),
            backgroundColor: keys.map((key) => colors[key] || '#4B5563'),
            borderWidth: 2,
            borderColor: '#fff'
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}
</script>
