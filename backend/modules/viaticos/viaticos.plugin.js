'use strict';

module.exports = {
  name: 'viaticos-module',
  version: '2.0.0',
  register: async (server) =>
    server.route([...require('./routes/viaticos.routes'), ...require('./routes/solicitudes.routes')])
};
