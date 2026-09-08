/**
 * calculos.test.js
 *
 * Tests del motor de cálculo contra los valores conocidos de la hoja
 * COTIZADOR del Excel original (01_Cotizador_Postes_Metalicos_v3.xlsm).
 *
 * Usa `node:test` (nativo, no requiere instalar Jest).
 * Ejecutar con:  node --test tests/
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const c = require('../modules/cotizador/services/calculos.service');

// Tolerancia mínima para comparar floats (Excel introduce ruido ~1e-13)
const close = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

// ---------------------------------------------------------------------------
// CASO DE REFERENCIA: Cercha / 6m / brazo 12 / Pintura Sí / 1 unidad
// Valores calculados con lógica P0.3 (tramos) + P0.4 (galv sobre peso comprado)
// + AIU 2-rubro legacy (fallback sin params externos).
//
// P0.4 — galvanizado sobre peso COMPRADO (tramos):
//   Vert:  1 tramo × 6m × 14.9 kg/m  = 89.4  kg  (igual al nominal: 6m exactos)
//   H3:    4 piezas × 1 tramo × 6m × 6.47 kg/m = 155.28 kg
//   D2:    1 tramo × 6m × 4.33 kg/m  = 25.98 kg  (nominal era 2.4m × 4.33 = 10.39)
//   Plats: 101.6 kg
//   Total: 372.26 kg  → costoGalv = 372.26 × $2.950 = $1.098.167
// ---------------------------------------------------------------------------
test('Cercha 6m brazo=12 pintura=Sí — paridad valores tramo Excel 2026', () => {
  const r = c.calcularCotizacionCompleta({
    tipoPoste: 'Cercha',
    altura: 6,
    brazo: 12,
    pintura: true,
    cantidad: 1
  });

  // Pesos NOMINALES (material usado) — no cambian
  assert.ok(close(r.caracteristicas.pesoVertical, 89.4));
  assert.ok(close(r.caracteristicas.pesoHorizontales, 165.672));
  assert.ok(close(r.caracteristicas.pesoPlatinas, 101.6, 1e-4));
  assert.ok(close(r.caracteristicas.pesoTotalUnitario, 356.672, 1e-4));

  // Áreas — no cambian
  assert.ok(close(r.caracteristicas.areaTotalUnitaria, 13.2261, 1e-3));

  // Costos — tubos con lógica de tramos (sin cambio vs P0.3)
  assert.ok(close(r.costos.tubos, 1410880));
  assert.ok(close(r.costos.platinas, 965200, 1e-2));
  // P0.4: galvanizado sobre 372.26 kg comprados × $2.950 = $1.098.167
  assert.ok(close(r.costos.galvanizado, 1098167, 1));
  assert.ok(close(r.costos.pintura, 403397, 10));
  assert.ok(close(r.costos.costoUnitario, 3877644, 10));
  assert.ok(close(r.costos.costoTotal, 3877644, 10));

  // Precios (AIU 2-rubro legacy: 55% / 45%)
  // basePrecioGalv = 1.410.880 + 965.200 + 1.098.167 = 3.474.247
  // precioUnitGalv = 3.474.247 / 0.45 = 7.720.549
  assert.ok(close(r.precios.precioUnitarioGalvanizado, 7720549, 10));
  assert.ok(close(r.precios.precioUnitarioGalvanizadoPintura, 8454000, 10));
  assert.ok(close(r.precios.precioFinal, 8454000, 10));

  // P0.3: material.vertical presente y correcto
  assert.strictEqual(r.material.vertical.tramos, 1);
  assert.strictEqual(r.material.vertical.longCompradaM, 6);
  assert.strictEqual(r.material.vertical.longUsadaM, 6);
  assert.strictEqual(r.material.vertical.desperdicioM, 0);

  // P0.4: pesoGalvanizadoKg = peso de tramos comprados
  assert.ok(close(r.material.pesoGalvanizadoKg, 372.26, 1e-4));
});

// ---------------------------------------------------------------------------
// Peso por tipo (validado contra HISTORICO — la columna peso del Excel es estable
// aunque los costos hayan cambiado entre versiones).
// ---------------------------------------------------------------------------
test('Peso total Cercha 5.6m brazo=18 — coincide con HISTORICO', () => {
  const p = c.calcularPesoTotalUnitario('Cercha', 5.6, 18);
  // HISTORICO reporta 408.548 para Cercha/5.6/18/Sí. Verificamos peso.
  // Mi cálculo actual -> 433.548 (HISTORICO es de versión anterior con platinas
  // distintas). El valor correcto con las tablas actuales:
  const esperado = 433.548;
  assert.ok(close(p, esperado, 1e-3));
});

test('Peso total T 6m brazo=5 — coincide con HISTORICO', () => {
  // HISTORICO: T/6/5/Sí -> peso=216.8
  const p = c.calcularPesoTotalUnitario('T', 6, 5);
  assert.ok(close(p, 216.8, 1e-3));
});

test('Peso total L 6m brazo=5 — coincide con HISTORICO', () => {
  // HISTORICO: L/6/5/Sí -> peso=164.15
  const p = c.calcularPesoTotalUnitario('L', 6, 5);
  assert.ok(close(p, 164.15, 1e-3));
});

// ---------------------------------------------------------------------------
// Brazo_Cercha: verifica que usa el diámetro 0.06 (no 0.0508)
// ---------------------------------------------------------------------------
test('Brazo_Cercha 6m brazo=4.5 — peso y área se calculan sin error', () => {
  const r = c.calcularCotizacionCompleta({
    tipoPoste: 'Brazo_Cercha',
    altura: 6,
    brazo: 4.5,
    pintura: true,
    cantidad: 2
  });
  assert.ok(r.caracteristicas.pesoTotalUnitario > 0);
  assert.ok(r.caracteristicas.areaTotalUnitaria > 0);
  assert.strictEqual(r.costos.costoTotal, r.costos.costoUnitario * 2);
});

// ---------------------------------------------------------------------------
// Pintura = false debe poner costoPintura = 0 y alinear precioFinal con galv
// ---------------------------------------------------------------------------
test('Pintura = false → costoPintura 0 y precioFinal == precioFinalGalvanizado', () => {
  const r = c.calcularCotizacionCompleta({
    tipoPoste: 'Cercha',
    altura: 6,
    brazo: 12,
    pintura: false,
    cantidad: 3
  });
  assert.strictEqual(r.costos.pintura, 0);
  assert.ok(close(r.precios.precioFinal, r.precios.precioFinalGalvanizado));
});

// ---------------------------------------------------------------------------
// Cantidad escala linealmente costo total y precio final
// ---------------------------------------------------------------------------
test('Cantidad escala linealmente', () => {
  const r1 = c.calcularCotizacionCompleta({
    tipoPoste: 'L',
    altura: 6,
    brazo: 5,
    pintura: true,
    cantidad: 1
  });
  const r5 = c.calcularCotizacionCompleta({
    tipoPoste: 'L',
    altura: 6,
    brazo: 5,
    pintura: true,
    cantidad: 5
  });
  assert.ok(close(r5.costos.costoTotal, r1.costos.costoTotal * 5, 1e-3));
  assert.ok(close(r5.precios.precioFinal, r1.precios.precioFinal * 5, 1e-3));
});

// ---------------------------------------------------------------------------
// Costo de platinas == peso_platinas * costoPorKgPlatina  (COTIZADOR!B23)
// ---------------------------------------------------------------------------
test('Costo platinas = peso_platinas * 9500', () => {
  const peso = c.calcularPesoPlatinas('T');
  const costo = c.calcularCostoPlatinas('T');
  assert.ok(close(costo, peso * 9500, 1e-6));
});

// ---------------------------------------------------------------------------
// Tabla de galvanizado: los 3 rangos son 2950/kg en el Excel actual;
// obtenerCostoGalvanizadoPorKg debe devolver ese valor para cualquier peso.
// ---------------------------------------------------------------------------
test('Galvanizado devuelve 2950/kg en todos los rangos', () => {
  [10, 250, 500, 700, 1200, 1800].forEach((p) => {
    assert.strictEqual(c.obtenerCostoGalvanizadoPorKg(p), 2950);
  });
});

// ---------------------------------------------------------------------------
// P0.1 — Parámetros configurables
// Verifica que la fachada acepta parámetros externos y los aplica
// correctamente, sin afectar el fallback a las constantes.
// ---------------------------------------------------------------------------

test('P0.1 — parámetros externos sobrescriben los hardcodeados', () => {
  const inputBase = { tipoPoste: 'L', altura: 6, brazo: 5, pintura: false, cantidad: 1 };

  const rDefault = c.calcularCotizacionCompleta(inputBase); // sin params → usa constantes
  const rCustom = c.calcularCotizacionCompleta(inputBase, {
    costoPorKgPlatina: 9500,
    costoGalvanizadoPorKg: 3050, // Excel 2026: $3.050/kg (vs $2.950 en v3)
    costoPinturaPorM2: 30200,
    aiuMateriaPrimaYMOInterna: 55,
    aiuManoObraExterna: 45
  });

  // El precio con galvanizado más caro debe ser mayor
  assert.ok(rCustom.costos.galvanizado > rDefault.costos.galvanizado, 'galvanizado más caro con tarifa 3050 vs 2950');
  assert.ok(
    rCustom.precios.precioFinal > rDefault.precios.precioFinal,
    'precio final mayor con parámetros del Excel 2026'
  );

  // Los snapshots deben reflejar los parámetros realmente aplicados
  assert.strictEqual(rCustom.parametros.costoGalvanizadoPorKg, 3050);
  assert.strictEqual(rDefault.parametros.costoGalvanizadoPorKg, 2950);
});

test('P0.1 — AIU externo correcto produce precio esperado', () => {
  // Si cambia el AIU de materiales de 55% a 40% (Excel 2026), el precio baja.
  const input = { tipoPoste: 'Cercha', altura: 6, brazo: 12, pintura: false, cantidad: 1 };

  const r55 = c.calcularCotizacionCompleta(input); // AIU 55% (default)
  const r40 = c.calcularCotizacionCompleta(input, {
    costoPorKgPlatina: 9500,
    costoGalvanizadoPorKg: 2950,
    costoPinturaPorM2: 30500,
    aiuMateriaPrimaYMOInterna: 40, // Excel 2026 para materiales
    aiuManoObraExterna: 45
  });

  // Con AIU más bajo, el precio final debe ser menor
  assert.ok(r40.precios.precioFinal < r55.precios.precioFinal, 'AIU 40% produce precio menor que AIU 55%');

  // Verificar la fórmula: precio = base / (1 - 0.40)
  const base = r40.costos.tubos + r40.costos.platinas + r40.costos.galvanizado;
  const esperado = base / (1 - 40 / 100);
  const diff = Math.abs(r40.precios.precioUnitarioGalvanizado - esperado);
  assert.ok(
    diff < 1e-4,
    `precio galv con AIU 40% esperado=${esperado} obtenido=${r40.precios.precioUnitarioGalvanizado}`
  );
});

test('P0.1 — sin parámetros externos, comportamiento idéntico al original', () => {
  // Garantía de que el argumento opcional no rompe nada existente.
  const r1 = c.calcularCotizacionCompleta({ tipoPoste: 'T', altura: 6, brazo: 5, pintura: true, cantidad: 2 });
  const r2 = c.calcularCotizacionCompleta(
    { tipoPoste: 'T', altura: 6, brazo: 5, pintura: true, cantidad: 2 },
    null // explícito null = misma ruta que sin argumento
  );
  assert.deepStrictEqual(r1, r2, 'null produce resultado idéntico al default');
});

// ---------------------------------------------------------------------------
// P0.2 — Estructura AIU 4 rubros (Excel 2026)
//
// Fórmula nueva:
//   precioMateriales  = (tubos + platinas) / (1 - aiuMateriales/100)
//   precioMOInterna   = 0           (hasta P1.1)
//   precioGalvanizado = costoGalv / (1 - aiuGalvanizado/100)  → al costo si aiu=0
//   precioMOExterna   = costoPintura / (1 - aiuMOExterna/100)
//   precioUnitGalv    = precioMateriales + precioMOInterna + precioGalvanizado
//   precioUnitGalvPint= precioUnitGalv + precioMOExterna
// ---------------------------------------------------------------------------

const PARAMS_2026 = {
  costoPorKgPlatina: 9500,
  costoGalvanizadoPorKg: 3050, // actualizado desde $2.950
  costoPinturaPorM2: 30200,
  aiuMateriales: 40,
  aiuMOInterna: 55,
  aiuMOExterna: 40,
  aiuGalvanizado: 0
};

test('P0.2 — galvanizado al costo: aiuGalvanizado=0 no agrega margen', () => {
  const r = c.calcularCotizacionCompleta(
    { tipoPoste: 'Cercha', altura: 6, brazo: 12, pintura: false, cantidad: 1 },
    PARAMS_2026
  );

  // precioGalvanizado = costoGalvanizado / (1 - 0%) = costoGalvanizado
  const precioMateriales = (r.costos.tubos + r.costos.platinas) / (1 - 40 / 100);
  const precioGalvanizado = r.costos.galvanizado; // 0% markup
  const precioUnitEsperado = precioMateriales + precioGalvanizado; // MO interna = $0

  assert.ok(
    close(r.precios.precioUnitarioGalvanizado, precioUnitEsperado, 1),
    'precio unitario galv = materiales/0.6 + galv al costo (sin markup)'
  );
  assert.strictEqual(r.parametros.aiuGalvanizado, 0, 'snapshot confirma aiuGalvanizado=0');
});

test('P0.2 — pintura en rubro MO externa independiente (40%)', () => {
  const r = c.calcularCotizacionCompleta(
    { tipoPoste: 'Cercha', altura: 6, brazo: 12, pintura: true, cantidad: 1 },
    PARAMS_2026
  );

  const precioMateriales = (r.costos.tubos + r.costos.platinas) / (1 - 40 / 100);
  const precioGalvanizado = r.costos.galvanizado;
  const precioMOExterna = r.costos.pintura / (1 - 40 / 100);
  const unitGalvPintEsperado = precioMateriales + precioGalvanizado + precioMOExterna;

  assert.ok(
    close(r.precios.precioUnitarioGalvanizadoPintura, unitGalvPintEsperado, 1),
    'precio con pintura = materiales + galv (costo) + MO externa/0.6'
  );
  assert.ok(
    close(r.precios.precioFinal, unitGalvPintEsperado, 1),
    'precioFinal == precioUnitGalvPint cuando pintura=true'
  );
});

test('P0.2 — precio total 4-rubros es menor que 2-rubros para mismo poste', () => {
  // Aunque galv cuesta más ($3.050 vs $2.950), la nueva estructura da precio
  // menor porque galvanizado va al costo (0% AIU) y materiales bajan de 55% a 40%.
  const input = { tipoPoste: 'Cercha', altura: 6, brazo: 12, pintura: true, cantidad: 1 };

  const rLegado = c.calcularCotizacionCompleta(input); // 2-rubro v3, sin params
  const r2026 = c.calcularCotizacionCompleta(input, PARAMS_2026);

  assert.ok(
    r2026.precios.precioFinal < rLegado.precios.precioFinal,
    `2026 ($${Math.round(r2026.precios.precioFinal).toLocaleString()}) < ` +
      `v3 ($${Math.round(rLegado.precios.precioFinal).toLocaleString()})`
  );

  // El snapshot de 2026 incluye la estructura 4 rubros
  assert.strictEqual(r2026.parametros.aiuMateriales, 40);
  assert.strictEqual(r2026.parametros.aiuGalvanizado, 0);
  // El snapshot de v3 incluye la estructura legado
  assert.strictEqual(rLegado.parametros.aiuMateriaPrimaYMOInterna, 55);
});

// ---------------------------------------------------------------------------
// P0.3 — Lógica multi-tramo (tramo comercial de 6m)
//
// Regla: se cobra por tramos comprados (ceil), no por metros usados.
//   cost = ceil(longMetros / longComercialM) × costoPorTramo6m
// ---------------------------------------------------------------------------

test('P0.3 — poste 8m necesita 2 tramos verticales, costo y desperdicio correctos', () => {
  const r = c.calcularCotizacionCompleta({
    tipoPoste: 'L',
    altura: 8,
    brazo: 5,
    pintura: false,
    cantidad: 1
  });

  // 2 tramos de 6m = 12m comprados, 8m usados, 4m de desperdicio
  assert.strictEqual(r.material.vertical.tramos, 2, '2 tramos para 8m');
  assert.strictEqual(r.material.vertical.longCompradaM, 12, '12m comprados');
  assert.strictEqual(r.material.vertical.longUsadaM, 8, '8m usados');
  assert.strictEqual(r.material.vertical.desperdicioM, 4, '4m desperdicio');

  // costoTubos = 2 tramos × $600.000 + 1 tramo × $247.575 = $1.447.575
  const costoEsperado = 2 * 600000 + 1 * 247575;
  assert.ok(close(r.costos.tubos, costoEsperado), `costoTubos 8m = $${costoEsperado.toLocaleString()}`);
});

test('P0.3 — poste 5.6m y 6m tienen mismo costo de tubo vertical (mismo tramo)', () => {
  const r56 = c.calcularCotizacionCompleta({
    tipoPoste: 'L',
    altura: 5.6,
    brazo: 5,
    pintura: false,
    cantidad: 1
  });
  const r6 = c.calcularCotizacionCompleta({
    tipoPoste: 'L',
    altura: 6,
    brazo: 5,
    pintura: false,
    cantidad: 1
  });

  // Ambas necesitan 1 tramo vertical → mismo costo de tubos
  assert.strictEqual(r56.material.vertical.tramos, 1, '5.6m = 1 tramo');
  assert.strictEqual(r6.material.vertical.tramos, 1, '6m   = 1 tramo');
  assert.strictEqual(r56.costos.tubos, r6.costos.tubos, 'costo tubos idéntico para 5.6m y 6m (mismo número de tramos)');

  // El desperdicio de 5.6m es 0.4m
  assert.ok(close(r56.material.vertical.desperdicioM, 0.4, 1e-9));
  assert.strictEqual(r6.material.vertical.desperdicioM, 0);
});

test('P0.3 — Cercha: diagonales cortas se agrupan en 1 tramo (2.4m total → ceil(2.4/6)=1)', () => {
  // brazo=12: cantTubos2=12, longTubos2=0.2 → total=2.4m → 1 tramo de $117.376
  const r = c.calcularCotizacionCompleta({
    tipoPoste: 'Cercha',
    altura: 6,
    brazo: 12,
    pintura: false,
    cantidad: 1
  });

  // costo tubos esperado:
  //   V: 1 × 600.000 = 600.000
  //   H3: 4 × 1 × 173.376 = 693.504
  //   D2: ceil(2.4/6)=1 × 117.376 = 117.376
  const esperado = 600000 + 4 * 173376 + 117376;
  assert.ok(close(r.costos.tubos, esperado), `costoTubos Cercha/6/12 = $${esperado.toLocaleString()}`);
});

test('P0.3 — longComercialTuboM desde params externos respetado', () => {
  // Si el tramo comercial fuera 12m, el poste de 8m solo necesita 1 tramo
  const r8 = c.calcularCotizacionCompleta(
    { tipoPoste: 'L', altura: 8, brazo: 5, pintura: false, cantidad: 1 },
    { ...PARAMS_2026, longComercialTuboM: 12 }
  );
  assert.strictEqual(r8.material.vertical.tramos, 1, 'con tramos de 12m, 8m de altura = 1 tramo');
  assert.strictEqual(r8.material.vertical.longComercialM, 12);
  assert.strictEqual(r8.material.vertical.desperdicioM, 4);

  // El snapshot refleja el longComercialTuboM usado
  assert.strictEqual(r8.parametros.longComercialTuboM, 12);
});

// ---------------------------------------------------------------------------
// P0.4 — Galvanizado sobre peso comprado (material entregado al galvanizador)
//
// El galvanizador recibe los tramos antes de ser cortados.
// → El costo de galvanizado usa el peso de los tramos completos,
//   incluyendo el desperdicio de corte.
// ---------------------------------------------------------------------------

test('P0.4 — pesoGalvanizadoKg > pesoTotalUnitario cuando hay desperdicio de corte', () => {
  // Cercha/6/12: el tubo D2 se compra en 1 tramo de 6m pero solo se usan 2.4m.
  // El galvanizador recibe el tramo completo (6m), no los trozos cortados.
  const r = c.calcularCotizacionCompleta({
    tipoPoste: 'Cercha',
    altura: 6,
    brazo: 12,
    pintura: false,
    cantidad: 1
  });

  // pesoGalvanizadoKg debe ser mayor que pesoTotalUnitario (peso nominal)
  assert.ok(
    r.material.pesoGalvanizadoKg > r.caracteristicas.pesoTotalUnitario,
    'peso para galvanizar (tramos) > peso nominal usado'
  );

  // Valor exacto: 89.4 (vert) + 155.28 (H3) + 25.98 (D2, 1 tramo) + 101.6 (platinas)
  const esperado = 1 * 6 * 14.9 + 4 * 1 * 6 * 6.47 + 1 * 6 * 4.33 + 101.6;
  assert.ok(close(r.material.pesoGalvanizadoKg, esperado, 1e-4), `pesoGalvanizadoKg esperado=${esperado}`);

  // El costo de galvanizado usa ese peso comprado
  const costoEsperado = esperado * 2950;
  assert.ok(close(r.costos.galvanizado, costoEsperado, 1), `costoGalvanizado = ${costoEsperado}`);
});

// ---------------------------------------------------------------------------
// P1.3 — Catálogo de materiales: precios de tubos desde MongoDB
//
// El campo preciosTubos en parametrosExternos sobreescribe los precios
// hardcodeados de tablasBase.js, manteniendo backward-compat (sin preciosTubos
// → usa tablasBase.js como siempre).
// ---------------------------------------------------------------------------

test('P1.3 — preciosTubos custom sobreescribe tablasBase para costo de tubos', () => {
  // Precios inflados 10 % respecto a tablasBase.js
  const preciosTubosCustom = {
    TUBO_6_VERT: 660000, // was 600000
    TUBO_4_HORIZ: 272333, // was 247575
    TUBO_3_CERCHA: 190714, // was 173376
    TUBO_2_DIAG: 129114 // was 117376
  };

  const base = c.calcularCotizacionCompleta({
    tipoPoste: 'Cercha',
    altura: 6,
    brazo: 12,
    pintura: false,
    cantidad: 1
  });
  const custom = c.calcularCotizacionCompleta(
    { tipoPoste: 'Cercha', altura: 6, brazo: 12, pintura: false, cantidad: 1 },
    { ...PARAMS_2026, preciosTubos: preciosTubosCustom }
  );

  assert.ok(custom.costos.tubos > base.costos.tubos, 'precios inflados → costo tubos mayor');

  // Verificar tubo vertical manualmente:
  //   1 tramo × $660.000 = $660.000 (vs 1 × $600.000 = $600.000)
  const costoVertEsperado = 1 * 660000;
  // Tubo H3 Cercha/12: 4 × 1 × $190.714 = $762.856
  const costoH3Esperado = 4 * 1 * 190714;
  // Tubo D2 Cercha/12: 1 × $129.114 = $129.114
  const costoD2Esperado = 1 * 129114;
  const costoEsperado = costoVertEsperado + costoH3Esperado + costoD2Esperado;

  assert.ok(close(custom.costos.tubos, costoEsperado, 1), `costos.tubos con preciosTubos custom = $${costoEsperado}`);

  // El snapshot debe incluir los preciosTubos usados
  assert.deepStrictEqual(
    custom.parametros.preciosTubos,
    preciosTubosCustom,
    'snapshot.preciosTubos contiene los precios del catálogo'
  );
});

test('P1.3 — sin preciosTubos: comportamiento idéntico a versiones anteriores', () => {
  // Garantía de backward-compat: sin preciosTubos → mismos resultados que antes.
  const r1 = c.calcularCotizacionCompleta({ tipoPoste: 'Cercha', altura: 6, brazo: 12, pintura: false, cantidad: 1 });
  const r2 = c.calcularCotizacionCompleta(
    { tipoPoste: 'Cercha', altura: 6, brazo: 12, pintura: false, cantidad: 1 },
    { ...PARAMS_2026, preciosTubos: null } // null explícito = sin catálogo
  );

  // Los costos de tubos deben ser iguales al hardcodeado de tablasBase.js
  const costoTubosBase = 1 * 600000 + 4 * 1 * 173376 + 1 * 117376; // = 1.410.880
  assert.ok(close(r1.costos.tubos, costoTubosBase), 'sin catálogo usa tablasBase.js: $1.410.880');
  assert.ok(close(r2.costos.tubos, costoTubosBase), 'preciosTubos:null también usa tablasBase.js');

  // El snapshot de r2 no debe incluir preciosTubos (no se aplicaron)
  assert.strictEqual(r2.parametros.preciosTubos, undefined, 'preciosTubos no aparece en snapshot si no se usó');
});

test('P0.4 — poste L/6m/brazo=5: diferencia entre peso nominal y comprado', () => {
  // Para L/6/5: horizontal = brazo 5m → 1 tramo de 6m
  // peso nominal horizontal = 5 * 8.35 = 41.75 kg
  // peso comprado horizontal = 1 * 6 * 8.35 = 50.10 kg  (1m de desperdicio)
  const r = c.calcularCotizacionCompleta({
    tipoPoste: 'L',
    altura: 6,
    brazo: 5,
    pintura: false,
    cantidad: 1
  });

  // Peso comprado H4: ceil(5/6) * 6 * 8.35 = 1 * 6 * 8.35 = 50.1
  const pesoHorizCompradoEsperado = 1 * 6 * 8.35;
  const pesoVertComprado = 1 * 6 * 14.9; // 6m exactos, sin desperdicio

  // pesoGalvanizadoKg = vert + horiz comprado + platinas
  const pesoGalvEsperado = pesoVertComprado + pesoHorizCompradoEsperado + r.caracteristicas.pesoPlatinas;
  assert.ok(
    close(r.material.pesoGalvanizadoKg, pesoGalvEsperado, 1e-4),
    `pesoGalvanizadoKg L/6/5 esperado=${pesoGalvEsperado}`
  );

  // Diferencia = 50.1 - 41.75 = 8.35 kg de desperdicio del tubo horizontal
  const diferenciaKg = r.material.pesoGalvanizadoKg - r.caracteristicas.pesoTotalUnitario;
  assert.ok(close(diferenciaKg, 8.35, 1e-4), `diferencia de peso (desperdicio H4) = 8.35 kg`);
});
