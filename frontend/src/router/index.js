import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const routes = [
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
  if (to.meta.public) return auth.isAuthenticated ? { name: auth.isAccounting ? 'accounting' : 'upload' } : true;
  if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } };
  if (to.meta.roles && !to.meta.roles.includes(auth.user.rol)) {
    return { name: auth.isAccounting ? 'accounting' : 'upload' };
  }
  return true;
});

export default router;
