<template>
  <section class="card">
    <div class="card-header">
      <h2>Panel de contabilidad</h2>
      <p>Revisa, aprueba o rechaza los viáticos enviados por los comerciales.</p>
    </div>
    <div class="stats-bar">
      <div v-for="stat in stats" :key="stat.label" class="stat-card" :class="stat.class">
        <strong>{{ stat.value }}</strong
        ><span>{{ stat.label }}</span>
      </div>
    </div>
    <FiltersBar
      :model="filters"
      :users="users"
      show-user
      show-type
      id="accounting"
      @update:model="Object.assign(filters, $event)"
      @clear="clearFilters"
    />
    <div v-if="store.loading" class="loading-state">
      <span class="spinner spinner-primary"></span>Cargando registros…
    </div>
    <EmptyState v-else-if="!store.records.length" message="No hay viáticos que coincidan con los filtros." />
    <RecordsTable
      v-else
      :records="store.records"
      accounting
      @view="selected = $event"
      @approve="approve"
      @reject="openReject"
      @download="downloadOne"
    />
    <footer class="table-footer">
      <span>{{ store.records.length }} registro(s)</span
      ><button class="btn btn-primary" @click="exportApproved">
        <i class="fas fa-file-export"></i>Exportar aprobados a TXT
      </button>
    </footer>
  </section>
  <RecordDetailModal :record="selected" @close="selected = null" />
  <BaseModal :open="Boolean(rejecting)" title="Rechazar viático" @close="closeReject"
    ><p class="text-muted">Indica el motivo del rechazo. El comercial lo verá en su historial.</p>
    <div class="form-group">
      <label for="reason">Motivo *</label
      ><textarea
        id="reason"
        ref="reasonInput"
        v-model.trim="reason"
        rows="4"
        @keydown.ctrl.enter="confirmReject"
      ></textarea>
    </div>
    <div class="button-row modal-actions">
      <button class="btn btn-danger" @click="confirmReject"><i class="fas fa-ban"></i>Confirmar rechazo</button
      ><button class="btn btn-outline" @click="closeReject">Cancelar</button>
    </div></BaseModal
  >
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
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
const rejecting = ref(null);
const reason = ref('');
const reasonInput = ref(null);
const allRecords = ref([]);
const filters = reactive({ estado: 'todos', usuario: 'todos', tipoGasto: 'todos', desde: '', hasta: '' });
const users = computed(() => [...new Set(allRecords.value.map((record) => record.usuario).filter(Boolean))]);
const stats = computed(() => {
  const count = (states) => allRecords.value.filter((record) => states.includes(record.estado)).length;
  return [
    { label: 'Total', value: allRecords.value.length, class: '' },
    { label: 'Pendiente revisión', value: count(['pendiente_revision', 'pendiente']), class: 'stat-warning' },
    { label: 'Incompletos', value: count(['incompleto', 'error']), class: 'stat-warning' },
    { label: 'Aprobados', value: count(['aprobado', 'confirmado']), class: 'stat-success' },
    { label: 'Rechazados', value: count(['rechazado']), class: 'stat-danger' },
    { label: 'Exportados', value: count(['exportado', 'procesado']), class: 'stat-info' }
  ];
});
let timer;
watch(
  filters,
  () => {
    clearTimeout(timer);
    timer = setTimeout(load, 150);
  },
  { deep: true }
);
onMounted(() => Promise.all([load(), loadAll()]));
async function load() {
  try {
    await store.fetch(filters);
  } catch (error) {
    toast.show(error.message, 'danger');
  }
}
async function loadAll() {
  allRecords.value = (await viaticosService.list()).items;
}
function clearFilters() {
  Object.assign(filters, { estado: 'todos', usuario: 'todos', tipoGasto: 'todos', desde: '', hasta: '' });
}
async function approve(record) {
  await store.approve(record.id);
  await loadAll();
  toast.show(`Viático de ${record.proveedor || record.usuario} aprobado.`, 'success');
}
function openReject(record) {
  rejecting.value = record;
  reason.value = '';
  nextTick(() => reasonInput.value?.focus());
}
function closeReject() {
  rejecting.value = null;
  reason.value = '';
}
async function confirmReject() {
  if (!reason.value) return toast.show('El motivo del rechazo es obligatorio.', 'danger');
  await store.reject(rejecting.value.id, reason.value);
  await loadAll();
  closeReject();
  toast.show('Viático rechazado.', 'info');
}
async function downloadOne(record) {
  const result = await viaticosService.exportTxt([record.id]);
  downloadText(result.content, result.filename);
}
async function exportApproved() {
  const approved = allRecords.value.filter((record) => ['aprobado', 'confirmado'].includes(record.estado));
  if (!approved.length) return toast.show('No hay viáticos aprobados para exportar.', 'danger');
  const result = await viaticosService.exportTxt(
    approved.map((item) => item.id),
    true
  );
  downloadText(result.content, result.filename);
  await Promise.all([load(), loadAll()]);
  toast.show(`TXT con ${approved.length} registro(s) exportado.`, 'success');
}
</script>
