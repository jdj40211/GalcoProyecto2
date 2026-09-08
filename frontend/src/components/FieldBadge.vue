<template>
  <span class="field-badge" :class="pending ? 'field-badge-pending' : 'field-badge-detected'"
    ><i class="fas" :class="pending ? 'fa-exclamation' : 'fa-check'"></i
    >{{ pending ? 'Pendiente' : `Confianza ${confidence || 'media'}` }}</span
  >
</template>
<script setup>
defineProps({ pending: Boolean, confidence: { type: String, default: '' } });
</script>
