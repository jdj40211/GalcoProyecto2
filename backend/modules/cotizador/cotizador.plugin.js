/**
 * cotizador.plugin.js
 *
 * Plugin Hapi que encapsula todo el módulo cotizador.
 * Se registra desde app.js con:
 *   await server.register(require('./modules/cotizador/cotizador.plugin'));
 */

'use strict';

const rutasCotizacion = require('./routes/cotizacion.routes');
const rutasParametros = require('./routes/parametros.routes');
const rutasMateriales = require('./routes/materiales.routes');
const { inicializarPorDefecto } = require('./services/parametros.service');
const { inicializarCatalogo } = require('./services/materiales.service');
const config = require('../../config');

module.exports = {
  name: 'cotizador',
  version: '1.0.0',
  register: async function (server, _options) {
    server.route([...rutasCotizacion, ...rutasParametros, ...rutasMateriales]);

    if (config.persistence.mode !== 'mongo') {
      server.log(['plugin', 'cotizador'], 'Módulo cotizador registrado con persistencia en memoria');
      return;
    }

    try {
      await inicializarPorDefecto();
      server.log(['plugin', 'cotizador'], 'Parámetros operativos listos');
    } catch (err) {
      server.log(['plugin', 'cotizador', 'warn'], 'No se pudo inicializar parámetros: ' + err.message);
    }

    try {
      const items = await inicializarCatalogo();
      server.log(['plugin', 'cotizador'], `Catálogo materiales listo (${items.length} ítems)`);
    } catch (err) {
      server.log(['plugin', 'cotizador', 'warn'], 'No se pudo inicializar catálogo materiales: ' + err.message);
    }

    server.log(['plugin', 'cotizador'], 'Módulo cotizador registrado');
  }
};
