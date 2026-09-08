/**
 * tablasBase.js
 *
 * Réplica exacta de la hoja DATOS_BASE del archivo
 * 01_Cotizador_Postes_Metalicos_v3.xlsm
 *
 * Estas tablas son la fuente de verdad de costos, pesos y dimensiones.
 * Cualquier cambio de precio o configuración se hace aquí (o, en producción,
 * migrando estas constantes a una colección MongoDB parametrizable).
 *
 * No importar nada de Hapi / HTTP aquí: este módulo es lógica pura.
 */

'use strict';

// ---------------------------------------------------------------------------
// TABLA 1 - Tubos (Materia prima Excel 2026, columna costo_unidad × 6m)
//
// P0.3 — Lógica multi-tramo:
//   El material se compra en tramos comerciales de 6m (longComercialM).
//   No existe precio "por metro": se paga siempre el tramo completo.
//   costoPorTramo6m = precio de UN tubo de 6m en COP (columna costo_unidad 2026).
//
//   Fórmula de costo:
//     numTramos = ceil(longitudRequerida / longComercialM)
//     costo     = numTramos × costoPorTramo6m
// ---------------------------------------------------------------------------
const TUBOS = Object.freeze({
  VERTICAL_6: {
    tipo: 'Vertical',
    diametro: '6"',
    diametroMetros: 0.1524, // para área lateral del cilindro (π·D·L)
    costoPorTramo6m: 600000, // COP / tramo de 6m  (Excel 2026: item 9)
    pesoPorMetro: 14.9 // kg / m lineal
  },
  HORIZONTAL_4: {
    tipo: 'Horizontal',
    diametro: '4"',
    diametroMetros: 0.1143,
    costoPorTramo6m: 247575, // COP / tramo de 6m  (Excel 2026: item 8)
    pesoPorMetro: 8.35
  },
  HORIZONTAL_3: {
    tipo: 'Horizontal',
    diametro: '3"',
    diametroMetros: 0.089,
    costoPorTramo6m: 173376, // COP / tramo de 6m  (Excel 2026: item 7)
    pesoPorMetro: 6.47
  },
  DIAGONAL_2: {
    tipo: 'Diagonal',
    diametro: '2"',
    // IMPORTANTE: el Excel usa DOS diámetros distintos para el tubo diagonal
    // según el tipo de poste:
    //   Cercha        -> 0.0508 m
    //   Brazo_Cercha  -> 0.06   m
    // Corresponde a la diferencia entre diámetro nominal e interno real.
    diametroMetrosCercha: 0.0508,
    diametroMetrosBrazoCercha: 0.06,
    costoPorTramo6m: 117376, // COP / tramo de 6m  (Excel 2026: item 5)
    pesoPorMetro: 4.33
  }
});

