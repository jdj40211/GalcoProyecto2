<!--
  CotizadorPostes.vue

  Vista principal: formulario (como el Excel) + resultados en vivo.
  Estructura en dos columnas: configuración a la izquierda, resultados a la derecha.

  Flujo:
    1. cargar catálogos (tipos, alturas, brazos válidos)
    2. el usuario completa el formulario
    3. "Calcular" llama a POST /cotizador/calculate
    4. "Guardar" llama a POST /cotizador y deja el doc persistido
    5. Cuando hay cotización guardada, el botón PDF se habilita
-->

<template>
  <div class="page">
    <!-- ==================== HEADER ==================== -->
    <header class="module-heading">
      <div>
        <div class="eyebrow">GALCO · Cotizador</div>
        <h2>Postes Metálicos</h2>
      </div>
      <div class="head-actions">
        <router-link to="/cotizador/historial" class="btn btn-ghost">
          <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
          Historial
        </router-link>
      </div>
    </header>

    <div v-if="store.error && !catalogos" class="alert error">{{ store.error }}</div>
    <div v-else-if="!catalogos" class="alert">Cargando catálogos…</div>

    <!-- ==================== MAIN GRID ==================== -->
    <div v-else class="cotizador-grid">
      <!-- ==================== FORM ==================== -->
      <section class="card card-pad form-panel">
        <h2>Configuración</h2>
        <p class="text-sm text-mute mt-2 mb-4">
          Equivalente a la hoja <span class="font-mono">COTIZADOR</span> del libro Excel.
        </p>

        <div class="grid-2">
          <div>
            <label for="quote-type">Tipo de poste</label>
            <select id="quote-type" v-model="form.tipoPoste" @change="onTipoChange">
              <option v-for="t in catalogos.tiposPoste" :key="t" :value="t">{{ t }}</option>
            </select>
            <div class="field-hint">L, T, Cercha o Brazo_Cercha</div>
          </div>

          <div>
            <label for="quote-height">Altura (m)</label>
            <select id="quote-height" v-model.number="form.altura">
              <option v-for="a in catalogos.alturas" :key="a" :value="a">{{ a }}</option>
            </select>
            <div class="field-hint">5,6 o 6,0 m</div>
          </div>

          <div>
            <label for="quote-arm">Brazo / Ancho (m)</label>
            <!-- Cercha y Brazo_Cercha: lista discreta -->
            <select v-if="brazosDiscretos" id="quote-arm" v-model.number="form.brazo">
              <option v-for="b in brazosDiscretos" :key="b" :value="b">{{ b }}</option>
            </select>
            <!-- L y T: libre -->
            <input v-else type="number" step="0.1" min="0.1" max="20" id="quote-arm" v-model.number="form.brazo" />
            <div class="field-hint">{{ brazoHint }}</div>
          </div>

          <div>
            <label for="quote-paint">Pintura</label>
            <select id="quote-paint" v-model="form.pintura">
              <option :value="true">Sí</option>
              <option :value="false">No</option>
            </select>
            <div class="field-hint">Costo adicional por m²</div>
          </div>

          <div>
            <label for="quote-quantity">Cantidad</label>
            <input id="quote-quantity" type="number" min="1" step="1" v-model.number="form.cantidad" />
            <div class="field-hint">Número de postes</div>
          </div>
        </div>

        <hr class="hairline" />

        <h3>Cliente y vendedor</h3>
        <div class="grid-2 mt-3">
          <div>
            <label for="quote-seller">Vendedor</label>
            <input id="quote-seller" type="text" v-model.trim="meta.vendedor" placeholder="Nombre" />
          </div>
          <div>
            <label for="quote-client">Cliente</label>
            <input id="quote-client" type="text" v-model.trim="meta.cliente" placeholder="Empresa o persona" />
          </div>
          <div>
            <label for="quote-valid-until">Vigencia hasta</label>
            <input id="quote-valid-until" type="date" v-model="meta.vigenciaHasta" :min="today" />
          </div>
        </div>
        <div class="mt-3">
          <label for="quote-notes">Observaciones</label>
          <textarea
            id="quote-notes"
            rows="2"
            v-model.trim="meta.observaciones"
            placeholder="Notas internas opcionales"
          ></textarea>
        </div>

        <div class="form-actions mt-6">
          <button class="btn btn-accent" :disabled="!puedeCalcular || store.cargando" @click="calcular">
            <i class="fa-solid fa-calculator" aria-hidden="true"></i>
            {{ store.cargando ? 'Calculando…' : 'Calcular' }}
          </button>

          <button class="btn btn-primary" :disabled="!puedeGuardar || store.cargando" @click="guardar">
            <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>
            Guardar cotización
          </button>

          <button v-if="cotizacionPersistida" class="btn btn-ghost" @click="descargarPdf">
            <i class="fa-solid fa-file-pdf" aria-hidden="true"></i>
            Descargar PDF
          </button>
        </div>

        <div v-if="store.error" class="alert error mt-4">{{ store.error }}</div>
      </section>

      <!-- ==================== RESULTS ==================== -->
      <section class="results-panel">
        <!-- Esquema estructural — siempre visible, cambia con el tipo -->
        <div class="card card-pad scheme-card">
          <div class="scheme-header">
            <div class="eyebrow">Esquema estructural</div>
            <span class="tipo-badge">{{ form.tipoPoste }}</span>
          </div>
          <div class="scheme-preview">
            <!-- Poste L: un brazo a un lado -->
            <svg v-if="form.tipoPoste === 'L'" viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg">
              <rect width="240" height="180" fill="none" />
              <rect x="50" y="162" width="80" height="8" rx="2" fill="var(--text)" />
              <rect x="84" y="28" width="8" height="134" fill="var(--primary)" />
              <rect x="84" y="48" width="140" height="5" fill="var(--primary)" />
              <polygon points="84,48 84,74 112,48" fill="var(--primary)" />
              <circle cx="221" cy="50" r="7" fill="var(--accent)" opacity="0.95" />
              <circle cx="221" cy="50" r="3.5" fill="#ebf5dc" />
              <text
                x="95"
                y="20"
                fill="var(--primary-light)"
                font-family="Inter, sans-serif"
                font-size="11"
                font-weight="700"
              >
                Poste L
              </text>
            </svg>

            <!-- Poste T: brazos a ambos lados -->
            <svg v-else-if="form.tipoPoste === 'T'" viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg">
              <rect width="240" height="180" fill="none" />
              <rect x="80" y="162" width="80" height="8" rx="2" fill="var(--text)" />
              <rect x="116" y="28" width="8" height="134" fill="var(--primary)" />
              <rect x="18" y="48" width="204" height="5" fill="var(--primary)" />
              <polygon points="116,48 116,74 144,48" fill="var(--primary)" />
              <polygon points="124,48 124,74 96,48" fill="var(--primary)" />
              <circle cx="20" cy="50" r="7" fill="var(--accent)" opacity="0.95" />
              <circle cx="20" cy="50" r="3.5" fill="#ebf5dc" />
              <circle cx="220" cy="50" r="7" fill="var(--accent)" opacity="0.95" />
              <circle cx="220" cy="50" r="3.5" fill="#ebf5dc" />
              <text
                x="95"
                y="20"
                fill="var(--primary-light)"
                font-family="Inter, sans-serif"
                font-size="11"
                font-weight="700"
              >
                Poste T
              </text>
            </svg>

            <!-- Cercha: pórtico con dos postes y celosía superior -->
            <svg v-else-if="form.tipoPoste === 'Cercha'" viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg">
              <rect width="240" height="180" fill="none" />
              <rect x="8" y="162" width="58" height="8" rx="2" fill="var(--text)" />
              <rect x="174" y="162" width="58" height="8" rx="2" fill="var(--text)" />
              <rect x="32" y="34" width="8" height="128" fill="var(--primary)" />
              <rect x="200" y="34" width="8" height="128" fill="var(--primary)" />
              <rect x="32" y="34" width="176" height="6" fill="var(--primary)" />
              <rect x="32" y="82" width="176" height="4" fill="var(--primary)" />
              <line x1="36" y1="40" x2="120" y2="82" stroke="var(--primary)" stroke-width="3.5" />
              <line x1="204" y1="40" x2="120" y2="82" stroke="var(--primary)" stroke-width="3.5" />
              <rect x="118" y="40" width="4" height="42" fill="var(--primary)" />
              <circle cx="32" cy="27" r="7" fill="var(--accent)" opacity="0.95" />
              <circle cx="32" cy="27" r="3.5" fill="#ebf5dc" />
              <circle cx="208" cy="27" r="7" fill="var(--accent)" opacity="0.95" />
              <circle cx="208" cy="27" r="3.5" fill="#ebf5dc" />
              <text
                x="90"
                y="172"
                fill="var(--primary-light)"
                font-family="Inter, sans-serif"
                font-size="11"
                font-weight="700"
              >
                Cercha
              </text>
            </svg>

            <!-- Brazo_Cercha: un poste con brazo de celosía -->
            <svg v-else viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg">
              <rect width="240" height="180" fill="none" />
              <rect x="18" y="162" width="68" height="8" rx="2" fill="var(--text)" />
              <rect x="48" y="28" width="8" height="134" fill="var(--primary)" />
              <rect x="52" y="30" width="170" height="5" fill="var(--primary)" />
              <rect x="52" y="62" width="152" height="5" fill="var(--primary)" />
              <rect x="218" y="30" width="5" height="37" fill="var(--primary)" />
              <line x1="56" y1="35" x2="94" y2="62" stroke="var(--primary)" stroke-width="3" />
              <line x1="94" y1="35" x2="130" y2="62" stroke="var(--primary)" stroke-width="3" />
              <line x1="130" y1="35" x2="166" y2="62" stroke="var(--primary)" stroke-width="3" />
              <line x1="166" y1="35" x2="202" y2="62" stroke="var(--primary)" stroke-width="3" />
              <rect x="93" y="35" width="3" height="27" fill="var(--primary)" />
              <rect x="129" y="35" width="3" height="27" fill="var(--primary)" />
              <rect x="165" y="35" width="3" height="27" fill="var(--primary)" />
              <circle cx="220" cy="64" r="7" fill="var(--accent)" opacity="0.95" />
              <circle cx="220" cy="64" r="3.5" fill="#ebf5dc" />
              <text
                x="64"
                y="20"
                fill="var(--primary-light)"
                font-family="Inter, sans-serif"
                font-size="11"
                font-weight="700"
              >
                Brazo Cercha
              </text>
            </svg>
          </div>
        </div>

        <!-- Resultados de la cotización -->
        <QuoteResults
          v-if="resultado"
          :resultado="resultado"
          :configuracion="form"
          :consecutivo="cotizacionPersistida?.consecutivo"
        />
        <div v-else class="card card-pad placeholder">
          <div class="eyebrow">Resultado</div>
          <p class="text-mute mt-2">
            Completa la configuración y pulsa <strong>Calcular</strong> para ver pesos, áreas, costos y precios finales.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useCotizadorStore } from '@/stores/cotizador.store';
