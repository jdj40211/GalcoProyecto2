<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" role="presentation" @click.self="$emit('close')">
      <section class="modal" role="dialog" aria-modal="true" :aria-labelledby="titleId">
        <header class="modal-header">
          <h2 :id="titleId">{{ title }}</h2>
          <button class="icon-btn" type="button" aria-label="Cerrar" @click="$emit('close')">
            <i class="fas fa-times"></i>
          </button>
        </header>
        <div class="modal-body"><slot /></div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  open: Boolean,
  title: { type: String, required: true },
  titleId: { type: String, default: () => `modal-title-${Math.random().toString(36).slice(2)}` }
});
defineEmits(['close']);
</script>
