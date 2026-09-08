'use strict';

const expenseTypes = [
  { id: 'alimentacion', nombre: 'Alimentación', cuenta: '511505', centroCostos: '001' },
  { id: 'transporte', nombre: 'Transporte', cuenta: '511510', centroCostos: '001' },
  { id: 'hospedaje', nombre: 'Hospedaje', cuenta: '511515', centroCostos: '001' },
  { id: 'combustible', nombre: 'Combustible', cuenta: '511520', centroCostos: '001' },
  { id: 'peajes', nombre: 'Peajes', cuenta: '511525', centroCostos: '001' },
  { id: 'parqueadero', nombre: 'Parqueadero', cuenta: '511530', centroCostos: '001' },
  { id: 'papeleria', nombre: 'Papelería', cuenta: '511535', centroCostos: '001' },
  { id: 'otros', nombre: 'Otros', cuenta: '511595', centroCostos: '001' }
];
const header = ['FECHA', 'CUENTA', 'NIT', 'PROVEEDOR', 'VALOR', 'DESCRIPCION', 'TIPO_GASTO', 'CENTRO_COSTOS'];
const safe = (value) =>
  String(value ?? '')
    .replace(/[|\r\n]/g, ' ')
    .trim();

function build(records) {
  const lines = [header.join('|')];
  for (const record of records) {
    const type = expenseTypes.find((item) => item.id === record.tipoGasto) || {};
    lines.push(
      [
        record.fecha,
        type.cuenta,
        record.nit,
        record.proveedor,
        Number(record.valor).toFixed(2),
        record.concepto,
        type.nombre || record.tipoGasto,
        type.centroCostos || ''
      ]
        .map(safe)
        .join('|')
    );
  }
  return `${lines.join('\r\n')}\r\n`;
}

function filename(user = 'usuario') {
  return `viaticos_${new Date().toISOString().slice(0, 10)}_${safe(user).replace(/\s+/g, '_')}.txt`;
}

module.exports = { build, filename };
