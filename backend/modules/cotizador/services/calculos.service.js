/**
 * calculos.service.js
 *
 * Motor de cálculo PURO — sin dependencias de Hapi, Mongo, HTTP ni side-effects.
 * Cada función recibe inputs y devuelve un número / objeto.
 *
 * Reglas:
 *  - Cada función replica una fórmula concreta de la hoja COTIZADOR.
 *  - No se lanza error por inputs inválidos: la validación (Joi) ocurre antes,
 *    aquí asumimos que llegan datos limpios.
 *  - Devuelve números "crudos" (sin redondeo) para preservar precisión tipo Excel.
 *    El redondeo es decisión de la capa de presentación.
 */

'use strict';

const {
  TUBOS,
  PLATINAS,
  GALVANIZADO_RANGOS,
  PINTURA,
  CONFIG_CERCHA,
  CONFIG_BRAZO_CERCHA,
  PARAMETROS
} = require('../data/tablasBase');

const PI = Math.PI;

// ---------------------------------------------------------------------------
// 1. PESOS
// ---------------------------------------------------------------------------

/**
 * Peso del tubo vertical 6" en kg.
 * Réplica de COTIZADOR!B12:
 *   = altura * VLOOKUP("Vertical", TUBOS, peso_por_metro)
 */
function calcularPesoTuboVertical(altura) {
  return altura * TUBOS.VERTICAL_6.pesoPorMetro;
}

/**
 * Peso de los tubos horizontales (y diagonales, en Cercha / Brazo_Cercha) en kg.
 * Réplica de COTIZADOR!B13.
 */
function calcularPesoTubosHorizontales(tipoPoste, brazo) {
  switch (tipoPoste) {
    case 'L':
      return brazo * TUBOS.HORIZONTAL_4.pesoPorMetro;

    case 'T':
      return 2 * brazo * TUBOS.HORIZONTAL_4.pesoPorMetro;

    case 'Cercha': {
      const cfg = CONFIG_CERCHA[brazo];
      if (!cfg) return 0;
      return (
        cfg.cantTubos3 * cfg.longTubos3 * TUBOS.HORIZONTAL_3.pesoPorMetro +
        cfg.cantTubos2 * cfg.longTubos2 * TUBOS.DIAGONAL_2.pesoPorMetro
      );
    }

    case 'Brazo_Cercha': {
      const cfg = CONFIG_BRAZO_CERCHA[brazo];
      if (!cfg) return 0;
      return (
        cfg.cantTubos3 * cfg.longTubos3 * TUBOS.HORIZONTAL_3.pesoPorMetro +
        cfg.cantTubos2 * cfg.longTubos2 * TUBOS.DIAGONAL_2.pesoPorMetro
      );
    }

    default:
      return 0;
  }
}

/**
 * Peso total de las platinas en kg.
 * Réplica de COTIZADOR!B14:
 *   = SUMPRODUCT( (tipo_poste = B4) * peso_kg * cantidad )
 */
function calcularPesoPlatinas(tipoPoste) {
  const lista = PLATINAS[tipoPoste];
  if (!lista) return 0;
  return lista.reduce((acc, p) => acc + p.pesoKg * p.cantidad, 0);
}

/**
 * Peso total unitario (una unidad de poste).
 * COTIZADOR!B15 = SUM(B12:B14)
 */
function calcularPesoTotalUnitario(tipoPoste, altura, brazo) {
  return (
    calcularPesoTuboVertical(altura) + calcularPesoTubosHorizontales(tipoPoste, brazo) + calcularPesoPlatinas(tipoPoste)
  );
}

// ---------------------------------------------------------------------------
// 2. ÁREAS (usadas por el costo de pintura)
// ---------------------------------------------------------------------------

/**
 * Área lateral del tubo vertical en m².
 * COTIZADOR!B17 = PI * 0.1524 * altura
 * (superficie lateral de un cilindro: π * D * L)
 */
function calcularAreaTuboVertical(altura) {
  return PI * TUBOS.VERTICAL_6.diametroMetros * altura;
}

