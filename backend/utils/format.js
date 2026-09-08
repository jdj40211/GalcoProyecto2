/**
 * format.js
 *
 * Helpers de formateo (COP, m², kg) reutilizables por PDF, logs, etc.
 * Puras: sin side-effects, sin locale-dependiente del sistema.
 */

'use strict';

const nf = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const nfDec = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const cf = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

const money = (n) => (Number.isFinite(n) ? cf.format(n) : '$0');
const number = (n) => (Number.isFinite(n) ? nf.format(n) : '0');
const decimal = (n, d = 2) => {
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  }).format(n);
};

module.exports = { money, number, decimal, nf, nfDec, cf };
