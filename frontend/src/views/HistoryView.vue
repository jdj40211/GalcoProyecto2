<template>
  <section class="card">
    <div class="card-header">
      <h2>Historial de viáticos</h2>
      <p>Consulta, filtra y descarga tus registros</p>
    </div>
    <FiltersBar :model="filters" id="history" @update:model="Object.assign(filters, $event)" @clear="clearFilters" />
    <div v-if="store.loading" class="loading-state">
      <span class="spinner spinner-primary"></span>Cargando registros…
    </div>
    <EmptyState
      v-else-if="!store.records.length"
      message="Aún no hay viáticos registrados. Sube tu primer comprobante."
    />
    <RecordsTable
      v-else
      :records="store.records"
      attachments
      deletable
      @view="selected = $event"
      @download="downloadOne"
      @delete="requestDelete"
    />
    <footer class="table-footer">
      <span>{{ store.records.length }} registro(s)</span
      ><button class="btn btn-primary" @click="downloadBatch">
        <i class="fas fa-file-export"></i>Descargar TXT consolidado
      </button>
    </footer>
  </section>
  <RecordDetailModal :record="selected" @close="selected = null" />
  <BaseModal :open="Boolean(pendingDelete)" title="Eliminar viático" @close="pendingDelete = null"
    ><p>¿Deseas eliminar este viático? Esta acción no se puede deshacer.</p>
    <div class="button-row modal-actions">
      <button class="btn btn-danger" @click="confirmDelete"><i class="fas fa-trash"></i>Eliminar</button
      ><button class="btn btn-outline" @click="pendingDelete = null">Cancelar</button>
    </div></BaseModal
  >
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue';
import FiltersBar from '@/components/FiltersBar.vue';
import RecordsTable from '@/components/RecordsTable.vue';
import EmptyState from '@/components/EmptyState.vue';
import RecordDetailModal from '@/components/RecordDetailModal.vue';
import BaseModal from '@/components/BaseModal.vue';
import { viaticosService } from '@/services/viaticos.service';
import { downloadText } from '@/services/format';
import { useViaticosStore } from '@/stores/viaticos.store';
import { useToastStore } from '@/stores/toast.store';

const store = useViaticosStore();
const toast = useToastStore();
const selected = ref(null);
const pendingDelete = ref(null);
const filters = reactive({ estado: 'todos', desde: '', hasta: '' });
let timer;
watch(
  filters,
  () => {
    clearTimeout(timer);
    timer = setTimeout(load, 150);
  },
  { deep: true }
);
onMounted(load);
async function load() {
  try {
    await store.fetch(filters);
  } catch (error) {
    toast.show(error.message, 'danger');
  }
}
function clearFilters() {
  Object.assign(filters, { estado: 'todos', desde: '', hasta: '' });
}
async function downloadOne(record) {
  const result = await viaticosService.exportTxt([record.id]);
  downloadText(result.content, result.filename);
}
async function downloadBatch() {
  const all = (await viaticosService.list()).items;
  const approved = all.filter((record) => ['aprobado', 'confirmado'].includes(record.estado));
  if (!approved.length) return toast.show('No hay viáticos aprobados para exportar.', 'danger');
  const result = await viaticosService.exportTxt(approved.map((item) => item.id));
  downloadText(result.content, result.filename);
}
function requestDelete(record) {
  pendingDelete.value = record;
}
async function confirmDelete() {
  await store.remove(pendingDelete.value.id);
  pendingDelete.value = null;
  toast.show('Registro eliminado.', 'info');
}
</script>