/**
 * Área lateral de los tubos horizontales y diagonales en m².
 * Réplica de COTIZADOR!B18.
 *
 * NOTA IMPORTANTE: el Excel aplica dos diámetros distintos al tubo "Diagonal 2\"":
 *   - 0.0508 m cuando tipo = Cercha
 *   - 0.06   m cuando tipo = Brazo_Cercha
 * Esto NO es un error tipográfico replicado a ciegas: está así en la fórmula
 * original. Si el negocio lo considera bug, se corrige aquí en un solo sitio.
 */
function calcularAreaTubosHorizontales(tipoPoste, brazo) {
  switch (tipoPoste) {
    case 'L':
      return PI * TUBOS.HORIZONTAL_4.diametroMetros * brazo;

    case 'T':
      return 2 * PI * TUBOS.HORIZONTAL_4.diametroMetros * brazo;

    case 'Cercha': {
      const cfg = CONFIG_CERCHA[brazo];
      if (!cfg) return 0;
      return (
        cfg.cantTubos3 * cfg.longTubos3 * PI * TUBOS.HORIZONTAL_3.diametroMetros +
        cfg.cantTubos2 * cfg.longTubos2 * PI * TUBOS.DIAGONAL_2.diametroMetrosCercha
      );
    }

    case 'Brazo_Cercha': {
      const cfg = CONFIG_BRAZO_CERCHA[brazo];
      if (!cfg) return 0;
      return (
        cfg.cantTubos3 * cfg.longTubos3 * PI * TUBOS.HORIZONTAL_3.diametroMetros +
        cfg.cantTubos2 * cfg.longTubos2 * PI * TUBOS.DIAGONAL_2.diametroMetrosBrazoCercha
      );
    }

    default:
      return 0;
  }
}

/**
 * Área total de platinas en m².
 * COTIZADOR!B19 = SUMPRODUCT( (tipo = B4) * area_m2 * cantidad )
 */
function calcularAreaPlatinas(tipoPoste) {
  const lista = PLATINAS[tipoPoste];
  if (!lista) return 0;
  return lista.reduce((acc, p) => acc + p.areaM2 * p.cantidad, 0);
}

/**
 * Área total unitaria.
 * COTIZADOR!B20 = SUM(B17:B19)
 */
function calcularAreaTotalUnitaria(tipoPoste, altura, brazo) {
  return (
    calcularAreaTuboVertical(altura) + calcularAreaTubosHorizontales(tipoPoste, brazo) + calcularAreaPlatinas(tipoPoste)
  );
}

// ---------------------------------------------------------------------------
// 3. COSTOS
// ---------------------------------------------------------------------------

/**
 * Costo de tubos (vertical + horizontales/diagonales).
 * P0.3 — Lógica multi-tramo.
 * P1.3 — Los precios pueden venir del catálogo MongoDB (preciosTubos),
 *         fallback a tablasBase.js si no se pasan.
 *
 * @param {string} tipoPoste
 * @param {number} altura
 * @param {number} brazo
 * @param {number} [longComercialTuboM=6]
 * @param {Object|null} [preciosTubos]  Mapa { TUBO_6_VERT, TUBO_4_HORIZ,
 *                                             TUBO_3_CERCHA, TUBO_2_DIAG }
 *   Si es null usa los valores de tablasBase.js (backward-compatible).
 */
function calcularCostoTubos(tipoPoste, altura, brazo, longComercialTuboM = 6, preciosTubos = null) {
  const p6 = preciosTubos?.TUBO_6_VERT ?? TUBOS.VERTICAL_6.costoPorTramo6m;
  const p4 = preciosTubos?.TUBO_4_HORIZ ?? TUBOS.HORIZONTAL_4.costoPorTramo6m;
  const p3 = preciosTubos?.TUBO_3_CERCHA ?? TUBOS.HORIZONTAL_3.costoPorTramo6m;
  const p2 = preciosTubos?.TUBO_2_DIAG ?? TUBOS.DIAGONAL_2.costoPorTramo6m;

  const nT = (m) => Math.ceil(m / longComercialTuboM);

  const costoVertical = nT(altura) * p6;

  let costoHorizontales = 0;
  switch (tipoPoste) {
    case 'L':
      costoHorizontales = nT(brazo) * p4;
      break;
    case 'T':
      costoHorizontales = 2 * nT(brazo) * p4;
      break;
    case 'Cercha': {
      const cfg = CONFIG_CERCHA[brazo];
      if (cfg) {
        costoHorizontales = cfg.cantTubos3 * nT(cfg.longTubos3) * p3 + nT(cfg.cantTubos2 * cfg.longTubos2) * p2;
      }
      break;
    }
    case 'Brazo_Cercha': {
      const cfg = CONFIG_BRAZO_CERCHA[brazo];
      if (cfg) {
        costoHorizontales = cfg.cantTubos3 * nT(cfg.longTubos3) * p3 + nT(cfg.cantTubos2 * cfg.longTubos2) * p2;
      }
      break;
    }
  }

  return costoVertical + costoHorizontales;
}

