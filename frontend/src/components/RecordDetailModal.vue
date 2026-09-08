<template>
  <BaseModal :open="Boolean(record)" title="Detalle del viático" @close="$emit('close')">
    <div v-if="record" class="detail-grid">
      <div class="detail-file">
        <img
          v-if="record.fileDataUrl && record.fileType?.startsWith('image/')"
          :src="record.fileDataUrl"
          alt="Comprobante adjunto"
        />
        <div v-else-if="record.fileDataUrl" class="pdf-preview">
          <i class="fas fa-file-pdf"></i><span>{{ record.fileName }}</span>
        </div>
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
import { computed } from 'vue';
import BaseModal from './BaseModal.vue';
import StatusBadge from './StatusBadge.vue';
import { expenseTypes } from '@/config/domain';
import { formatCurrency, formatDateTime } from '@/services/format';
const props = defineProps({ record: { type: Object, default: null } });
defineEmits(['close']);
const typeName = computed(() => expenseTypes.find((type) => type.id === props.record?.tipoGasto)?.nombre || '—');
</script>
