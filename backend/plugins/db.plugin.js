'use strict';

const mongoose = require('mongoose');
const config = require('../config');

module.exports = {
  name: 'database',
  version: '2.0.0',
  register: async (server) => {
    server.app.persistenceMode = config.persistence.mode;
    if (config.persistence.mode !== 'mongo') {
      mongoose.set('bufferCommands', false);
      return;
    }
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.persistence.uri, { dbName: config.persistence.db, serverSelectionTimeoutMS: 5000 });
    server.app.db = mongoose.connection;
    server.ext('onPostStop', () => mongoose.disconnect());
  }
};
