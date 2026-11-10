'use strict';

// Viáticos y sus notificaciones son de los roles comercial (solicitante), contabilidad y administración.
// Se fija aquí para todas las rutas del módulo: Recursos Humanos no accede a ellas (HU-31 CA2).
const auth = { strategy: 'firebase', scope: ['admin', 'comercial', 'contabilidad'] };
const withAuth = (route) => ({ ...route, options: { ...route.options, auth: route.options?.auth ?? auth } });

module.exports = {
  name: 'viaticos-module',
  version: '2.0.0',
  register: async (server) =>
    server.route([...require('./routes/viaticos.routes'), ...require('./routes/solicitudes.routes')].map(withAuth))
};
