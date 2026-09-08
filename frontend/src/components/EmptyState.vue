<template>
  <div class="empty-state">
    <i class="fas" :class="icon" aria-hidden="true"></i>
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'fa-inbox' },
  title: { type: String, default: 'Sin resultados' },
  message: { type: String, required: true }
});
</script>