// ---------------------------------------------------------------------------
// TABLA 2 - Platinas por tipo de poste (DATOS_BASE!A12:F57)
// Cada entrada: { id, nombre, areaM2, pesoKg, cantidad }
// ---------------------------------------------------------------------------
const PLATINAS = Object.freeze({
  L: [
    { id: 'L1', nombre: 'Placa base 40x40', areaM2: 0.33, pesoKg: 15, cantidad: 1 },
    { id: 'L2', nombre: 'Cartela cuadrada', areaM2: 0.03, pesoKg: 1.2, cantidad: 4 },
    { id: 'L3', nombre: 'Cartela rectangular', areaM2: 0.02, pesoKg: 0.3, cantidad: 11 },
    { id: 'L4', nombre: 'Pieamigo', areaM2: 0.1, pesoKg: 3.1, cantidad: 1 },
    { id: 'L5', nombre: 'Brida 6 perfo 3/8"', areaM2: 0.07, pesoKg: 2, cantidad: 2 },
    { id: 'L6', nombre: 'Tapa 4"', areaM2: 0.02, pesoKg: 0.1, cantidad: 1 },
    { id: 'L7', nombre: 'Tapa 6"', areaM2: 0.02, pesoKg: 0.1, cantidad: 1 },
    { id: 'L8', nombre: 'Ventanilla inspección', areaM2: 0.08, pesoKg: 1, cantidad: 1 },
    { id: 'L9', nombre: 'Corona antiescalatoria', areaM2: 0.08, pesoKg: 1, cantidad: 1 },
    { id: 'L10', nombre: 'Acople 3/4"', areaM2: 0.05, pesoKg: 0.1, cantidad: 3 },
    { id: 'L11', nombre: 'Acople 1"', areaM2: 0.05, pesoKg: 0.1, cantidad: 3 },
    { id: 'L12', nombre: 'Canastilla de anclaje', areaM2: 0, pesoKg: 0, cantidad: 1 },
    { id: 'L13', nombre: 'Placa de identificación', areaM2: 0, pesoKg: 0, cantidad: 1 }
  ],
  T: [
    { id: 'T1', nombre: 'Placa base 40x40', areaM2: 0.33, pesoKg: 15, cantidad: 1 },
    { id: 'T2', nombre: 'Cartela cuadrada', areaM2: 0.03, pesoKg: 1.2, cantidad: 4 },
    { id: 'T3', nombre: 'Cartela rectangular', areaM2: 0.02, pesoKg: 0.3, cantidad: 22 },
    { id: 'T4', nombre: 'Pieamigo', areaM2: 0.1, pesoKg: 3.1, cantidad: 2 },
    { id: 'T5', nombre: 'Brida 6 perfo 3/8"', areaM2: 0.07, pesoKg: 2, cantidad: 4 },
    { id: 'T6', nombre: 'Tapa 4"', areaM2: 0.02, pesoKg: 0.1, cantidad: 2 },
    { id: 'T7', nombre: 'Tapa 6"', areaM2: 0.02, pesoKg: 0.1, cantidad: 1 },
    { id: 'T8', nombre: 'Ventanilla inspección', areaM2: 0.08, pesoKg: 1, cantidad: 1 },
    { id: 'T9', nombre: 'Corona antiescalatoria', areaM2: 0.08, pesoKg: 1, cantidad: 1 },
    { id: 'T10', nombre: 'Acople 3/4"', areaM2: 0.05, pesoKg: 0.1, cantidad: 6 },
    { id: 'T11', nombre: 'Acople 1"', areaM2: 0.05, pesoKg: 0.1, cantidad: 4 },
    { id: 'T12', nombre: 'Canastilla de anclaje', areaM2: 0, pesoKg: 0, cantidad: 1 },
    { id: 'T13', nombre: 'Placa de identificación', areaM2: 0, pesoKg: 0, cantidad: 1 }
  ],
  Cercha: [
    { id: 'C1', nombre: 'Placa base 40x40', areaM2: 0.33, pesoKg: 15, cantidad: 2 },
    { id: 'C2', nombre: 'Cartela cuadrada', areaM2: 0.03, pesoKg: 1.2, cantidad: 8 },
    { id: 'C3', nombre: 'Brida 6 perforaciones', areaM2: 0.1, pesoKg: 2, cantidad: 16 },
    { id: 'C4', nombre: 'Tapa 6"', areaM2: 0.02, pesoKg: 0.1, cantidad: 2 },
    { id: 'C5', nombre: 'Ventanilla inspección', areaM2: 0.08, pesoKg: 1, cantidad: 2 },
    { id: 'C6', nombre: 'Corona antiescalatoria', areaM2: 0.08, pesoKg: 10, cantidad: 2 },
    { id: 'C7', nombre: 'Acople 3/4"', areaM2: 0.05, pesoKg: 0.1, cantidad: 4 },
    { id: 'C8', nombre: 'Acople 1"', areaM2: 0.05, pesoKg: 0.1, cantidad: 4 },
    { id: 'C9', nombre: 'Canastilla anclaje', areaM2: 0, pesoKg: 3, cantidad: 2 },
    { id: 'C10', nombre: 'Placa identificación', areaM2: 0, pesoKg: 0.5, cantidad: 2 }
  ],
  Brazo_Cercha: [
    { id: 'BC1', nombre: 'Placa base 40x40', areaM2: 0.33, pesoKg: 15, cantidad: 1 },
    { id: 'BC2', nombre: 'Cartela cuadrada', areaM2: 0.03, pesoKg: 1.2, cantidad: 4 },
    { id: 'BC3', nombre: 'Brida 6 perforaciones', areaM2: 0.1, pesoKg: 2, cantidad: 8 },
    { id: 'BC4', nombre: 'Tapa 6"', areaM2: 0.02, pesoKg: 0.1, cantidad: 1 },
    { id: 'BC5', nombre: 'Ventanilla inspección', areaM2: 0.08, pesoKg: 1, cantidad: 1 },
    { id: 'BC6', nombre: 'Corona antiescalatoria', areaM2: 0.08, pesoKg: 10, cantidad: 1 },
    { id: 'BC7', nombre: 'Acople 3/4"', areaM2: 0.05, pesoKg: 0.1, cantidad: 3 },
    { id: 'BC8', nombre: 'Acople 1"', areaM2: 0.05, pesoKg: 0.1, cantidad: 3 },
    { id: 'BC9', nombre: 'Canastilla anclaje', areaM2: 0, pesoKg: 3, cantidad: 1 },
    { id: 'BC10', nombre: 'Placa identificación', areaM2: 0, pesoKg: 0.5, cantidad: 1 }
  ]
});

