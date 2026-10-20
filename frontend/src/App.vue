<template>
  <RouterView v-if="$route.meta.public" />
  <AppShell v-else>
    <RouterView />
  </AppShell>
  <ToastStack />
</template>

<script setup>
import AppShell from '@/components/AppShell.vue';
import ToastStack from '@/components/ToastStack.vue';
</script>