import { useAuthStore } from '@/stores/auth.store';
import { useToastStore } from '@/stores/toast.store';
import cotizadorApi from '@/services/cotizador.service';
import QuoteResults from '@/components/QuoteResults.vue';

const store = useCotizadorStore();
const auth = useAuthStore();
const toast = useToastStore();

const catalogos = computed(() => store.catalogos);

// ---------- Formulario ----------
const form = ref({
  tipoPoste: 'Cercha',
  altura: 6,
  brazo: 12,
  pintura: true,
  cantidad: 1
});

const meta = ref({
  vendedor: auth.user?.nombre || auth.user?.usuario || '',
  cliente: '',
  vigenciaHasta: defaultValidityDate(),
  observaciones: ''
});

const today = new Date().toISOString().slice(0, 10);

function defaultValidityDate() {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  return date.toISOString().slice(0, 10);
}

// Resultado: puede venir del cálculo en vivo (store.resultado sin _id)
// o de la cotización guardada (doc completo con consecutivo).
const resultado = computed(() => store.resultado);
const cotizacionPersistida = computed(() => (resultado.value && resultado.value._id ? resultado.value : null));

// Brazos discretos según tipo (null = L o T, libre)
const brazosDiscretos = computed(() => {
  if (!catalogos.value) return null;
  return catalogos.value.brazos?.[form.value.tipoPoste] ?? null;
});

