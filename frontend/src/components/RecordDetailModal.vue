<template>
  <BaseModal :open="Boolean(record)" title="Detalle del viático" @close="$emit('close')">
    <div v-if="record" class="detail-grid">
      <div class="detail-file">
        <div v-if="loadingFile" class="loading-state">
          <span class="spinner spinner-primary"></span>Cargando comprobante…
        </div>
        <img
          v-else-if="fileDataUrl && record.fileType?.startsWith('image/')"
          :src="fileDataUrl"
          alt="Comprobante adjunto"
        />
        <PdfPreview v-else-if="fileDataUrl" :data-url="fileDataUrl" :file-name="record.fileName" />
        <p v-else-if="fileError" class="text-danger">No fue posible cargar el comprobante. {{ fileError }}</p>
        <p v-else class="text-muted">Sin archivo adjunto.</p>
      </div>
      <dl class="detail-fields">
        <div>
          <dt>Estado</dt>
          <dd><StatusBadge :status="record.estado" /></dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{{ record.fecha }}</dd>
        </div>
        <div>
          <dt>Usuario</dt>
          <dd>{{ record.usuario }}</dd>
        </div>
        <div>
          <dt>Proveedor</dt>
          <dd>{{ record.proveedor || '—' }}</dd>
        </div>
        <div>
          <dt>NIT</dt>
          <dd>{{ record.nit || '—' }}</dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>{{ formatCurrency(record.valor, record.moneda || 'COP') }}</dd>
        </div>
        <div v-if="record.numeroDocumento">
          <dt>Factura o comprobante</dt>
          <dd>{{ record.numeroDocumento }}</dd>
        </div>
        <div v-if="record.subtotal != null">
          <dt>Subtotal</dt>
          <dd>{{ formatCurrency(record.subtotal, record.moneda || 'COP') }}</dd>
        </div>
        <div v-if="record.impuestos != null">
          <dt>Impuestos</dt>
          <dd>{{ formatCurrency(record.impuestos, record.moneda || 'COP') }}</dd>
        </div>
        <div v-if="record.ciudad">
          <dt>Ciudad</dt>
          <dd>{{ record.ciudad }}</dd>
        </div>
        <div v-if="record.metodoPago">
          <dt>Método de pago</dt>
          <dd>{{ record.metodoPago }}</dd>
        </div>
        <div>
          <dt>Tipo de gasto</dt>
          <dd>{{ typeName }}</dd>
        </div>
        <div>
          <dt>Concepto</dt>
          <dd>{{ record.concepto || '—' }}</dd>
        </div>
        <div v-if="record.nivelConfianza">
          <dt>Confianza de extracción</dt>
          <dd>{{ record.nivelConfianza }}</dd>
        </div>
        <div v-if="record.correcciones?.length">
          <dt>Correcciones humanas</dt>
          <dd>{{ record.correcciones.length }} campo(s) ajustado(s)</dd>
        </div>
        <div>
          <dt>Observaciones</dt>
          <dd>{{ record.observaciones || '—' }}</dd>
        </div>
        <div v-if="record.aprobadoPor">
          <dt>Aprobado por</dt>
          <dd>{{ record.aprobadoPor }} · {{ formatDateTime(record.aprobadoEn) }}</dd>
        </div>
        <div v-if="record.rechazadoPor">
          <dt>Rechazado por</dt>
          <dd>{{ record.rechazadoPor }} · {{ formatDateTime(record.rechazadoEn) }}</dd>
        </div>
        <div v-if="record.motivoRechazo">
          <dt>Motivo del rechazo</dt>
          <dd class="text-danger">{{ record.motivoRechazo }}</dd>
        </div>
        <div>
          <dt>Creado</dt>
          <dd>{{ formatDateTime(record.createdAt) }}</dd>
        </div>
        <div>
          <dt>Actualizado</dt>
          <dd>{{ formatDateTime(record.updatedAt) }}</dd>
        </div>
      </dl>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import PdfPreview from './PdfPreview.vue';
import StatusBadge from './StatusBadge.vue';
import { expenseTypes } from '@/config/domain';
import { formatCurrency, formatDateTime } from '@/services/format';
import { viaticosService } from '@/services/viaticos.service';
const props = defineProps({ record: { type: Object, default: null } });
defineEmits(['close']);
const typeName = computed(() => expenseTypes.find((type) => type.id === props.record?.tipoGasto)?.nombre || '—');

// El listado llega sin el comprobante; se descarga solo al abrir el detalle.
const fileDataUrl = ref('');
const loadingFile = ref(false);
const fileError = ref('');
watch(
  () => props.record,
  async (record) => {
    fileDataUrl.value = record?.fileDataUrl || '';
    fileError.value = '';
    if (!record?.fileName || fileDataUrl.value) return;
    loadingFile.value = true;
    try {
      const full = await viaticosService.get(record.id);
      if (props.record?.id === record.id) fileDataUrl.value = full.fileDataUrl || '';
    } catch (error) {
      if (props.record?.id === record.id) fileError.value = error.message;
    } finally {
      if (props.record?.id === record.id) loadingFile.value = false;
    }
  },
  { immediate: true }
);
</script>
