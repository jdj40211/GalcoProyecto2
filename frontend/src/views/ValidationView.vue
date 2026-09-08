<template>
  <section class="card">
    <div class="card-header">
      <h2>Validar datos extraídos</h2>
      <p>Verifica y corrige la información. Los campos amarillos quedaron pendientes de revisión.</p>
    </div>
    <EmptyState
      v-if="!workflow.file"
      icon="fa-file-circle-question"
      title="No hay comprobante cargado"
      message="Carga y procesa un comprobante antes de validar sus datos."
    />
    <div v-else class="validation-layout">
      <div class="receipt-preview">
        <img v-if="workflow.file.type.startsWith('image/')" :src="workflow.fileDataUrl" alt="Comprobante procesado" />
        <div v-else class="pdf-preview">
          <i class="fas fa-file-pdf"></i><span>{{ workflow.file.name }}</span>
        </div>
      </div>
      <form class="validation-form" @submit.prevent="submit">
        <div
          v-if="workflow.extraction?.nivelConfianza"
          class="confidence-note"
          :class="`confidence-${workflow.extraction.nivelConfianza}`"
        >
          <i class="fas fa-circle-info"></i>Confianza {{ workflow.extraction.nivelConfianza }} en la extracción.
          Verifica antes de confirmar.
        </div>
        <div class="form-group">
          <label for="fecha">Fecha *</label>
          <div class="field-with-status">
            <input id="fecha" v-model="form.fecha" type="date" :class="fieldClass('fecha')" /><FieldBadge
              :pending="pending('fecha')"
              :confidence="confidence('fecha')"
            />
          </div>
          <small v-if="errors.fecha" class="field-error">{{ errors.fecha }}</small>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="valor">Valor total *</label>
            <div class="field-with-status">
              <input
                id="valor"
                v-model.number="form.valor"
                type="number"
                min="0"
                step="0.01"
                :class="fieldClass('valor')"
              /><FieldBadge :pending="pending('valor')" :confidence="confidence('valor')" />
            </div>
            <small v-if="errors.valor" class="field-error">{{ errors.valor }}</small>
          </div>
          <div class="form-group">
            <label for="moneda">Moneda</label>
            <div class="field-with-status">
              <select id="moneda" v-model="form.moneda" :class="fieldClass('moneda')">
                <option value="COP">COP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option></select
              ><FieldBadge :pending="pending('moneda')" :confidence="confidence('moneda')" />
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="subtotal">Subtotal</label>
            <div class="field-with-status">
              <input
                id="subtotal"
                v-model.number="form.subtotal"
                type="number"
                min="0"
                step="0.01"
                :class="fieldClass('subtotal')"
              /><FieldBadge :pending="pending('subtotal')" :confidence="confidence('subtotal')" />
            </div>
          </div>
          <div class="form-group">
            <label for="impuestos">Impuestos</label>
            <div class="field-with-status">
              <input
                id="impuestos"
                v-model.number="form.impuestos"
                type="number"
                min="0"
                step="0.01"
                :class="fieldClass('impuestos')"
              /><FieldBadge :pending="pending('impuestos')" :confidence="confidence('impuestos')" />
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="nit">NIT (opcional)</label>
            <div class="field-with-status">
              <input
                id="nit"
                v-model.trim="form.nit"
                :class="fieldClass('nit')"
                placeholder="NIT (si aplica)"
              /><FieldBadge :pending="pending('nit')" :confidence="confidence('nit')" />
            </div>
          </div>
          <div class="form-group">
            <label for="documento">Factura o recibo</label>
            <div class="field-with-status">
              <input
                id="documento"
                v-model.trim="form.numeroDocumento"
                :class="fieldClass('numeroDocumento')"
              /><FieldBadge :pending="pending('numeroDocumento')" :confidence="confidence('numeroDocumento')" />
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="proveedor">Nombre del proveedor</label>
          <div class="field-with-status">
            <input id="proveedor" v-model.trim="form.proveedor" :class="fieldClass('proveedor')" /><FieldBadge
              :pending="pending('proveedor')"
              :confidence="confidence('proveedor')"
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="ciudad">Ciudad</label><input id="ciudad" v-model.trim="form.ciudad" />
          </div>
          <div class="form-group">
            <label for="metodo">Método de pago</label
            ><input id="metodo" v-model.trim="form.metodoPago" placeholder="Efectivo, tarjeta…" />
          </div>
        </div>
        <div class="form-group">
          <label for="tipo">Tipo de gasto *</label>
          <div class="field-with-status">
            <select id="tipo" v-model="form.tipoGasto" :class="fieldClass('tipoGasto')">
              <option value="">Selecciona un tipo de gasto…</option>
              <option v-for="type in expenseTypes" :key="type.id" :value="type.id">{{ type.nombre }}</option></select
            ><FieldBadge :pending="pending('tipoGasto')" :confidence="confidence('tipoGasto')" />
          </div>
          <small v-if="errors.tipoGasto" class="field-error">{{ errors.tipoGasto }}</small>
        </div>
        <div class="form-group">
          <label for="concepto">Concepto *</label>
          <div class="field-with-status">
            <input id="concepto" v-model.trim="form.concepto" :class="fieldClass('concepto')" /><FieldBadge
              :pending="pending('concepto')"
              :confidence="confidence('concepto')"
            />
          </div>
          <small v-if="errors.concepto" class="field-error">{{ errors.concepto }}</small>
        </div>
        <div class="form-group">
          <label for="observaciones">Observaciones</label
          ><textarea id="observaciones" v-model.trim="form.observaciones" rows="3"></textarea>
        </div>
        <div class="button-row">
          <button class="btn btn-success btn-lg grow" :disabled="saving">
            <span v-if="saving" class="spinner"></span><i v-else class="fas fa-check"></i
            >{{ saving ? 'Guardando…' : 'Confirmar información' }}</button
          ><button type="button" class="btn btn-outline btn-lg" @click="cancel">Cancelar</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import FieldBadge from '@/components/FieldBadge.vue';
