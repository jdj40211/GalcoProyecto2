'use strict';

const Boom = require('@hapi/boom');
const config = require('../config');
let admin;

function initFirebase() {
  if (admin) return admin;
  admin = require('firebase-admin');
  if (!admin.apps.length) {
    let credential;
    if (config.auth.credentialsJson) credential = admin.credential.cert(JSON.parse(config.auth.credentialsJson));
    else if (config.auth.credentialsPath) credential = admin.credential.cert(require(config.auth.credentialsPath));
    else credential = admin.credential.applicationDefault();
    admin.initializeApp({ credential, projectId: config.auth.projectId || undefined });
  }
  return admin;
}

function devCredentials(request) {
  try {
    const raw = request.headers['x-dev-user'];
    const user = raw ? JSON.parse(decodeURIComponent(raw)) : {};
    return {
      uid: user.uid || 'dev-user',
      name: user.nombre || 'Usuario desarrollo',
      usuario: user.usuario || 'dev',
      email: user.email || 'dev@local',
      scope: [user.rol || 'comercial']
    };
  } catch {
    throw Boom.unauthorized('Cabecera de usuario de desarrollo inválida.');
  }
}

module.exports = {
  name: 'firebase-auth',
  version: '2.0.0',
  register: async (server) => {
    server.auth.scheme('firebase-scheme', () => ({
      authenticate: async (request, h) => {
        if (config.auth.bypass) return h.authenticated({ credentials: devCredentials(request) });
        const header = request.headers.authorization;
        if (!header?.startsWith('Bearer ')) throw Boom.unauthorized('Token no enviado.', 'Bearer');
        let decoded;
        try {
          decoded = await initFirebase().auth().verifyIdToken(header.slice(7).trim());
        } catch {
          throw Boom.unauthorized('Token inválido o expirado.', 'Bearer');
        }
        const scope = Array.isArray(decoded.roles) ? decoded.roles : [decoded.role || 'comercial'];
        return h.authenticated({
          credentials: {
            uid: decoded.uid,
            email: decoded.email,
            name: decoded.name || decoded.email,
            usuario: decoded.usuario || decoded.email,
            scope
          }
        });
      }
    }));
    server.auth.strategy('firebase', 'firebase-scheme');
    server.auth.default('firebase');
  }
};