/**
 * Costo de platinas.
 * COTIZADOR!B23 = peso_platinas * costo_por_kg_platina (B14 * B29)
 */
function calcularCostoPlatinas(tipoPoste) {
  return calcularPesoPlatinas(tipoPoste) * PARAMETROS.costoPorKgPlatina;
}

/**
 * Costo por kg de galvanizado en función del peso total.
 * Réplica de COTIZADOR!B24 con VLOOKUP aproximado (TRUE) sobre la TABLA 3.
 * Devuelve el costo unitario por kg aplicable a ese peso.
 */
function obtenerCostoGalvanizadoPorKg(pesoTotal) {
  // VLOOKUP con cuarto parámetro TRUE: busca la mayor clave <= valor.
  // En el Excel el rango se indexa por "Peso_Desde_kg" (columna B de DATOS_BASE!$B$62:$D$64)
  // y devuelve Costo_kg (columna D -> offset 3 -> índice 2 de ese rango).
  let costo = GALVANIZADO_RANGOS[0].costoPorKg;
  for (const r of GALVANIZADO_RANGOS) {
    if (pesoTotal >= r.pesoDesdeKg) costo = r.costoPorKg;
    else break;
  }
  return costo;
}

/**
 * Costo total de galvanizado (con peso nominal — función granular legacy).
 * La fachada calcularCotizacionCompleta usa el peso COMPRADO (P0.4).
 */
function calcularCostoGalvanizado(tipoPoste, altura, brazo) {
  const pesoTotal = calcularPesoTotalUnitario(tipoPoste, altura, brazo);
  return pesoTotal * obtenerCostoGalvanizadoPorKg(pesoTotal);
}

/**
 * Peso de los tubos horizontales y diagonales COMPRADOS en tramos completos.
 * P0.4 — el galvanizado se cobra sobre el material entregado al galvanizador
 * (tramos completos, incluyendo desperdicio de corte), no sobre metros usados.
 *
 * Espejo de calcularCostoTubos: misma lógica de agrupación de piezas.
 */
function calcularPesoHorizontalesComprado(tipoPoste, brazo, longComercialTuboM = 6) {
  const nT = (m) => Math.ceil(m / longComercialTuboM);
  const tramoKg = (m, pesoPorMetro) => nT(m) * longComercialTuboM * pesoPorMetro;

  switch (tipoPoste) {
    case 'L':
      return tramoKg(brazo, TUBOS.HORIZONTAL_4.pesoPorMetro);

    case 'T':
      return 2 * tramoKg(brazo, TUBOS.HORIZONTAL_4.pesoPorMetro);

    case 'Cercha': {
      const cfg = CONFIG_CERCHA[brazo];
      if (!cfg) return 0;
      return (
        cfg.cantTubos3 * tramoKg(cfg.longTubos3, TUBOS.HORIZONTAL_3.pesoPorMetro) +
        tramoKg(cfg.cantTubos2 * cfg.longTubos2, TUBOS.DIAGONAL_2.pesoPorMetro)
      );
    }

    case 'Brazo_Cercha': {
      const cfg = CONFIG_BRAZO_CERCHA[brazo];
      if (!cfg) return 0;
      return (
        cfg.cantTubos3 * tramoKg(cfg.longTubos3, TUBOS.HORIZONTAL_3.pesoPorMetro) +
        tramoKg(cfg.cantTubos2 * cfg.longTubos2, TUBOS.DIAGONAL_2.pesoPorMetro)
      );
    }

    default:
      return 0;
  }
}

