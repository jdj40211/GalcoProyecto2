'use strict';

const Hapi = require('@hapi/hapi');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./config');

async function registerFrontend(server) {
  if (!config.serveFrontend) return;

  const frontendDirectory = path.resolve(__dirname, '../frontend/dist');
  const frontendDirectoryReal = fs.realpathSync(frontendDirectory);
  const entryFile = path.join(frontendDirectory, 'index.html');
  if (!fs.existsSync(entryFile)) {
    throw new Error(
      'No se encontró frontend/dist/index.html. Ejecuta "npm run build" antes de iniciar la suite integrada.'
    );
  }

  await server.register(require('@hapi/inert'));
  server.route({
    method: 'GET',
    path: '/{path*}',
    options: { auth: false },
    handler: (request, h) => {
      const requestedPath = request.params.path || '';
      if (requestedPath === 'api' || requestedPath.startsWith('api/')) {
        return h.response({ ok: false, message: 'Recurso API no encontrado.' }).code(404);
      }
      const candidate = path.resolve(frontendDirectoryReal, requestedPath);
      const exists = fs.existsSync(candidate);
      const candidateReal = exists ? fs.realpathSync(candidate) : null;
      const relative = candidateReal ? path.relative(frontendDirectoryReal, candidateReal) : '..';
      const isInsideFrontend = candidateReal && (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative)));
      const isFile = Boolean(isInsideFrontend) && fs.statSync(candidateReal).isFile();
      return h.file(isFile ? candidateReal : entryFile);
    }
  });
}

async function createServer() {
  const server = Hapi.server({
    host: config.host,
    port: config.port,
    routes: {
      cors: { origin: [config.corsOrigin], credentials: true, additionalHeaders: ['Authorization', 'X-Dev-User'] },
      payload: { maxBytes: 8 * 1024 * 1024 }
    }
  });
  server.route({
    method: 'GET',
    path: '/api/health',
    options: { auth: false },
    handler: () => ({
      ok: true,
      service: 'galco-suite',
      modules: ['viaticos', 'cotizador'],
      persistence: config.persistence.mode,
      time: new Date().toISOString()
    })
  });
  await server.register(require('./plugins/db.plugin'));
  await server.register(require('./plugins/auth.plugin'));
  await server.register(require('./modules/viaticos/viaticos.plugin'), { routes: { prefix: '/api' } });
  await server.register(require('./modules/cotizador/cotizador.plugin'), { routes: { prefix: '/api' } });
  await registerFrontend(server);
  return server;
}

async function start() {
  const server = await createServer();
  await server.start();
  console.log(`Galco Suite disponible en ${server.info.uri}${config.serveFrontend ? ' (interfaz + API)' : ' (API)'}`);
  return server;
}

if (require.main === module)
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
module.exports = { createServer, start };
