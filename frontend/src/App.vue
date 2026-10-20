<template>
  <!-- Hasta que el router resuelve la primera ruta no se muestra nada: así el shell no aparece
       un instante antes del login ni marca actividad antes de revisar si la sesión venció. -->
  <template v-if="$route.matched.length">
    <RouterView v-if="$route.meta.public" />
    <AppShell v-else>
      <RouterView />
    </AppShell>
  </template>
  <ToastStack />
</template>

<script setup>
import AppShell from '@/components/AppShell.vue';
import ToastStack from '@/components/ToastStack.vue';
</script>