/**
 * Costo de pintura (solo si está pintado).
 * COTIZADOR!B25 = IF(B7="Sí", area_total * costo_m2, 0)
 */
function calcularCostoPintura(tipoPoste, altura, brazo, pintura) {
  if (!pintura) return 0;
  return calcularAreaTotalUnitaria(tipoPoste, altura, brazo) * PINTURA.costoPorM2;
}

/**
 * Costo unitario (suma de los 4 rubros).
 * COTIZADOR!B26 = SUM(B22:B25)
 * @param {number} [longComercialTuboM=6] Pasado a calcularCostoTubos (P0.3).
 */
function calcularCostoUnitario(tipoPoste, altura, brazo, pintura, longComercialTuboM = 6) {
  return (
    calcularCostoTubos(tipoPoste, altura, brazo, longComercialTuboM) +
    calcularCostoPlatinas(tipoPoste) +
    calcularCostoGalvanizado(tipoPoste, altura, brazo) +
    calcularCostoPintura(tipoPoste, altura, brazo, pintura)
  );
}

/**
 * Costo total (multiplicado por cantidad).
 * COTIZADOR!B27 = B26 * B8
 */
function calcularCostoTotal(tipoPoste, altura, brazo, pintura, cantidad, longComercialTuboM = 6) {
  return calcularCostoUnitario(tipoPoste, altura, brazo, pintura, longComercialTuboM) * cantidad;
}

// ---------------------------------------------------------------------------
// 4. PRECIOS FINALES (hoja RESULTADOS, con AIU)
// ---------------------------------------------------------------------------

/**
 * Precio unitario sólo con galvanizado (sin pintura en el margen).
 * RESULTADOS!E4 = (costo_tubos + costo_platinas + costo_galv) / (1 - AIU_interno/100)
 */
function calcularPrecioUnitarioGalvanizado(tipoPoste, altura, brazo) {
  const base =
    calcularCostoTubos(tipoPoste, altura, brazo) +
    calcularCostoPlatinas(tipoPoste) +
    calcularCostoGalvanizado(tipoPoste, altura, brazo);
  return base / (1 - PARAMETROS.aiuMateriaPrimaYMOInterna / 100);
}

/**
 * Precio unitario con galvanizado + pintura.
 * RESULTADOS!E5 = galv/(1-AIU_interno/100) + pintura/(1-AIU_externo/100)
 */
function calcularPrecioUnitarioGalvanizadoPintura(tipoPoste, altura, brazo, pintura) {
  const precioGalv = calcularPrecioUnitarioGalvanizado(tipoPoste, altura, brazo);
  const costoPintura = calcularCostoPintura(tipoPoste, altura, brazo, pintura);
  return precioGalv + costoPintura / (1 - PARAMETROS.aiuManoObraExterna / 100);
}

// ---------------------------------------------------------------------------
// 5. FACHADA: un único resultado completo para la cotización
// ---------------------------------------------------------------------------

/**
 * Ejecuta todos los cálculos del Excel y devuelve un objeto estructurado.
 *
 * @param {Object} input
 * @param {'L'|'T'|'Cercha'|'Brazo_Cercha'} input.tipoPoste
 * @param {number} input.altura    - en metros (5.6 ó 6)
 * @param {number} input.brazo     - según el tipo
 * @param {boolean} input.pintura
 * @param {number} input.cantidad
 *
 * @param {Object|null} [parametrosExternos]
 *   Parámetros provenientes de la colección MongoDB "parametros".
 *   Si se omite o es null, se usan las constantes hardcodeadas de tablasBase.js
 *   (comportamiento idéntico al original — backward-compatible).
 *
 *   Estructura 4 rubros (Excel 2026, P0.2+) — activada cuando aiuMateriales está presente:
 *     - costoPorKgPlatina
 *     - costoGalvanizadoPorKg
 *     - costoPinturaPorM2
 *     - aiuMateriales     (tubos + platinas)
 *     - aiuMOInterna      (soldadura, corte… — costo $0 hasta P1.1)
 *     - aiuMOExterna      (pintura, transporte, empacado)
 *     - aiuGalvanizado    (galvanizado — 0% al costo, sin margen)
 *
 *   Estructura 2 rubros (Excel v3, legado) — cuando aiuMateriales ausente:
 *     - aiuMateriaPrimaYMOInterna
 *     - aiuManoObraExterna
 *
 * @returns {Object} estructura completa con pesos, áreas, costos, precios y
 *                   el snapshot de los parámetros efectivamente aplicados.
 */
