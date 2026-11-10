<template>
  <section class="card">
    <div class="card-header">
      <h2>Revisar análisis de hoja de vida</h2>
      <p>
        La IA propuso estos datos a partir de la hoja de vida. Verifícalos y corrígelos: solo se guardan en la ficha del
        candidato cuando los confirmas.
      </p>
    </div>
    <div v-if="loading" class="loading-state"><span class="spinner spinner-primary"></span>Cargando análisis…</div>
    <EmptyState
      v-else-if="!analysis || analysis.estado !== 'pendiente'"
      icon="fa-file-circle-question"
      :title="analysis ? 'Este análisis ya fue confirmado' : 'Análisis no encontrado'"
      message="Vuelve a la lista de candidatos para consultar sus datos o analizar de nuevo la hoja de vida."
    />
    <div v-else class="validation-layout">
      <div class="receipt-preview">
        <PdfPreview v-if="previewUrl" :data-url="previewUrl" :file-name="document.nombre" />
        <div v-else-if="document">
          <p>{{ document.nombre }}</p>
          <button class="btn btn-outline" type="button" @click="download">Descargar documento</button>
        </div>
      </div>
      <form class="validation-form" @submit.prevent="submit">
        <div class="confidence-note" :class="pendingCount ? 'confidence-baja' : 'confidence-alta'">
          <i class="fas fa-circle-info"></i
          >{{
            pendingCount
              ? `${pendingCount} ${pendingCount === 1 ? 'dato quedó pendiente' : 'datos quedaron pendientes'} de revisión.`
              : 'La IA leyó todos los datos con claridad.'
          }}
          Verifica antes de confirmar.
        </div>

        <div class="form-group">
          <label for="review-name">Nombre completo *</label>
          <div class="field-with-status">
            <input
              id="review-name"
              v-model.trim="form.nombre"
              required
              minlength="3"
              maxlength="120"
              :class="fieldClass('nombre')"
            /><FieldBadge :pending="pending('nombre')" :confidence="confidence('nombre')" />
          </div>
        </div>
        <div class="form-group">
          <label for="review-email">Correo</label>
          <div class="field-with-status">
            <input
              id="review-email"
              v-model.trim="form.correo"
              type="email"
              maxlength="254"
              :class="fieldClass('correo')"
            /><FieldBadge :pending="pending('correo')" :confidence="confidence('correo')" />
          </div>
        </div>
        <div class="form-group">
          <label for="review-phone">Teléfono</label>
          <div class="field-with-status">
            <input
              id="review-phone"
              v-model.trim="form.telefono"
              type="tel"
              maxlength="20"
              :class="fieldClass('telefono')"
            /><FieldBadge :pending="pending('telefono')" :confidence="confidence('telefono')" />
          </div>
        </div>
        <div class="form-group">
          <label for="review-city">Ciudad</label>
          <div class="field-with-status">
            <input
              id="review-city"
              v-model.trim="form.ciudad"
              maxlength="120"
              :class="fieldClass('ciudad')"
            /><FieldBadge :pending="pending('ciudad')" :confidence="confidence('ciudad')" />
          </div>
        </div>

        <fieldset class="review-group">
          <legend>Formación académica</legend>
          <div v-for="(item, index) in form.formacion" :key="item.id" class="review-group">
            <div class="form-row">
              <div class="form-group">
                <label :for="`review-education-title-${index}`">Título *</label>
                <input
                  :id="`review-education-title-${index}`"
                  v-model.trim="item.titulo"
                  required
                  minlength="2"
                  :class="rowClass(item)"
                />
              </div>
              <div class="form-group">
                <label :for="`review-education-school-${index}`">Institución *</label
                ><input
                  :id="`review-education-school-${index}`"
                  v-model.trim="item.institucion"
                  required
                  minlength="2"
                  :class="rowClass(item)"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label :for="`review-education-level-${index}`">Nivel</label
                ><input :id="`review-education-level-${index}`" v-model.trim="item.nivel" />
              </div>
              <div class="form-group">
                <label :for="`review-education-year-${index}`">Año de grado</label
                ><input
                  :id="`review-education-year-${index}`"
                  v-model.number="item.anio"
                  type="number"
                  min="1950"
                  :max="maxGraduationYear"
                />
              </div>
            </div>
            <div class="button-row">
              <FieldBadge v-if="item.confianza" :pending="item.confianza === 'baja'" :confidence="item.confianza" />
              <button
                class="icon-btn"
                type="button"
                :aria-label="`Eliminar formación ${index + 1}`"
                :title="`Eliminar formación ${index + 1}`"
                @click="form.formacion.splice(index, 1)"
              >
                <i class="fas fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div class="button-row">
            <button class="btn btn-outline" type="button" @click="add('formacion')">
              <i class="fas fa-plus" aria-hidden="true"></i>Agregar formación
            </button>
          </div>
        </fieldset>

        <fieldset class="review-group">
          <legend>Experiencia laboral · {{ years }} años en total</legend>
          <div v-for="(item, index) in form.experiencia" :key="item.id" class="review-group">
            <div class="form-row">
              <div class="form-group">
                <label :for="`review-experience-position-${index}`">Cargo *</label>
                <input
                  :id="`review-experience-position-${index}`"
                  v-model.trim="item.cargo"
                  required
                  minlength="2"
                  :class="rowClass(item)"
                />
              </div>
              <div class="form-group">
                <label :for="`review-experience-company-${index}`">Empresa *</label
                ><input
                  :id="`review-experience-company-${index}`"
                  v-model.trim="item.empresa"
                  required
                  minlength="2"
                  :class="rowClass(item)"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label :for="`review-experience-from-${index}`">Desde *</label
                ><input
                  :id="`review-experience-from-${index}`"
                  v-model="item.desde"
                  type="month"
                  required
                  :class="rowClass(item)"
                />
              </div>
              <div class="form-group">
                <label :for="`review-experience-to-${index}`">Hasta (vacío si trabaja allí)</label
                ><input
                  :id="`review-experience-to-${index}`"
                  v-model="item.hasta"
                  type="month"
                  :min="item.desde"
                  :class="rowClass(item)"
                />
              </div>
            </div>
            <div class="button-row">
              <FieldBadge v-if="item.confianza" :pending="item.confianza === 'baja'" :confidence="item.confianza" />
              <button
                class="icon-btn"
                type="button"
                :aria-label="`Eliminar experiencia ${index + 1}`"
                :title="`Eliminar experiencia ${index + 1}`"
                @click="form.experiencia.splice(index, 1)"
              >
                <i class="fas fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div class="button-row">
            <button class="btn btn-outline" type="button" @click="add('experiencia')">
              <i class="fas fa-plus" aria-hidden="true"></i>Agregar experiencia
            </button>
          </div>
        </fieldset>

        <fieldset class="review-group">
          <legend>Certificaciones</legend>
          <div v-for="(item, index) in form.certificaciones" :key="item.id" class="review-group">
            <div class="form-row">
              <div class="form-group">
                <label :for="`review-certification-name-${index}`">Certificación *</label>
                <input
                  :id="`review-certification-name-${index}`"
                  v-model.trim="item.nombre"
                  required
                  minlength="2"
                  :class="rowClass(item)"
                />
              </div>
              <div class="form-group">
                <label :for="`review-certification-entity-${index}`">Entidad</label
                ><input :id="`review-certification-entity-${index}`" v-model.trim="item.entidad" />
              </div>
            </div>
            <div class="form-group">
              <label :for="`review-certification-expiry-${index}`">Vencimiento</label
              ><input :id="`review-certification-expiry-${index}`" v-model="item.vencimiento" type="date" />
            </div>
            <div class="button-row">
              <FieldBadge v-if="item.confianza" :pending="item.confianza === 'baja'" :confidence="item.confianza" />
              <button
                class="icon-btn"
                type="button"
                :aria-label="`Eliminar certificación ${index + 1}`"
                :title="`Eliminar certificación ${index + 1}`"
                @click="form.certificaciones.splice(index, 1)"
              >
                <i class="fas fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div class="button-row">
            <button class="btn btn-outline" type="button" @click="add('certificaciones')">
              <i class="fas fa-plus" aria-hidden="true"></i>Agregar certificación
            </button>
          </div>
        </fieldset>

        <div class="form-group">
          <label for="review-skills">Habilidades (separadas por comas)</label>
          <div class="field-with-status">
            <input id="review-skills" v-model="form.habilidades" :class="fieldClass('habilidades')" /><FieldBadge
              :pending="pending('habilidades')"
              :confidence="confidence('habilidades')"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="review-languages">Idiomas (separados por comas)</label>
          <div class="field-with-status">
            <input id="review-languages" v-model="form.idiomas" :class="fieldClass('idiomas')" /><FieldBadge
              :pending="pending('idiomas')"
              :confidence="confidence('idiomas')"
            />
          </div>
        </div>

        <div class="button-row">
          <button class="btn btn-success btn-lg grow" :disabled="saving">
            <span v-if="saving" class="spinner"></span><i v-else class="fas fa-check"></i
            >{{ saving ? 'Guardando…' : 'Confirmar datos' }}</button
          ><button type="button" class="btn btn-outline btn-lg" @click="cancel">Cancelar</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import FieldBadge from '@/components/FieldBadge.vue';