// ---------------------------------------------------------------------------
// TABLA 3 - Costos de galvanizado por rango de peso (DATOS_BASE!A61:D64)
// En el Excel los tres rangos tienen el mismo costo/kg (2950) pero respetamos
// la estructura por si en el futuro cambian.
// ---------------------------------------------------------------------------
const GALVANIZADO_RANGOS = Object.freeze([
  { nombre: 'Rango 1', pesoDesdeKg: 0, pesoHastaKg: 500, costoPorKg: 2950 },
  { nombre: 'Rango 2', pesoDesdeKg: 501, pesoHastaKg: 1000, costoPorKg: 2950 },
  { nombre: 'Rango 3', pesoDesdeKg: 1001, pesoHastaKg: 2000, costoPorKg: 2950 }
]);

// ---------------------------------------------------------------------------
// TABLA 4 - Costo de pintura por m² (DATOS_BASE!A68:B69)
// ---------------------------------------------------------------------------
const PINTURA = Object.freeze({
  costoPorM2: 30500
});

// ---------------------------------------------------------------------------
// TABLA 5 - Configuración de tubos para Cercha y Brazo_Cercha
// (DATOS_BASE!A72:F82)
// Columnas del Excel: Tipo | Ancho_Brazo | Cant_3 | Long_3 | Cant_2 | Long_2
// Aquí la representamos como mapa indexado por ancho para búsqueda O(1).
// ---------------------------------------------------------------------------
const CONFIG_CERCHA = Object.freeze({
  12: { cantTubos3: 4, longTubos3: 6, cantTubos2: 12, longTubos2: 0.2 },
  18: { cantTubos3: 6, longTubos3: 6, cantTubos2: 18, longTubos2: 0.2 },
  21: { cantTubos3: 8, longTubos3: 6, cantTubos2: 24, longTubos2: 0.6 }
});

const CONFIG_BRAZO_CERCHA = Object.freeze({
  3: { cantTubos3: 2, longTubos3: 3, cantTubos2: 3, longTubos2: 0.2 },
  3.5: { cantTubos3: 2, longTubos3: 3.5, cantTubos2: 3, longTubos2: 0.2 },
  4: { cantTubos3: 2, longTubos3: 4, cantTubos2: 3, longTubos2: 0.2 },
  4.5: { cantTubos3: 2, longTubos3: 4.5, cantTubos2: 4, longTubos2: 0.2 },
  5: { cantTubos3: 2, longTubos3: 5, cantTubos2: 4, longTubos2: 0.2 },
  5.5: { cantTubos3: 2, longTubos3: 5.5, cantTubos2: 5, longTubos2: 0.2 },
  6: { cantTubos3: 2, longTubos3: 6, cantTubos2: 5, longTubos2: 0.2 }
});

// ---------------------------------------------------------------------------
// Parámetros globales (hoja COTIZADOR!B29 y hoja RESULTADOS!B25,B26)
// ---------------------------------------------------------------------------
const PARAMETROS = Object.freeze({
  costoPorKgPlatina: 9500, // COTIZADOR!B29
  aiuMateriaPrimaYMOInterna: 55, // RESULTADOS!B25 (aplicado a tubos+platinas+galvanizado)
  aiuManoObraExterna: 45 // RESULTADOS!B26 (aplicado a pintura)
});

// ---------------------------------------------------------------------------
// Tipos de poste soportados - punto único para validación y UI
// ---------------------------------------------------------------------------
const TIPOS_POSTE = Object.freeze(['L', 'T', 'Cercha', 'Brazo_Cercha']);
// P0.3: alturas ampliadas — postes de 8m, 9m, 10m y 12m requieren
// 2 tramos verticales de 6m (ceil(h/6) = 2). El desperdicio es
// automáticamente calculado por calcularCostoTubos.
const ALTURAS_VALIDAS = Object.freeze([5.6, 6, 8, 9, 10, 12]);

/**
 * Devuelve los anchos/brazos válidos para un tipo de poste dado.
 * Para L y T no hay restricción discreta (es continuo), así que devolvemos null.
 */
function getBrazosValidosParaTipo(tipoPoste) {
  switch (tipoPoste) {
    case 'Cercha':
      return Object.keys(CONFIG_CERCHA)
        .map(Number)
        .sort((a, b) => a - b);
    case 'Brazo_Cercha':
      return Object.keys(CONFIG_BRAZO_CERCHA)
        .map(Number)
        .sort((a, b) => a - b);
    case 'L':
    case 'T':
      return null; // libre
    default:
      return [];
  }
}

module.exports = {
  TUBOS,
  PLATINAS,
  GALVANIZADO_RANGOS,
  PINTURA,
  CONFIG_CERCHA,
  CONFIG_BRAZO_CERCHA,
  PARAMETROS,
  TIPOS_POSTE,
  ALTURAS_VALIDAS,
  getBrazosValidosParaTipo
};
