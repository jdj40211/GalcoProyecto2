/**
 * migrar-cotizaciones.js
 *
 * Copia las cotizaciones del cotizador original a la base de la suite (MONGO_DB).
 * La base de origen solo se lee. Se puede ejecutar varias veces: omite las
 * cotizaciones que ya existen y nunca retrocede el contador de consecutivos.
 *
 *   node scripts/migrar-cotizaciones.js [base_origen]     (por defecto cotizador_postes)
 */

'use strict';

const path = require('node:path');

process.chdir(path.join(__dirname, '..'));
const config = require('../config');
const mongoose = require('mongoose');
const Cotizacion = require('../modules/cotizador/models/cotizacion.model');

const sourceName = process.argv[2] || 'cotizador_postes';

async function main() {
  if (sourceName === config.persistence.db) throw new Error('La base de origen y la de destino son la misma.');
  const connection = await mongoose.connect(config.persistence.uri, { dbName: config.persistence.db });
  const source = connection.connection.client.db(sourceName).collection('cotizacions');
  const target = connection.connection.db.collection('cotizacions');
  const counters = connection.connection.db.collection('counters');

  const quotes = await source.find().sort({ consecutivo: 1 }).toArray();
  console.log(`${sourceName}: ${quotes.length} cotizaciones -> ${config.persistence.db}`);
  const maxByYear = {};
  let inserted = 0;

  for (const quote of quotes) {
    const match = /^COT-(\d{4})-(\d+)$/.exec(quote.consecutivo || '');
    if (match) maxByYear[match[1]] = Math.max(maxByYear[match[1]] || 0, Number(match[2]));
    const exists = await target.findOne(
      { $or: [{ _id: quote._id }, { consecutivo: quote.consecutivo }] },
      { projection: { _id: 1 } }
    );
    if (exists) {
      console.log(`  = ${quote.consecutivo} ya existe, se omite`);
      continue;
    }
    const error = new Cotizacion(quote).validateSync();
    if (error) {
      console.log(`  ! ${quote.consecutivo} no cumple el modelo: ${error.message}`);
      continue;
    }
    // Inserción directa para conservar _id, createdAt y updatedAt originales.
    await target.insertOne(quote);
    inserted += 1;
    console.log(
      `  + ${quote.consecutivo} · ${quote.metadata?.cliente} · ${quote.configuracion?.tipoPoste} x${quote.configuracion?.cantidad}`
    );
  }

  for (const [year, seq] of Object.entries(maxByYear)) {
    await counters.updateOne({ _id: `cotizacion:${year}` }, { $max: { seq } }, { upsert: true });
    const { seq: current } = await counters.findOne({ _id: `cotizacion:${year}` });
    console.log(`Contador ${year}: la próxima cotización será COT-${year}-${String(current + 1).padStart(4, '0')}`);
  }
  console.log(`Migradas: ${inserted}. Omitidas: ${quotes.length - inserted}.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`Error: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
