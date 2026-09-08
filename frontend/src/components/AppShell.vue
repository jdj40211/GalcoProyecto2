<template>
  <div class="app-shell">
    <aside class="sidebar" aria-label="Navegación principal">
      <div class="sidebar-brand">
        <div class="brand-surface"><img src="/logo-galco.png" alt="Galco" /></div>
        <span>Suite de operaciones</span>
      </div>
      <nav class="nav-menu">
        <template v-for="item in navigation" :key="item.to || item.section">
          <span v-if="item.section" class="nav-section-label">{{ item.section }}</span>
          <RouterLink v-else :to="item.to" class="nav-item" :aria-label="item.label" :title="item.label">
            <i class="fas" :class="item.icon" aria-hidden="true"></i><span>{{ item.label }}</span>
          </RouterLink>
        </template>
      </nav>
      <div class="sidebar-footer">
        <button class="nav-logout" type="button" aria-label="Cerrar sesión" title="Cerrar sesión" @click="logout">
          <i class="fas fa-sign-out-alt" aria-hidden="true"></i><span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
    <main class="main-content">
      <header class="topbar">
        <h1>{{ $route.meta.title }}</h1>
        <div class="topbar-actions">
          <span class="role-badge" :class="`role-${auth.user?.rol}`">{{ roleName }}</span>
          <div class="avatar" :title="auth.user?.nombre">{{ initials }}</div>
        </div>
      </header>
      <div class="page-content"><slot /></div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const router = useRouter();
const navigation = computed(() => [
  { section: 'VIÁTICOS' },
  { to: '/viaticos/solicitudes', label: 'Solicitudes de viaje', icon: 'fa-route' },
  ...(auth.isAccounting
    ? [
        { to: '/contabilidad', label: 'Panel de contabilidad', icon: 'fa-briefcase' },
        { to: '/dashboard', label: 'Dashboard', icon: 'fa-chart-pie' }
      ]
    : [
        { to: '/carga', label: 'Subir comprobante', icon: 'fa-cloud-upload-alt' },
        { to: '/validacion', label: 'Validar datos', icon: 'fa-check-circle' },
        { to: '/historial', label: 'Historial', icon: 'fa-history' }
      ]),
  { section: 'COTIZADOR' },
  { to: '/cotizador', label: 'Nueva cotización', icon: 'fa-calculator' },
  { to: '/cotizador/historial', label: 'Historial de cotizaciones', icon: 'fa-clock-rotate-left' }
]);
const roleName = computed(() => (auth.isAccounting ? 'Contabilidad' : 'Comercial'));
const initials = computed(() =>
  (auth.user?.nombre || 'U')
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
);
async function logout() {
  await auth.logout();
  router.push('/login');
}
</script>
