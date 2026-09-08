<template>
  <span class="status-badge" :class="`status-${current.tone}`">
    <i class="fas" :class="current.icon" aria-hidden="true"></i>
    {{ current.label }}
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { statuses } from '@/config/domain';
const props = defineProps({ status: { type: String, required: true } });
const current = computed(() => statuses[props.status] || statuses.pendiente_revision);
</script>
