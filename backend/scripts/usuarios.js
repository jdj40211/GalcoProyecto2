/**
 * usuarios.js
 *
 * Administra los usuarios de Firebase Authentication y su rol.
 * Ejecutar desde backend/:
 *
 *   node scripts/usuarios.js crear <usuario> "<Nombre completo>" <comercial|contabilidad>
 *   node scripts/usuarios.js rol <usuario> <comercial|contabilidad>
 *   node scripts/usuarios.js clave <usuario>
 *   node scripts/usuarios.js desactivar <usuario>
 *   node scripts/usuarios.js activar <usuario>
 *   node scripts/usuarios.js listar
 *
 * <usuario> es el nombre corto con el que se inicia sesión (jdiaz) o un correo completo.
 * Las contraseñas se generan al azar y se muestran una sola vez.
 */

'use strict';

const crypto = require('node:crypto');
const path = require('node:path');

// backend/.env se lee desde el directorio actual; así el script funciona desde cualquier carpeta.
process.chdir(path.join(__dirname, '..'));
const config = require('../config');
const firebase = require('../utils/firebase');

const ROLES = ['comercial', 'contabilidad'];
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

const emailOf = (usuario) => (usuario.includes('@') ? usuario : `${usuario}@${config.auth.emailDomain}`);
const generatePassword = (length = 12) =>
  Array.from(crypto.randomBytes(length), (byte) => ALPHABET[byte % ALPHABET.length]).join('');

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function requireRole(role) {
  if (!ROLES.includes(role)) fail(`el rol debe ser ${ROLES.join(' o ')}.`);
}

async function findUser(usuario) {
  try {
    return await firebase.auth().getUserByEmail(emailOf(usuario));
  } catch (error) {
    if (error.code === 'auth/user-not-found') fail(`no existe el usuario ${emailOf(usuario)}.`);
    throw error;
  }
}

const commands = {
  async crear(usuario, nombre, rol) {
    if (!usuario || !nombre || !rol) fail('uso: crear <usuario> "<Nombre completo>" <rol>');
    requireRole(rol);
    const password = generatePassword();
    const user = await firebase.auth().createUser({ email: emailOf(usuario), password, displayName: nombre });
    await firebase.auth().setCustomUserClaims(user.uid, { role: rol, usuario });
    console.log(`Usuario creado: ${nombre} (${rol})`);
    console.log(`  Inicio de sesión: ${usuario}`);
    console.log(`  Contraseña:       ${password}`);
    console.log('Entrega la contraseña de forma privada; no se vuelve a mostrar.');
  },

  async rol(usuario, rol) {
    if (!usuario || !rol) fail('uso: rol <usuario> <rol>');
    requireRole(rol);
    const user = await findUser(usuario);
    await firebase.auth().setCustomUserClaims(user.uid, { ...user.customClaims, role: rol, usuario });
    // Invalida las sesiones abiertas para que el nuevo rol aplique de inmediato.
    await firebase.auth().revokeRefreshTokens(user.uid);
    console.log(`Rol de ${usuario} actualizado a ${rol}. Debe iniciar sesión de nuevo.`);
  },

  async clave(usuario) {
    if (!usuario) fail('uso: clave <usuario>');
    const user = await findUser(usuario);
    const password = generatePassword();
    await firebase.auth().updateUser(user.uid, { password });
    await firebase.auth().revokeRefreshTokens(user.uid);
    console.log(`Nueva contraseña de ${usuario}: ${password}`);
  },

  async desactivar(usuario) {
    if (!usuario) fail('uso: desactivar <usuario>');
    const user = await findUser(usuario);
    await firebase.auth().updateUser(user.uid, { disabled: true });
    await firebase.auth().revokeRefreshTokens(user.uid);
    console.log(`Usuario ${usuario} desactivado.`);
  },

  async activar(usuario) {
    if (!usuario) fail('uso: activar <usuario>');
    const user = await findUser(usuario);
    await firebase.auth().updateUser(user.uid, { disabled: false });
    console.log(`Usuario ${usuario} activado.`);
  },

  async listar() {
    const { users } = await firebase.auth().listUsers(1000);
    if (!users.length) return console.log('No hay usuarios registrados.');
    console.table(
      users.map((user) => ({
        usuario: user.customClaims?.usuario || user.email,
        nombre: user.displayName || '',
        rol: user.customClaims?.role || '(sin rol)',
        estado: user.disabled ? 'desactivado' : 'activo'
      }))
    );
  }
};

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!commands[command]) fail(`comando desconocido. Usa: ${Object.keys(commands).join(', ')}.`);
  await commands[command](...args);
}

main().catch((error) => fail(error.message));