function calcularCotizacionCompleta(input, parametrosExternos = null) {
  const { tipoPoste, altura, brazo, pintura, cantidad } = input;

  // ── Parámetros de costo (comunes a ambas estructuras AIU) ─────────────────
  const costoPorKgPlatina = parametrosExternos?.costoPorKgPlatina ?? PARAMETROS.costoPorKgPlatina;
  const costoPinturaPorM2 = parametrosExternos?.costoPinturaPorM2 ?? PINTURA.costoPorM2;
  const longComercialTuboM = parametrosExternos?.longComercialTuboM ?? 6;
  // P1.3: precios de tubos desde catálogo MongoDB (null → fallback a tablasBase.js)
  const preciosTubos = parametrosExternos?.preciosTubos ?? null;

  // ── Pesos nominales (material usado — para caracteristicas y platinas) ───────
  const pesoVertical = calcularPesoTuboVertical(altura);
  const pesoHorizontales = calcularPesoTubosHorizontales(tipoPoste, brazo);
  const pesoPlatinas = calcularPesoPlatinas(tipoPoste);
  const pesoTotal = pesoVertical + pesoHorizontales + pesoPlatinas;

  // ── P0.3: Tramos comprados (tubo vertical) ────────────────────────────────
  const tramosVertical = Math.ceil(altura / longComercialTuboM);
  const longCompradaVertM = tramosVertical * longComercialTuboM;
  const desperdicioVertM = longCompradaVertM - altura;

  // ── P0.4: Peso para galvanizado = material entregado (tramos completos) ───
  // El galvanizador recibe los tramos antes de corte → precio sobre peso comprado.
  const pesoVerticalComprado = longCompradaVertM * TUBOS.VERTICAL_6.pesoPorMetro;
  const pesoHorizComprado = calcularPesoHorizontalesComprado(tipoPoste, brazo, longComercialTuboM);
  const pesoParaGalvanizar = pesoVerticalComprado + pesoHorizComprado + pesoPlatinas;

  // Externo (DB) tiene prioridad; VLOOKUP usa el peso comprado (P0.4).
  const costoGalvPorKg =
    parametrosExternos?.costoGalvanizadoPorKg != null
      ? parametrosExternos.costoGalvanizadoPorKg
      : obtenerCostoGalvanizadoPorKg(pesoParaGalvanizar);

  // ── Áreas ─────────────────────────────────────────────────────────────────
  const areaVertical = calcularAreaTuboVertical(altura);
  const areaHorizontales = calcularAreaTubosHorizontales(tipoPoste, brazo);
  const areaPlatinas = calcularAreaPlatinas(tipoPoste);
  const areaTotal = areaVertical + areaHorizontales + areaPlatinas;

  // ── Costos unitarios ───────────────────────────────────────────────────────
  const costoTubos = calcularCostoTubos(tipoPoste, altura, brazo, longComercialTuboM, preciosTubos);
  const costoPlatinasVal = pesoPlatinas * costoPorKgPlatina;
  const costoGalvanizado = pesoParaGalvanizar * costoGalvPorKg; // P0.4: peso comprado
  const costoPintura = pintura ? areaTotal * costoPinturaPorM2 : 0;

  const costoUnitario = costoTubos + costoPlatinasVal + costoGalvanizado + costoPintura;
  const costoTotal = costoUnitario * cantidad;

  // ── Precios con AIU: detectar estructura ──────────────────────────────────
  let precioUnitGalv, precioUnitGalvPintura, snapshotAIU;

  if (parametrosExternos?.aiuMateriales !== undefined) {
    // ── ESTRUCTURA 4 RUBROS (Excel 2026, P0.2+) ───────────────────────────
    // precio_rubro = costo_rubro / (1 - aiu/100)
    const aiuMateriales = parametrosExternos.aiuMateriales;
    const aiuMOInterna = parametrosExternos.aiuMOInterna ?? 55;
    const aiuMOExterna = parametrosExternos.aiuMOExterna ?? 40;
    const aiuGalvanizado = parametrosExternos.aiuGalvanizado ?? 0;

    const costoMateriales = costoTubos + costoPlatinasVal;

    const precioMateriales = costoMateriales / (1 - aiuMateriales / 100);
    const precioMOInternaU = 0; // MO interna = $0 hasta P1.1 (soldadura, corte)
    const precioGalvanizado = costoGalvanizado / (1 - aiuGalvanizado / 100);
    const precioMOExterna = costoPintura / (1 - aiuMOExterna / 100);

    precioUnitGalv = precioMateriales + precioMOInternaU + precioGalvanizado;
    precioUnitGalvPintura = precioUnitGalv + precioMOExterna;

    snapshotAIU = { aiuMateriales, aiuMOInterna, aiuMOExterna, aiuGalvanizado };
  } else {
    // ── ESTRUCTURA 2 RUBROS (Excel v3, legado) ────────────────────────────
    const aiuMateriaPrimaYMOInterna =
      parametrosExternos?.aiuMateriaPrimaYMOInterna ?? PARAMETROS.aiuMateriaPrimaYMOInterna;
    const aiuManoObraExterna = parametrosExternos?.aiuManoObraExterna ?? PARAMETROS.aiuManoObraExterna;

    const basePrecioGalv = costoTubos + costoPlatinasVal + costoGalvanizado;
    precioUnitGalv = basePrecioGalv / (1 - aiuMateriaPrimaYMOInterna / 100);
    precioUnitGalvPintura = precioUnitGalv + costoPintura / (1 - aiuManoObraExterna / 100);

    snapshotAIU = { aiuMateriaPrimaYMOInterna, aiuManoObraExterna };
  }

  return {
    caracteristicas: {
      pesoVertical,
      pesoHorizontales,
      pesoPlatinas,
      pesoTotalUnitario: pesoTotal,
      areaVertical,
      areaHorizontales,
      areaPlatinas,
      areaTotalUnitaria: areaTotal
    },
    material: {
      vertical: {
        tramos: tramosVertical,
        longComercialM: longComercialTuboM,
        longCompradaM: longCompradaVertM,
        longUsadaM: altura,
        desperdicioM: desperdicioVertM
      },
      pesoGalvanizadoKg: pesoParaGalvanizar // P0.4: peso real entregado al galvanizador
    },
    costos: {
      tubos: costoTubos,
      platinas: costoPlatinasVal,
      galvanizado: costoGalvanizado,
      pintura: costoPintura,
      costoUnitario,
      costoTotal
    },
    precios: {
      precioUnitarioGalvanizado: precioUnitGalv,
      precioUnitarioGalvanizadoPintura: precioUnitGalvPintura,
      precioFinalGalvanizado: precioUnitGalv * cantidad,
      precioFinalGalvanizadoPintura: precioUnitGalvPintura * cantidad,
      precioFinal: (pintura ? precioUnitGalvPintura : precioUnitGalv) * cantidad
    },
    parametros: {
      ...snapshotAIU,
      costoPorKgPlatina,
      costoPorM2Pintura: costoPinturaPorM2,
      costoGalvanizadoPorKg: costoGalvPorKg,
      longComercialTuboM,
      ...(preciosTubos ? { preciosTubos } : {})
    }
  };
}

module.exports = {
  // granulares (una fórmula = una función, para testing unitario)
  calcularPesoTuboVertical,
  calcularPesoTubosHorizontales,
  calcularPesoPlatinas,
  calcularPesoTotalUnitario,
  calcularAreaTuboVertical,
  calcularAreaTubosHorizontales,
  calcularAreaPlatinas,
  calcularAreaTotalUnitaria,
  calcularCostoTubos,
  calcularCostoPlatinas,
  obtenerCostoGalvanizadoPorKg,
  calcularCostoGalvanizado,
  calcularPesoHorizontalesComprado,
  calcularCostoPintura,
  calcularCostoUnitario,
  calcularCostoTotal,
  calcularPrecioUnitarioGalvanizado,
  calcularPrecioUnitarioGalvanizadoPintura,
  // fachada (la que usa el controller)
  calcularCotizacionCompleta
};