import { expenseTypes } from '@/config/domain';
import { useWorkflowStore } from '@/stores/workflow.store';
import { useViaticosStore } from '@/stores/viaticos.store';
import { useAuthStore } from '@/stores/auth.store';
import { useToastStore } from '@/stores/toast.store';
import { viaticosService } from '@/services/viaticos.service';

const workflow = useWorkflowStore();
const records = useViaticosStore();
const auth = useAuthStore();
const toast = useToastStore();
const router = useRouter();
const form = reactive({ ...workflow.form });
watch(
  () => workflow.form,
  (value) => Object.assign(form, value),
  { deep: true }
);
const errors = reactive({});
const saving = ref(false);
const pending = (field) => workflow.extraction?.camposPendientes?.includes(field);
const confidence = (field) =>
  workflow.extraction?.confianzaCampos?.[field] || workflow.extraction?.nivelConfianza || 'media';
const fieldClass = (field) => (pending(field) ? 'input-missing' : 'input-detected');

function validate() {
  Object.keys(errors).forEach((key) => delete errors[key]);
  if (!form.fecha) errors.fecha = 'La fecha es obligatoria.';
  if (!Number(form.valor) || Number(form.valor) <= 0) errors.valor = 'El valor debe ser mayor a cero.';
  if (!form.tipoGasto) errors.tipoGasto = 'Selecciona un tipo de gasto.';
  if (!form.concepto) errors.concepto = 'El concepto es obligatorio.';
  return Object.keys(errors).length === 0;
}
async function submit() {
  if (!validate()) return toast.show('Revisa los campos marcados antes de confirmar.', 'danger');
  saving.value = true;
  try {
    const extracted = workflow.extraction?.datos || {};
    const corrections = Object.keys(form)
      .filter((field) => String(form[field] ?? '') !== String(extracted[field] ?? ''))
      .map((field) => ({
        campo: field,
        valorExtraido: extracted[field] ?? null,
        valorCorregido: form[field] ?? null,
        corregidoPor: auth.user.nombre,
        corregidoEn: new Date().toISOString()
      }));
    const record = await records.create({
      ...form,
      valor: Number(form.valor),
      subtotal: Number(form.subtotal) || 0,
      impuestos: Number(form.impuestos) || 0,
      estado: 'pendiente_revision',
      usuario: auth.user.nombre,
      usuarioLogin: auth.user.usuario,
      nivelConfianza: workflow.extraction?.nivelConfianza || '',
      confianzaCampos: workflow.extraction?.confianzaCampos || {},
      datosExtraidos: extracted,
      correcciones: corrections,
      fileName: workflow.file.name,
      fileType: workflow.file.type,
      fileDataUrl: workflow.fileDataUrl
    });
    const exported = await viaticosService.exportTxt([record.id], false);
    workflow.complete(record, exported);
    toast.show('Viático enviado a revisión de contabilidad.', 'success');
    router.push('/resultado');
  } catch (error) {
    toast.show(error.message, 'danger');
  } finally {
    saving.value = false;
  }
}
function cancel() {
  workflow.clearUpload();
  router.push('/carga');
}
</script>