const brazoHint = computed(() => {
  const t = form.value.tipoPoste;
  if (t === 'Cercha') return 'Cercha: 12, 18 o 21 m';
  if (t === 'Brazo_Cercha') return 'Brazo_Cercha: 3 a 6 m en pasos de 0,5';
  return 'L / T: valor libre en metros';
});

// Reset brazo a un valor válido cuando cambia el tipo
function onTipoChange() {
  const tipo = form.value.tipoPoste;
  const opts = catalogos.value?.brazos?.[tipo];
  if (opts && opts.length) form.value.brazo = opts[0];
  else if (tipo === 'L' || tipo === 'T') form.value.brazo = 5;
  // al cambiar de tipo el resultado anterior ya no aplica
  store.limpiarResultado();
}

// Validaciones UI (duplicadas pero ligeras — la "real" ocurre en el backend)
const puedeCalcular = computed(() => {
  const f = form.value;
  if (!f.tipoPoste || !f.altura || !f.brazo || f.cantidad < 1) return false;
  if (brazosDiscretos.value && !brazosDiscretos.value.includes(f.brazo)) return false;
  return true;
});

const puedeGuardar = computed(
  () => puedeCalcular.value && meta.value.cliente && meta.value.vendedor && meta.value.vigenciaHasta >= today
);

