'use strict';

const crypto = require('node:crypto');
const Boom = require('@hapi/boom');
const config = require('../config');
const sessions = new Map();
const attempts = new Map();
const users = new Map();
const hash = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex');
const publicUser = ({ uid, nombre, usuario, email, rol, activo }) => ({ uid, nombre, usuario, email, rol, activo });
function seed() {
  if (users.size) return;
  for (const [usuario, nombre, password, rol] of [
    ['jdiaz', 'Juan Díaz', '1234', 'comercial'],
    ['lgomez', 'Laura Gómez', '1234', 'comercial'],
    ['crueda', 'Carlos Rueda', '1234', 'comercial'],
    ['acastro', 'Andrés Castro', 'conta2024', 'contabilidad'],
    ['admin', 'Administrador demo', 'AdminDemo2026!', 'admin']
  ]) {
    const salt = crypto.randomBytes(16).toString('hex');
    users.set(`dev-${usuario}`, {
      uid: `dev-${usuario}`,
      usuario,
      nombre,
      rol,
      email: `${usuario}@demo.local`,
      activo: true,
      salt,
      hash: hash(password, salt)
    });
  }
}
function firebase() {
  return require('../utils/firebase').auth();
}
function fromFirebase(user) {
  return {
    uid: user.uid,
    usuario: user.customClaims?.usuario || user.email,
    nombre: user.displayName || user.email,
    email: user.email,
    rol: user.customClaims?.role || 'comercial',
    activo: !user.disabled
  };
}
module.exports = {
  login(usuario, password, address = '') {
    if (!config.auth.bypass) throw Boom.notFound();
    seed();
    const key = `${address}:${usuario.toLowerCase()}`;
    const attempt = attempts.get(key);
    if (attempt && attempt.until > Date.now() && attempt.count >= 10)
      throw Boom.tooManyRequests('Intenta nuevamente en 15 minutos.');
    const user = [...users.values()].find((item) => item.usuario === usuario || item.email === usuario);
    const computed = hash(password, user?.salt || 'invalid-user-salt');
    if (!user || !user.activo || !crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(user.hash, 'hex'))) {
      attempts.set(key, { count: attempt?.until > Date.now() ? attempt.count + 1 : 1, until: Date.now() + 900000 });
      throw Boom.unauthorized('Usuario o contraseña incorrectos.');
    }
    attempts.delete(key);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000;
    sessions.set(token, { uid: user.uid, expiresAt });
    return { user: publicUser(user), token, expiresAt };
  },
  authenticate(token) {
    const session = sessions.get(token);
    const user = users.get(session?.uid);
    if (!session || session.expiresAt <= Date.now() || !user?.activo) {
      sessions.delete(token);
      throw Boom.unauthorized('Sesión inválida o expirada.');
    }
    return { uid: user.uid, usuario: user.usuario, email: user.email, name: user.nombre, scope: [user.rol] };
  },
  logout(token) {
    sessions.delete(token);
  },
  async list() {
    if (!config.auth.bypass) return (await firebase().listUsers(1000)).users.map(fromFirebase);
    seed();
    return [...users.values()].map(publicUser);
  },
  async create(data) {
    if (!config.auth.bypass) {
      try {
        const user = await firebase().createUser({
          email: data.email,
          password: data.password,
          displayName: data.nombre
        });
        await firebase().setCustomUserClaims(user.uid, { role: data.rol, usuario: data.email });
        return { ...fromFirebase(user), rol: data.rol };
      } catch (err) {
        if (err.code === 'auth/email-already-exists') throw Boom.conflict('El correo ya está registrado.');
        throw Boom.badRequest('No fue posible crear el usuario en Firebase.');
      }
    }
    seed();
    if ([...users.values()].some((user) => user.email.toLowerCase() === data.email.toLowerCase()))
      throw Boom.conflict('El correo ya está registrado.');
    const salt = crypto.randomBytes(16).toString('hex');
    const user = {
      uid: crypto.randomUUID(),
      usuario: data.email,
      email: data.email,
      nombre: data.nombre,
      rol: data.rol,
      activo: true,
      salt,
      hash: hash(data.password, salt)
    };
    users.set(user.uid, user);
    return publicUser(user);
  },
  async setActive(uid, activo, actor) {
    if (uid === actor && !activo) throw Boom.conflict('No puedes desactivar tu propia cuenta.');
    if (!config.auth.bypass) {
      const user = await firebase().updateUser(uid, { disabled: !activo });
      if (!activo) await firebase().revokeRefreshTokens(uid);
      return fromFirebase(user);
    }
    seed();
    const user = users.get(uid);
    if (!user) throw Boom.notFound('Usuario no encontrado.');
    user.activo = activo;
    if (!activo) for (const [token, value] of sessions) if (value.uid === uid) sessions.delete(token);
    return publicUser(user);
  },
  reset() {
    users.clear();
    sessions.clear();
    attempts.clear();
  }
};
