<template>
  <section class="card success-screen">
    <template v-if="workflow.lastRecord">
      <div class="success-icon"><i class="fas fa-check"></i></div>
      <h2>Viático enviado a revisión</h2>
      <p>Tu viático quedó en estado <strong>Pendiente revisión</strong>. Contabilidad lo aprobará.</p>
      <div class="code-preview">
        <div class="code-header">
          <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span
          ><span>{{ workflow.lastExport?.filename }}</span>
        </div>
        <pre>{{ workflow.lastExport?.content }}</pre>
      </div>
      <div class="button-row centered">
        <button class="btn btn-success btn-lg" @click="download"><i class="fas fa-download"></i>Descargar TXT</button
        ><RouterLink class="btn btn-outline btn-lg" to="/historial"
          ><i class="fas fa-history"></i>Ir al historial</RouterLink
        >
      </div>
    </template>
    <EmptyState
      v-else
      icon="fa-file-circle-xmark"
      title="No hay un resultado reciente"
      message="Completa el registro de un viático para ver su archivo generado."
    />
  </section>
</template>

<script setup>
import EmptyState from '@/components/EmptyState.vue';
import { downloadText } from '@/services/format';
import { useWorkflowStore } from '@/stores/workflow.store';
const workflow = useWorkflowStore();
function download() {
  if (workflow.lastExport) downloadText(workflow.lastExport.content, workflow.lastExport.filename);
}
</script>
