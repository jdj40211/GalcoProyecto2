import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const routes = [
  {
    path: '/cotizador/catalogo',
    component: () => import('@/views/CatalogView.vue'),
    meta: { roles: ['comercial', 'contabilidad'], title: 'Catálogo de postes' }
  },
  { path: '/recuperar', component: () => import('@/views/RecoveryView.vue'), meta: { public: true } },
  {
    path: '/usuarios',
    component: () => import('@/views/UsersView.vue'),
    meta: { roles: ['admin'], title: 'Administrar usuarios' }
  },
  {
    path: '/cotizador/:id/editar',
    component: () => import('@/views/QuoteVariantView.vue'),
    meta: { roles: ['comercial', 'contabilidad'], title: 'Editar variante' }
  },
  {
    path: '/viaticos/legalizacion',
    component: () => import('@/views/SettlementView.vue'),
    meta: { roles: ['comercial'], title: 'Legalizar viaje' }
  },
  {
    path: '/notificaciones',
    component: () => import('@/views/NotificationsView.vue'),
    meta: { roles: ['comercial', 'contabilidad'], title: 'Notificaciones' }
  },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  { path: '/', redirect: '/carga' },
  {
    path: '/viaticos/solicitudes',
    name: 'travel-requests',
    component: () => import('@/views/TravelRequestsView.vue'),
    meta: { roles: ['comercial', 'contabilidad'], title: 'Solicitudes de viáticos' }
  },
  {
    path: '/carga',
    name: 'upload',
    component: () => import('@/views/UploadView.vue'),
    meta: { roles: ['comercial'], title: 'Subir comprobante' }
  },
  {
    path: '/validacion',
    name: 'validation',
    component: () => import('@/views/ValidationView.vue'),
    meta: { roles: ['comercial'], title: 'Validar datos' }
  },
  {
    path: '/historial',
    name: 'history',
    component: () => import('@/views/HistoryView.vue'),
    meta: { roles: ['comercial'], title: 'Historial de viáticos' }
  },
  {
    path: '/resultado',
    name: 'result',
    component: () => import('@/views/ResultView.vue'),
    meta: { roles: ['comercial'], title: 'Archivo generado' }
  },
  {
    path: '/contabilidad',
    name: 'accounting',
    component: () => import('@/views/AccountingView.vue'),
    meta: { roles: ['contabilidad'], title: 'Panel de contabilidad' }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { roles: ['contabilidad'], title: 'Dashboard de análisis' }
  },
  {
    path: '/cotizador',
    name: 'quote',
    component: () => import('@/views/CotizadorPostesView.vue'),
    meta: { roles: ['comercial', 'contabilidad'], title: 'Cotizador de postes' }
  },
  {
    path: '/cotizador/historial',
    name: 'quote-history',
    component: () => import('@/views/QuoteHistoryView.vue'),
    meta: { roles: ['comercial', 'contabilidad'], title: 'Historial de cotizaciones' }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.ready) await auth.init();
  if (auth.isAuthenticated) await auth.getToken();
  if (to.meta.public) return auth.isAuthenticated ? { path: auth.home } : true;
  if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } };
  if (to.meta.roles && !to.meta.roles.includes(auth.user.rol)) {
    return { path: auth.home };
  }
  return true;
});

export default router;
