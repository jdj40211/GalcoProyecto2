<template>
  <div class="table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Usuario</th>
          <th>Proveedor</th>
          <th>Valor</th>
          <th>Tipo de gasto</th>
          <th>Estado</th>
          <th v-if="attachments">Adjunto</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="record in records" :key="record.id">
          <td>{{ record.fecha }}</td>
          <td>{{ record.usuario }}</td>
          <td>{{ record.proveedor || '—' }}</td>
          <td>{{ formatCurrency(record.valor) }}</td>
          <td>{{ typeName(record.tipoGasto) }}</td>
          <td><StatusBadge :status="record.estado" /></td>
          <td v-if="attachments">
            <i
              v-if="record.fileName"
              class="fas fa-paperclip"
              :title="record.fileName"
              aria-label="Con archivo adjunto"
            ></i
            ><span v-else>—</span>
          </td>
          <td>
            <div class="table-actions">
              <button class="icon-btn" title="Ver detalle" aria-label="Ver detalle" @click="$emit('view', record)">
                <i class="fas fa-eye"></i>
              </button>
              <button
                v-if="accounting && actionable(record.estado)"
                class="icon-btn approve"
                title="Aprobar"
                aria-label="Aprobar"
                @click="$emit('approve', record)"
              >
                <i class="fas fa-check"></i>
              </button>
              <button
                v-if="accounting && actionable(record.estado)"
                class="icon-btn reject"
                title="Rechazar"
                aria-label="Rechazar"
                @click="$emit('reject', record)"
              >
                <i class="fas fa-ban"></i>
              </button>
              <button
                class="icon-btn"
                title="Descargar TXT"
                aria-label="Descargar TXT"
                @click="$emit('download', record)"
              >
                <i class="fas fa-download"></i>
              </button>
              <button
                v-if="deletable"
                class="icon-btn reject"
                title="Eliminar"
                aria-label="Eliminar"
                @click="$emit('delete', record)"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue';
import { expenseTypes } from '@/config/domain';
import { formatCurrency } from '@/services/format';
defineProps({
  records: { type: Array, required: true },
  accounting: Boolean,
  attachments: Boolean,
  deletable: Boolean
});
defineEmits(['view', 'approve', 'reject', 'download', 'delete']);
const actionable = (status) => ['pendiente_revision', 'incompleto', 'pendiente', 'confirmado'].includes(status);
const typeName = (id) => expenseTypes.find((type) => type.id === id)?.nombre || '—';
</script>