import PdfPreview from '@/components/PdfPreview.vue';
import { candidatosService } from '@/services/candidatos.service';
import { useToastStore } from '@/stores/toast.store';

const route = useRoute();
const router = useRouter();
const toast = useToastStore();
const loading = ref(true);
const saving = ref(false);
const candidate = ref(null);
const analysis = ref(null);
const document = ref(null);
const previewUrl = ref('');
const maxGraduationYear = new Date().getFullYear() + 6;
let rowSequence = 0;

const rows = {
  formacion: () => ({ titulo: '', institucion: '', nivel: '', anio: null }),
  experiencia: () => ({ cargo: '', empresa: '', desde: '', hasta: '' }),
  certificaciones: () => ({ nombre: '', entidad: '', vencimiento: '' })
};
const form = reactive({
  nombre: '',
  correo: '',
  telefono: '',
  ciudad: '',
  formacion: [],
  experiencia: [],
  certificaciones: [],
  habilidades: '',
  idiomas: ''
});

// Cada fila conserva la confianza que reportó la IA; las filas que agrega RRHH no tienen.
const withRows = (items, levels = []) =>
  items.map((item, index) => ({ id: `fila-${(rowSequence += 1)}`, confianza: levels[index] || '', ...item }));
function add(section) {
  form[section].push({ id: `fila-${(rowSequence += 1)}`, confianza: '', ...rows[section]() });
}

