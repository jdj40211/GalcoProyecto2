'use strict';

// Prueba de humo de un despliegue (HU-32 CA5). No inicia sesión ni modifica datos.
// Uso: node backend/scripts/smoke-deploy.js https://galco-suite.onrender.com
const base = (process.argv[2] || process.env.SMOKE_URL || '').replace(/\/+$/, '');
if (!/^https?:\/\//.test(base)) {
  console.error('Uso: node backend/scripts/smoke-deploy.js <URL de la aplicación>');
  process.exit(2);
}
// Un servicio gratuito de Render puede tardar en despertar: se da margen a la primera respuesta.
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 90000);
const results = [];

async function get(path) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
  return { status: response.status, type: response.headers.get('content-type') || '', body: await response.text() };
}

async function check(name, run) {
  try {
    await run();
    results.push(['OK', name]);
  } catch (error) {
    results.push(['FALLA', `${name}: ${error.message}`]);
  }
}
const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function main() {
  await check('la API responde y usa MongoDB', async () => {
    const { status, body } = await get('/api/health');
    expect(status === 200, `respondió ${status}`);
    const health = JSON.parse(body);
    expect(health.persistence === 'mongo', `persistencia "${health.persistence}" en lugar de "mongo"`);
    expect(health.modules.includes('hojasdevida'), 'falta el módulo de hojas de vida');
  });
  let indexHtml = '';
  await check('la interfaz se publica (no 403, #62)', async () => {
    const { status, type, body } = await get('/login');
    expect(status === 200, `respondió ${status}`);
    expect(type.includes('text/html'), `tipo ${type}`);
    expect(body.includes('id="app"'), 'no es la página de la aplicación');
    indexHtml = body;
  });
  await check('los archivos de la interfaz cargan', async () => {
    const asset = indexHtml.match(/(?:src|href)="(\/assets\/[^"]+\.js)"/)?.[1];
    expect(asset, 'index.html no referencia scripts en /assets');
    const { status, type } = await get(asset);
    expect(status === 200 && type.includes('javascript'), `respondió ${status} ${type}`);
  });
  await check('los datos exigen sesión', async () => {
    for (const path of ['/api/candidatos', '/api/cotizador', '/api/solicitudes-viaticos']) {
      const { status } = await get(path);
      expect(status === 401, `${path} respondió ${status} sin token`);
    }
  });
  await check('una ruta de la API inexistente responde 404 en JSON', async () => {
    const { status, type } = await get('/api/no-existe');
    expect(status === 404 && type.includes('json'), `respondió ${status} ${type}`);
  });
  await check('no se publican archivos fuera de la interfaz', async () => {
    const { body } = await get('/..%2F..%2Fbackend%2Fpackage.json');
    expect(!body.includes('galco-suite-backend'), 'se leyó backend/package.json');
  });

  for (const [state, text] of results) console.log(`${state.padEnd(5)} ${text}`);
  const failed = results.filter(([state]) => state !== 'OK').length;
  console.log(failed ? `\n${failed} comprobación(es) fallaron en ${base}` : `\nDespliegue verificado: ${base}`);
  process.exitCode = failed ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
