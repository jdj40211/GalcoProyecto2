<template>
  <div class="pdf-viewer">
    <iframe v-if="url" class="pdf-frame" :src="`${url}#view=FitH`" :title="`Vista previa de ${fileName}`"></iframe>
    <div class="pdf-viewer-bar">
      <span class="pdf-viewer-name"><i class="fas fa-file-pdf"></i>{{ fileName }}</span>
      <div v-if="url" class="pdf-viewer-actions">
        <a class="btn btn-outline" :href="url" target="_blank" rel="noopener"
          ><i class="fas fa-up-right-from-square"></i>Abrir</a
        >
        <a class="btn btn-outline" :href="url" :download="fileName"><i class="fas fa-download"></i>Descargar</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
const props = defineProps({
  dataUrl: { type: String, required: true },
  fileName: { type: String, default: 'comprobante.pdf' }
});
const url = ref('');

// El navegador no abre data URLs grandes en pestañas nuevas; se usa un blob local.
// El tipo se fija en application/pdf para que un archivo mal etiquetado nunca se interprete como HTML.
function toBlobUrl(dataUrl) {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
}
function release() {
  if (url.value) URL.revokeObjectURL(url.value);
  url.value = '';
}

watch(
  () => props.dataUrl,
  (dataUrl) => {
    release();
    try {
      if (dataUrl) url.value = toBlobUrl(dataUrl);
    } catch {
      url.value = '';
    }
  },
  { immediate: true }
);
onBeforeUnmount(release);
</script>
