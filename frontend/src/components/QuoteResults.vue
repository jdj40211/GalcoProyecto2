<!--
  ResultadosCotizacion.vue

  Muestra el resultado de /calculate o /cotizador (crear).
  Secciones:
    1. Stats resumen (peso total, área total, precio final)
    2. Características técnicas (desglose peso + área)
    3. Costos unitarios (tubos / platinas / galvanizado / pintura)
    4. Precios finales con AIU
-->

<template>
  <div class="results">
    <!-- Header con consecutivo si ya está persistido -->
    <div class="results-head">
      <div>
        <div class="eyebrow">{{ consecutivo ? 'Cotización guardada' : 'Resultado del cálculo' }}</div>
        <h2>{{ configuracion.tipoPoste }} · {{ configuracion.altura }} m · brazo {{ configuracion.brazo }}</h2>
      </div>
      <div v-if="consecutivo" class="badge badge-amber">{{ consecutivo }}</div>
    </div>

    <!-- ==================== STATS ==================== -->
    <div class="grid-3 mt-4">
      <div class="stat">
        <div class="eyebrow">Peso unitario</div>
        <div class="value">
          {{ decimal(caracteristicas.pesoTotalUnitario, 2) }}
          <span class="unit">kg</span>
        </div>
      </div>
      <div class="stat">
        <div class="eyebrow">Área unitaria</div>
        <div class="value">
          {{ decimal(caracteristicas.areaTotalUnitaria, 3) }}
          <span class="unit">m²</span>
        </div>
      </div>
      <div class="stat stat-hero">
        <div class="eyebrow">Precio final ({{ configuracion.cantidad }} und)</div>
        <div class="value hero">{{ money(precios.precioFinal) }}</div>
      </div>
    </div>

    <!-- ==================== TECH SPECS ==================== -->
    <section class="card mt-4">
      <div class="section-head">
        <h3>Características técnicas</h3>
        <span class="text-sm text-mute">por unidad</span>
      </div>
      <div class="grid-2 split">
        <table class="table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th class="num">Peso</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tubo vertical 6"</td>
              <td class="num">{{ decimal(caracteristicas.pesoVertical, 2) }} kg</td>
            </tr>
            <tr>
              <td>Tubos horizontales</td>
              <td class="num">{{ decimal(caracteristicas.pesoHorizontales, 2) }} kg</td>
            </tr>
            <tr>
              <td>Platinas</td>
              <td class="num">{{ decimal(caracteristicas.pesoPlatinas, 2) }} kg</td>
            </tr>
            <tr class="total">
              <td>Peso total</td>
              <td class="num">{{ decimal(caracteristicas.pesoTotalUnitario, 2) }} kg</td>
            </tr>
          </tbody>
        </table>

        <table class="table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th class="num">Área</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tubo vertical 6"</td>
              <td class="num">{{ decimal(caracteristicas.areaVertical, 3) }} m²</td>
            </tr>
            <tr>
              <td>Tubos horizontales</td>
              <td class="num">{{ decimal(caracteristicas.areaHorizontales, 3) }} m²</td>
            </tr>
            <tr>
              <td>Platinas</td>
              <td class="num">{{ decimal(caracteristicas.areaPlatinas, 3) }} m²</td>
            </tr>
            <tr class="total">
              <td>Área total</td>
              <td class="num">{{ decimal(caracteristicas.areaTotalUnitaria, 3) }} m²</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ==================== COSTS ==================== -->
    <section class="card mt-4">
      <div class="section-head">
        <h3>Costos unitarios</h3>
        <span class="text-sm text-mute">
          Galvanizado {{ money(parametros.costoGalvanizadoPorKg) }}/kg · Pintura
          {{ money(parametros.costoPorM2Pintura) }}/m²
        </span>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Concepto</th>
            <th class="num">Valor (por unidad)</th>
            <th class="num">Total ({{ configuracion.cantidad }} und)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tubos</td>
            <td class="num">{{ money(costos.tubos) }}</td>
            <td class="num">{{ money(costos.tubos * configuracion.cantidad) }}</td>
          </tr>
          <tr>
            <td>Platinas</td>
            <td class="num">{{ money(costos.platinas) }}</td>
            <td class="num">{{ money(costos.platinas * configuracion.cantidad) }}</td>
          </tr>
          <tr>
            <td>Galvanizado</td>
            <td class="num">{{ money(costos.galvanizado) }}</td>
            <td class="num">{{ money(costos.galvanizado * configuracion.cantidad) }}</td>
          </tr>
          <tr>
            <td>
              Pintura
              <span v-if="!configuracion.pintura" class="text-sm text-mute">— omitida</span>
            </td>
            <td class="num">{{ money(costos.pintura) }}</td>
            <td class="num">{{ money(costos.pintura * configuracion.cantidad) }}</td>
          </tr>
          <tr class="total">
            <td>Costo unitario</td>
            <td class="num">{{ money(costos.costoUnitario) }}</td>
            <td class="num">{{ money(costos.costoTotal) }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- ==================== PRICES ==================== -->
    <section class="card mt-4">
      <div class="section-head">
        <h3>Precios finales</h3>
        <span class="text-sm text-mute">
          AIU materiales {{ parametros.aiuMateriales ?? parametros.aiuMateriaPrimaYMOInterna ?? 0 }}% · AIU externo
          {{ parametros.aiuMOExterna ?? parametros.aiuManoObraExterna ?? 0 }}%
        </span>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Concepto</th>
            <th class="num">P. Unitario</th>
            <th class="num">Cantidad</th>
            <th class="num">P. Final</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Precio galvanizado</td>
            <td class="num">{{ money(precios.precioUnitarioGalvanizado) }}</td>
            <td class="num">{{ configuracion.cantidad }}</td>
            <td class="num">{{ money(precios.precioFinalGalvanizado) }}</td>
          </tr>
          <tr>
            <td>Precio galvanizado + pintura</td>
            <td class="num">{{ money(precios.precioUnitarioGalvanizadoPintura) }}</td>
            <td class="num">{{ configuracion.cantidad }}</td>
            <td class="num">{{ money(precios.precioFinalGalvanizadoPintura) }}</td>
          </tr>
          <tr class="total-final">
            <td :colspan="3">
              TOTAL A FACTURAR
              <span class="text-sm" style="font-weight: 400; opacity: 0.7">
                ({{ configuracion.pintura ? 'galvanizado + pintura' : 'solo galvanizado' }})
              </span>
            </td>
            <td class="num">{{ money(precios.precioFinal) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { money, decimal } from '@/services/format';

const props = defineProps({
  resultado: { type: Object, required: true },
  configuracion: { type: Object, required: true },
  consecutivo: { type: String, default: null }
});

// El resultado puede venir del endpoint /calculate (plano) o de un documento
// persistido (con caracteristicas, costos, precios como subdocs).
// Normalizamos ambos formatos aquí.
const caracteristicas = computed(() => props.resultado.caracteristicas);
const costos = computed(() => props.resultado.costos);
const precios = computed(() => props.resultado.precios);
const parametros = computed(() => props.resultado.parametros || props.resultado.parametrosAplicados || {});
</script>

<style scoped>
.results-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 2px 2px;
}
.results-head h2 {
  margin-top: 4px;
  color: var(--primary);
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--line-soft);
}
.section-head h3 {
  font-family: var(--font-head);
  color: var(--primary);
  font-size: 16px;
  font-weight: 600;
}
.card {
  overflow-x: auto;
  padding: 0;
}
.card .table {
  margin: 0;
}
.card .table th:first-child,
.card .table td:first-child {
  padding-left: 20px;
}
.card .table th:last-child,
.card .table td:last-child {
  padding-right: 20px;
}

.split {
  gap: 0;
}
.split > .table:first-child {
  border-right: 1px solid var(--line-soft);
}

.stat-hero {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.stat-hero::before {
  background: var(--accent);
}
.stat-hero .eyebrow {
  color: rgba(255, 255, 255, 0.76);
}
.stat-hero .value.hero {
  font-family: var(--font-num);
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

@media (max-width: 700px) {
  .results-head,
  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .card .table {
    min-width: 560px;
  }
  .split > .table {
    min-width: 100%;
  }
}
</style>
