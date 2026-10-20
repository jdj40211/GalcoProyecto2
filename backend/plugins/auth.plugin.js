'use strict';

const Boom = require('@hapi/boom');
const config = require('../config');
const firebase = require('../utils/firebase');

const ROLES = ['admin', 'comercial', 'contabilidad', 'consulta'];

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
        if (config.auth.bypass) {
          // Las cabeceras heredadas solo existen en pruebas de API aisladas.
          if (
            config.env === 'test' &&
            request.headers.authorization === 'Bearer dev-token' &&
            request.headers['x-dev-user']
          )
            return h.authenticated({ credentials: devCredentials(request) });
          return h.authenticated({
            credentials: require('../modules/usuarios.service').authenticate(request.headers.authorization?.slice(7))
          });
        }
        const header = request.headers.authorization;
        if (!header?.startsWith('Bearer '))
          throw Boom.unauthorized('Token no enviado.', ['Bearer error="invalid_request"']);
        // La cabecera WWW-Authenticate se fija aparte: Boom copiaría el mensaje con tildes y la cabecera solo admite ASCII.
        let decoded;
        try {
          decoded = await firebase.auth().verifyIdToken(header.slice(7).trim(), true);
        } catch {
          throw Boom.unauthorized('Token inválido o expirado.', ['Bearer error="invalid_token"']);
        }
        // Una cuenta sin rol asignado por el script de usuarios no obtiene acceso.
        const scope = (Array.isArray(decoded.roles) ? decoded.roles : [decoded.role]).filter((role) =>
          ROLES.includes(role)
        );
        if (!scope.length) throw Boom.forbidden('El usuario no tiene un rol asignado. Contacta al administrador.');
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
