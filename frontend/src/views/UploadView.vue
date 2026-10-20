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
      <img
        v-if="isImage"
        class="receipt-image"
        :src="prepared || workflow.fileDataUrl"
        alt="Vista previa del comprobante"
      />
      <PdfPreview v-else :data-url="workflow.fileDataUrl" :file-name="workflow.file.name" />
      <div class="file-meta">
        <i class="fas fa-paperclip"></i><strong>{{ workflow.file.name }}</strong
        ><span>{{ fileSize }}</span>
      </div>
      <fieldset v-if="isImage">
        <legend>Preparar imagen para lectura</legend>
        <label for="ocr-rotation">Rotación</label>
        <select id="ocr-rotation" v-model.number="rotation">
          <option :value="0">Original</option>
          <option :value="90">90°</option>
          <option :value="180">180°</option>
          <option :value="270">270°</option>
        </select>
        <label for="ocr-crop">Recortar bordes (%)</label
        ><input id="ocr-crop" v-model.number="crop" type="number" min="0" max="20" />
        <label for="ocr-contrast">Contraste</label
        ><input id="ocr-contrast" v-model.number="contrast" type="range" min="0.5" max="2" step="0.1" />
        <button class="btn btn-outline" :disabled="processing" @click="preview">Ver preparación</button>
        <p>Revisa que todos los datos sigan visibles. Se conserva el archivo original.</p>
      </fieldset>
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
import { computed, ref, watch } from 'vue';
import { preprocessImage } from '@/services/image-preprocess';
import { useRouter } from 'vue-router';
import { fileRules } from '@/config/domain';
import PdfPreview from '@/components/PdfPreview.vue';
import { prepareReceiptFile } from '@/services/format';
import { viaticosService } from '@/services/viaticos.service';
import { useWorkflowStore } from '@/stores/workflow.store';
import { useToastStore } from '@/stores/toast.store';

const workflow = useWorkflowStore();
const toast = useToastStore();
const router = useRouter();
const fileInput = ref(null);
const processing = ref(false);
const dragover = ref(false);
const crop = ref(0),
  rotation = ref(0),
  contrast = ref(1),
  prepared = ref('');
watch(
  () => workflow.fileDataUrl,
  () => {
    prepared.value = '';
    crop.value = 0;
    rotation.value = 0;
    contrast.value = 1;
  }
);
watch([crop, rotation, contrast], () => {
  prepared.value = '';
});
async function preview() {
  try {
    prepared.value = await preprocessImage(workflow.fileDataUrl, {
      crop: crop.value,
      rotation: rotation.value,
      contrast: contrast.value
    });
  } catch (error) {
    toast.show(error.message, 'danger');
  }
}
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
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!fileRules.mimeTypes.includes(file.type) || !fileRules.extensions.includes(extension))
    return 'Formato no permitido. Usa JPG, JPEG, PNG o PDF.';
  return '';
}
async function selectFile(file) {
  const error = validate(file);
  if (error) return toast.show(error, 'danger');
  try {
    // Las fotos se comprimen antes de validar el tamaño, así una foto de celular grande sigue siendo aceptada.
    const prepared = await prepareReceiptFile(file);
    if (prepared.file.size > fileRules.maxBytes)
      return toast.show('El archivo supera el tamaño máximo de 10 MB.', 'danger');
    workflow.setFile(prepared.file, prepared.dataUrl);
    toast.show('Archivo cargado correctamente.', 'success');
  } catch (err) {
    toast.show(err?.message || 'No fue posible leer el archivo.', 'danger');
  }
}
async function process() {
  processing.value = true;
  const started = performance.now();
  try {
    const imageData = isImage.value
      ? await preprocessImage(workflow.fileDataUrl, {
          crop: crop.value,
          rotation: rotation.value,
          contrast: contrast.value
        })
      : workflow.fileDataUrl;
    const result = await viaticosService.extract({
      fileName: isImage.value ? `${workflow.file.name}.jpg` : workflow.file.name,
      fileType: isImage.value ? 'image/jpeg' : workflow.file.type,
      fileDataUrl: imageData
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