const pending = (field) => analysis.value?.propuesta.camposPendientes.includes(field);
const confidence = (field) => analysis.value?.propuesta.confianza[field] || 'media';
const fieldClass = (field) => (pending(field) ? 'input-missing' : 'input-detected');
const rowClass = (item) => (item.confianza === 'baja' ? 'input-missing' : item.confianza ? 'input-detected' : '');
const pendingCount = computed(() => {
  const levels = analysis.value?.propuesta.confianza || {};
  const scalar = ['nombre', 'correo', 'telefono', 'ciudad', 'habilidades', 'idiomas'].filter(pending).length;
  const items = ['formacion', 'experiencia', 'certificaciones'].reduce(
    (sum, field) => sum + (levels[field] || []).filter((level) => level === 'baja').length,
    0
  );
  return scalar + items;
});

// Mismo cálculo que el servidor: une los periodos que se cruzan; "hasta" vacío es el mes actual.
const years = computed(() => {
  const toMonth = (value) =>
    /^\d{4}-\d{2}$/.test(value || '') ? Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7)) - 1 : null;
  const now = new Date();
  const current = now.getFullYear() * 12 + now.getMonth();
  const ranges = form.experiencia
    .map((item) => [toMonth(item.desde), item.hasta ? toMonth(item.hasta) : current])
    .filter(([start, end]) => start !== null && end !== null && end >= start)
    .sort((a, b) => a[0] - b[0]);
  let months = 0;
  let open = null;
  for (const [start, end] of ranges) {
    if (open && start <= open[1] + 1) open[1] = Math.max(open[1], end);
    else {
      if (open) months += open[1] - open[0] + 1;
      open = [start, end];
    }
  }
  if (open) months += open[1] - open[0] + 1;
  return Math.round((months / 12) * 10) / 10;
});

async function load() {
  try {
    candidate.value = await candidatosService.get(route.params.id);
    analysis.value = (candidate.value.analisis || []).find((item) => item.id === route.params.analisisId) || null;
    if (!analysis.value || analysis.value.estado !== 'pendiente') return;
    const { datos, confianza } = analysis.value.propuesta;
    Object.assign(form, {
      nombre: datos.nombre,
      correo: datos.correo,
      telefono: datos.telefono,
      ciudad: datos.ciudad,
      formacion: withRows(datos.formacion, confianza.formacion),
      experiencia: withRows(datos.experiencia, confianza.experiencia),
      certificaciones: withRows(datos.certificaciones, confianza.certificaciones),
      habilidades: datos.habilidades.join(', '),
      idiomas: datos.idiomas.join(', ')
    });
    document.value = candidate.value.documentos.find((item) => item.id === analysis.value.documentoId) || null;
    if (document.value?.tipo === 'application/pdf')
      previewUrl.value = await candidatosService.documentDataUrl(candidate.value.id, document.value);
  } catch (error) {
    toast.show(error.message, 'danger');
  } finally {
    loading.value = false;
  }
}

async function download() {
  try {
    await candidatosService.download(candidate.value.id, document.value);
  } catch (error) {
    toast.show(error.message, 'danger');
  }
}

async function submit() {
  if (!form.correo && !form.telefono)
    return toast.show('Indica al menos un correo o un teléfono de contacto.', 'danger');
  saving.value = true;
  try {
    const strip = (items) => items.map(({ id: _id, confianza: _confianza, ...item }) => item);
    const list = (text) =>
      text
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    const updated = await candidatosService.confirm(candidate.value.id, analysis.value.id, {
      nombre: form.nombre,
      correo: form.correo,
      telefono: form.telefono,
      ciudad: form.ciudad,
      formacion: strip(form.formacion).map((item) => ({ ...item, anio: item.anio || null })),
      experiencia: strip(form.experiencia),
      certificaciones: strip(form.certificaciones),
      habilidades: list(form.habilidades),
      idiomas: list(form.idiomas)
    });
    toast.show(`Los datos de ${updated.nombre} quedaron confirmados.`, 'success');
    router.push('/candidatos');
  } catch (error) {
    toast.show(error.message, 'danger');
  } finally {
    saving.value = false;
  }
}

function cancel() {
  router.push('/candidatos');
}

onMounted(load);
</script>

<style scoped>
/* Separa los grupos del formulario con el mismo espacio que las clases compartidas .form-row y .grid-2. */
.review-group {
  display: grid;
  gap: 16px;
}
</style>
