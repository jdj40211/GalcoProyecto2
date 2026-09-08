<!--
  HistorialCotizaciones.vue

  Lista paginada con filtros. Click en fila -> detalle.
-->

<template>
  <div class="page">
    <header class="module-heading">
      <div>
        <div class="eyebrow">GALCO · Cotizador</div>
        <h2>Historial</h2>
      </div>
      <div class="head-actions">
        <router-link to="/cotizador" class="btn btn-ghost">
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          Volver al cotizador
        </router-link>
      </div>
    </header>

    <section class="card card-pad mb-4">
      <div class="filters">
        <div>
          <label for="quote-filter-client">Cliente</label>
          <input id="quote-filter-client" v-model="filtros.cliente" @keyup.enter="buscar" placeholder="Nombre…" />
        </div>
        <div>
          <label for="quote-filter-seller">Vendedor</label>
          <input id="quote-filter-seller" v-model="filtros.vendedor" @keyup.enter="buscar" placeholder="Nombre…" />
        </div>
        <div>
          <label for="quote-filter-status">Estado</label>
          <select id="quote-filter-status" v-model="filtros.estado">
            <option value="">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
            <option value="anulada">Anulada</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-accent" @click="buscar">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            Buscar
          </button>
          <button class="btn btn-ghost" @click="limpiar">
            <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
            Limpiar
          </button>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Consecutivo</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Tipo</th>
              <th class="num">Cant</th>
              <th class="num">Precio final</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.cargandoLista">
              <td colspan="9" class="text-mute">Cargando…</td>
            </tr>
            <tr v-else-if="!store.lista.length">
              <td colspan="9" class="text-mute">Sin resultados</td>
            </tr>
            <tr v-for="c in store.lista" :key="c._id">
              <td class="font-mono">{{ c.consecutivo }}</td>
              <td>{{ dateShort(c.createdAt) }}</td>
              <td>{{ c.metadata.cliente }}</td>
              <td>{{ c.metadata.vendedor }}</td>
              <td>{{ c.configuracion.tipoPoste }}</td>
              <td class="num">{{ c.configuracion.cantidad }}</td>
              <td class="num">{{ money(c.precios.precioFinal) }}</td>
              <td>
                <span class="badge" :class="estadoBadgeClass(c.estado)">{{ c.estado }}</span>
              </td>
              <td>
                <button class="btn btn-ghost btn-xs" @click="descargar(c)" aria-label="Descargar cotización en PDF">
                  <i class="fa-solid fa-file-pdf" aria-hidden="true"></i>
                  PDF
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="store.pagination.totalPages > 1" class="pagination">
        <button
          class="btn btn-ghost btn-xs"
          :disabled="store.pagination.page <= 1"
          @click="cambiarPagina(store.pagination.page - 1)"
        >
          ← Anterior
        </button>
        <span class="text-sm text-mute">
          Página {{ store.pagination.page }} de {{ store.pagination.totalPages }} ·
          {{ store.pagination.total }} cotizaciones
        </span>
        <button
          class="btn btn-ghost btn-xs"
          :disabled="store.pagination.page >= store.pagination.totalPages"
          @click="cambiarPagina(store.pagination.page + 1)"
        >
          Siguiente →
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useCotizadorStore } from '@/stores/cotizador.store';
import { useToastStore } from '@/stores/toast.store';
import cotizadorApi from '@/services/cotizador.service';
import { money, dateShort, estadoBadgeClass } from '@/services/format';

const store = useCotizadorStore();
const toast = useToastStore();

const filtros = reactive({
  cliente: '',
  vendedor: '',
  estado: ''
});

const page = ref(1);

function params() {
  const p = { page: page.value, limit: 20 };
  if (filtros.cliente) p.cliente = filtros.cliente;
  if (filtros.vendedor) p.vendedor = filtros.vendedor;
  if (filtros.estado) p.estado = filtros.estado;
  return p;
}

async function buscar() {
  page.value = 1;
  await store.cargarLista(params());
}
async function cambiarPagina(p) {
  page.value = p;
  await store.cargarLista(params());
}
function limpiar() {
  filtros.cliente = '';
  filtros.vendedor = '';
  filtros.estado = '';
  buscar();
}

async function descargar(c) {
  try {
    await cotizadorApi.descargarPdf(c._id, c.consecutivo);
  } catch (err) {
    toast.show(`Error descargando PDF: ${err.message || err}`, 'error');
  }
}

onMounted(() => store.cargarLista(params()));
</script>

<style scoped>
.page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 32px 60px;
}
.page {
  padding-right: 0;
  padding-left: 0;
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

.filters {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 14px;
  align-items: end;
}
@media (max-width: 800px) {
  .filters {
    grid-template-columns: 1fr 1fr;
  }
}
.filter-actions {
  display: flex;
  gap: 8px;
}
.table-scroll {
  overflow-x: auto;
}
.table {
  min-width: 900px;
}
.table td:first-child {
  white-space: nowrap;
}

.btn-xs {
  min-height: 36px;
  padding: 7px 10px;
  font-size: 11px;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-top: 1px solid var(--line-soft);
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
  .filter-actions {
    flex-direction: column;
  }
  .pagination {
    align-items: stretch;
    flex-direction: column;
    text-align: center;
  }
}
</style>
