<template>
  <section class="card">
    <div class="card-header">
      <h2>Subir comprobante</h2>
      <p>Formatos permitidos: JPG, JPEG, PNG y PDF · Máximo 10 MB</p>
    </div>
    <input
      ref="fileInput"
      class="visually-hidden"
      type="file"
      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
      @change="onInput"
    />

    <div
      v-if="!workflow.file"
      class="upload-area"
      :class="{ dragover }"
      role="button"
      tabindex="0"
      aria-label="Seleccionar comprobante"
      @click="openPicker"
      @keydown.enter="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="dragover = true"
      @dragleave="dragover = false"
      @drop.prevent="onDrop"
    >
      <div class="upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
      <h3>Arrastra tu comprobante aquí</h3>
      <p>o selecciónalo desde tu equipo</p>
      <button class="btn btn-primary" type="button" @click.stop="openPicker">
        <i class="fas fa-upload"></i>Seleccionar archivo
      </button>
    </div>

    <div v-else class="upload-result">
      <img v-if="isImage" class="receipt-image" :src="workflow.fileDataUrl" alt="Vista previa del comprobante" />
      <div v-else class="pdf-preview">
        <i class="fas fa-file-pdf"></i><span>{{ workflow.file.name }}</span>
      </div>
      <div class="file-meta">
        <i class="fas fa-paperclip"></i><strong>{{ workflow.file.name }}</strong
        ><span>{{ fileSize }}</span>
      </div>
      <div class="button-row">
        <button class="btn btn-success" :disabled="processing" @click="process">
          <span v-if="processing" class="spinner"></span><i v-else class="fas fa-robot"></i
          >{{ processing ? 'Procesando…' : 'Procesar con IA / OCR' }}
        </button>
        <button class="btn btn-outline" @click="openPicker"><i class="fas fa-rotate"></i>Reemplazar</button>
        <button class="btn btn-danger" @click="workflow.clearUpload"><i class="fas fa-trash"></i>Eliminar</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fileRules } from '@/config/domain';
import { fileToDataUrl } from '@/services/format';
import { viaticosService } from '@/services/viaticos.service';
import { useWorkflowStore } from '@/stores/workflow.store';
import { useToastStore } from '@/stores/toast.store';

const workflow = useWorkflowStore();
const toast = useToastStore();
const router = useRouter();
const fileInput = ref(null);
const processing = ref(false);
const dragover = ref(false);
const isImage = computed(() => workflow.file?.type.startsWith('image/'));
const fileSize = computed(() => `${Math.round((workflow.file?.size || 0) / 1024)} KB`);

function openPicker() {
  if (!fileInput.value) return;
  fileInput.value.value = '';
  fileInput.value.click();
}
function onInput(event) {
  if (event.target.files?.[0]) selectFile(event.target.files[0]);
}
function onDrop(event) {
  dragover.value = false;
  if (event.dataTransfer.files?.[0]) selectFile(event.dataTransfer.files[0]);
}
function validate(file) {
  if (!file || file.size === 0) return 'El archivo está vacío.';
  if (file.size > fileRules.maxBytes) return 'El archivo supera el tamaño máximo de 10 MB.';
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!fileRules.mimeTypes.includes(file.type) || !fileRules.extensions.includes(extension))
    return 'Formato no permitido. Usa JPG, JPEG, PNG o PDF.';
  return '';
}
async function selectFile(file) {
  const error = validate(file);
  if (error) return toast.show(error, 'danger');
  try {
    workflow.setFile(file, await fileToDataUrl(file));
    toast.show('Archivo cargado correctamente.', 'success');
  } catch (err) {
    toast.show(err?.message || 'No fue posible leer el archivo.', 'danger');
  }
}
async function process() {
  processing.value = true;
  const started = performance.now();
  try {
    const result = await viaticosService.extract({
      fileName: workflow.file.name,
      fileType: workflow.file.type,
      fileDataUrl: workflow.fileDataUrl
    });
    workflow.setExtraction(result);
    toast.show(`Datos extraídos en ${((performance.now() - started) / 1000).toFixed(1)} s.`, 'success');
  } catch (error) {
    workflow.setExtraction({
      datos: {},
      camposPendientes: [
        'fecha',
        'valor',
        'subtotal',
        'impuestos',
        'nit',
        'numeroDocumento',
        'proveedor',
        'moneda',
        'tipoGasto',
        'concepto'
      ],
      confianzaCampos: {},
      nivelConfianza: 'baja'
    });
    toast.show(`${error.message} Completa los datos manualmente.`, 'danger');
  } finally {
    processing.value = false;
    router.push('/validacion');
  }
}
</script>
