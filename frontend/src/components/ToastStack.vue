<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="toast">
      <button
        v-for="item in toast.items"
        :key="item.id"
        class="toast"
        :class="`toast-${item.tone}`"
        @click="toast.remove(item.id)"
      >
        <i class="fas" :class="icons[item.tone]" aria-hidden="true"></i>
        <span>{{ item.message }}</span>
      </button>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from '@/stores/toast.store';
const toast = useToastStore();
const icons = {
  success: 'fa-circle-check',
  danger: 'fa-circle-exclamation',
  error: 'fa-circle-exclamation',
  info: 'fa-circle-info',
  warning: 'fa-triangle-exclamation'
};
</script>
