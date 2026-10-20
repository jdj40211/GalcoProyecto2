/**
 * asignar-cotizaciones.js
 *
 * Asigna cotizaciones existentes a un vendedor de Firebase, por ejemplo las
 * migradas del cotizador original, que no tienen vendedor y solo ve contabilidad.
 *
 *   node scripts/asignar-cotizaciones.js <usuario> <consecutivo> [<consecutivo>...]
 *   node scripts/asignar-cotizaciones.js --sin-asignar        (lista las que no tienen vendedor)
 */

'use strict';

const path = require('node:path');

process.chdir(path.join(__dirname, '..'));
const config = require('../config');
const mongoose = require('mongoose');
const firebase = require('../utils/firebase');
const Cotizacion = require('../modules/cotizador/models/cotizacion.model');

const emailOf = (usuario) => (usuario.includes('@') ? usuario : `${usuario}@${config.auth.emailDomain}`);
const unassigned = {
  $or: [
    { 'metadata.vendedorLogin': { $exists: false } },
    { 'metadata.vendedorLogin': null },
    { 'metadata.vendedorLogin': '' }
  ]
};

async function main() {
  const [usuario, ...consecutivos] = process.argv.slice(2);
  if (!usuario) throw new Error('uso: asignar-cotizaciones.js <usuario> <consecutivo>... | --sin-asignar');
  await mongoose.connect(config.persistence.uri, { dbName: config.persistence.db });

  if (usuario === '--sin-asignar') {
    const quotes = await Cotizacion.find(unassigned).sort({ consecutivo: 1 }).lean();
    if (!quotes.length) console.log('Todas las cotizaciones tienen vendedor.');
    for (const quote of quotes)
      console.log(`  ${quote.consecutivo} · ${quote.metadata.cliente} · vendedor actual: ${quote.metadata.vendedor}`);
    return;
  }
  if (!consecutivos.length) throw new Error('indica al menos un consecutivo, por ejemplo COT-2026-0001.');

  let user;
  try {
    user = await firebase.auth().getUserByEmail(emailOf(usuario));
  } catch (error) {
    throw new Error(
      error.code === 'auth/user-not-found' ? `no existe el usuario ${emailOf(usuario)}.` : error.message,
      {
        cause: error
      }
    );
  }
  if (user.customClaims?.role !== 'comercial') throw new Error(`${usuario} no tiene el rol comercial.`);
  const vendedorLogin = user.customClaims.usuario || user.email;
  const vendedor = user.displayName || user.email;

  for (const consecutivo of consecutivos) {
    const result = await Cotizacion.updateOne(
      { consecutivo },
      { $set: { 'metadata.vendedor': vendedor, 'metadata.vendedorLogin': vendedorLogin } }
    );
    console.log(
      result.matchedCount ? `  + ${consecutivo} -> ${vendedor} (${vendedorLogin})` : `  ! ${consecutivo} no existe`
    );
  }
}

main()
  .catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
