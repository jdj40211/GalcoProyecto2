/**
 * firebase.js
 *
 * Inicializa Firebase Admin una sola vez. Lo usan el plugin de autenticación
 * y el script de administración de usuarios.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

let admin;

function loadCredential(firebaseAdmin) {
  if (config.auth.credentialsJson) return firebaseAdmin.credential.cert(JSON.parse(config.auth.credentialsJson));
  if (config.auth.credentialsPath) {
    // Las rutas relativas se resuelven desde backend/, no desde el directorio de ejecución.
    const file = path.resolve(__dirname, '..', config.auth.credentialsPath);
    if (!fs.existsSync(file)) throw new Error(`[firebase] No existe el archivo de cuenta de servicio: ${file}`);
    return firebaseAdmin.credential.cert(JSON.parse(fs.readFileSync(file, 'utf8')));
  }
  return firebaseAdmin.credential.applicationDefault();
}

function app() {
  if (admin) return admin;
  const firebaseAdmin = require('firebase-admin');
  if (!firebaseAdmin.apps.length) {
    firebaseAdmin.initializeApp({
      credential: loadCredential(firebaseAdmin),
      projectId: config.auth.projectId || undefined
    });
  }
  admin = firebaseAdmin;
  return admin;
}

module.exports = { auth: () => app().auth() };