// Recalcular en vivo cuando cambian los inputs (opcional - con debounce simple)
let recalcTimer = null;
watch(
  form,
  () => {
    if (recalcTimer) clearTimeout(recalcTimer);
    if (!puedeCalcular.value) return;
    recalcTimer = setTimeout(() => {
      // Sólo recalcular automáticamente si el usuario ya había calculado al menos una vez
      if (resultado.value && !cotizacionPersistida.value) {
        calcular();
      }
    }, 350);
  },
  { deep: true }
);

async function calcular() {
  try {
    await store.calcular(form.value);
  } catch (_e) {
    /* store.error ya tiene el mensaje */
  }
}

async function guardar() {
  try {
    const doc = await store.guardar(form.value, meta.value);
    toast.show(`Cotización guardada: ${doc.consecutivo}`, 'success');
  } catch (_e) {
    /* manejado en store */
  }
}

async function descargarPdf() {
  if (!cotizacionPersistida.value) return;
  try {
    await cotizadorApi.descargarPdf(cotizacionPersistida.value._id, cotizacionPersistida.value.consecutivo);
  } catch (err) {
    toast.show(`Error descargando PDF: ${err.message || err}`, 'error');
  }
}

onMounted(async () => {
  try {
    await store.cargarCatalogos();
  } catch (_error) {
    /* visible en store.error */
  }
});
</script>

<style scoped>
.page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 0 60px;
}
.module-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  margin-bottom: 24px;
}
.module-heading > div:first-child {
  padding-left: 12px;
  border-left: 4px solid var(--accent);
}
.module-heading h2 {
  margin: 0;
  color: var(--primary);
  font-size: 26px;
}
.module-heading .eyebrow {
  margin-bottom: 2px;
}
.head-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 700px) {
  .page {
    padding: 0 0 40px;
  }
  .module-heading {
    margin-bottom: 20px;
    align-items: flex-start;
    gap: 12px;
  }
  .module-heading .head-actions {
    flex-direction: column;
  }
  .module-heading .btn {
    width: auto;
    min-height: 38px;
    padding: 8px 10px;
    font-size: 12px;
  }
  .module-heading h2 {
    font-size: 23px;
  }
}

.cotizador-grid {
  display: grid;
  grid-template-columns: minmax(380px, 1fr) minmax(500px, 1.3fr);
  gap: 24px;
  align-items: start;
}
@media (max-width: 1000px) {
  .cotizador-grid {
    grid-template-columns: 1fr;
  }
  .form-panel {
    position: static;
  }
}

.form-panel {
  position: sticky;
  top: 102px;
}
.form-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.placeholder {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.scheme-card {
  margin-bottom: 16px;
  border-top: 3px solid var(--accent);
}
.scheme-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.tipo-badge {
  border: 0;
  background: var(--accent-light);
  color: var(--accent-dark);
}
.scheme-preview {
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface-muted);
}
.scheme-preview svg {
  display: block;
  width: 100%;
  height: auto;
  max-width: 300px;
  margin: 0 auto;
}

h3 {
  font-family: var(--font-head);
  font-size: 14px;
  letter-spacing: 0.02em;
  color: var(--primary);
  text-transform: uppercase;
}
</style>
