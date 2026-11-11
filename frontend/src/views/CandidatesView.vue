<template>
  <section class="card card-pad">
    <h2>Registrar candidatos</h2>
    <p>
      Sube las hojas de vida y elige la vacante a la que aplican. La IA propone los datos de cada candidato; tú los
      revisas y, al confirmar, queda registrado y evaluado en el ranking de esa vacante.
    </p>
    <p v-if="error" class="alert error" role="alert">{{ error }}</p>
    <form class="candidate-form" @submit.prevent="analyzeResumes">
      <div class="form-row">
        <div class="form-group">
          <label for="batch-vacancy">Vacante *</label
          ><select id="batch-vacancy" v-model="batch.vacanteId" required>
            <option value="" disabled>Selecciona una vacante abierta</option>
            <option v-for="item in openVacancies" :key="item.id" :value="item.id">{{ item.cargo }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="batch-files">Hojas de vida PDF o DOCX (máximo 10 MB cada una) *</label
          ><input
            id="batch-files"
            ref="batchInput"
            type="file"
            multiple
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required
            @change="batch.files = [...$event.target.files]"
          />
        </div>
      </div>
      <label class="consent-option">
        <input id="batch-consent" v-model="batch.autorizacionDatos" type="checkbox" /> Los candidatos autorizaron el
        tratamiento de sus datos personales según la Ley 1581 de 2012.
      </label>
      <div class="button-row">
        <button
          class="btn btn-primary"
          :disabled="analyzingBatch || !batch.vacanteId || !batch.files.length || !batch.autorizacionDatos"
        >
          {{ analyzingBatch ? 'Analizando…' : 'Analizar hojas de vida' }}
        </button>
      </div>
    </form>

    <div v-if="progress.length" class="table-wrapper mt-6">
      <table class="data-table">
        <thead>
          <tr>
            <th>Hoja de vida</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in progress" :key="item.id">
            <td>{{ item.archivo }}</td>
            <td>
              <span v-if="item.estado === 'error'" class="field-error">{{ item.mensaje }}</span>
              <span v-else>{{ item.mensaje }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template v-if="pending.length">
      <h3 class="mt-6">Pendientes de revisión ({{ pending.length }})</h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Hoja de vida</th>
              <th>Vacante</th>
              <th>Nombre propuesto</th>
              <th>Cargada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pending" :key="item.id">
              <td>{{ item.documentos[0]?.nombre }}</td>
              <td>{{ item.cargoInteres }}</td>
              <td>{{ pendingAnalysis(item)?.propuesta.datos.nombre || '—' }}</td>
              <td>{{ dateShort(item.createdAt) }}</td>
              <td>
                <div class="button-row">
                  <RouterLink
                    v-if="pendingAnalysis(item)"
                    class="btn btn-outline"
                    :to="`/candidatos/${item.id}/analisis/${pendingAnalysis(item).id}`"
                    >Revisar</RouterLink
                  >
                  <button class="btn btn-outline" type="button" @click="discarding = item">Descartar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <details class="manual-entry mt-6">
      <summary>Registrar manualmente (por ejemplo, una hoja de vida en DOC o si la IA no está disponible)</summary>
      <form class="candidate-form" @submit.prevent="save">
        <div class="form-row">
          <div class="form-group">
            <label for="candidate-id-type">Tipo de documento</label
            ><select id="candidate-id-type" v-model="form.tipoIdentificacion">
              <option v-for="item in idTypes" :key="item.id" :value="item.id">{{ item.nombre }}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="candidate-id">Número de identificación *</label
            ><input
              id="candidate-id"
              v-model.trim="form.identificacion"
              required
              minlength="4"
              maxlength="30"
              autocomplete="off"
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="candidate-name">Nombre completo *</label
            ><input id="candidate-name" v-model.trim="form.nombre" required minlength="3" maxlength="120" />
          </div>
          <div class="form-group">
            <label for="candidate-city">Ciudad</label
            ><input id="candidate-city" v-model.trim="form.ciudad" maxlength="120" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="candidate-email">Correo</label
            ><input id="candidate-email" v-model.trim="form.correo" type="email" maxlength="254" />
          </div>
          <div class="form-group">
            <label for="candidate-phone">Teléfono</label
            ><input id="candidate-phone" v-model.trim="form.telefono" type="tel" maxlength="20" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="candidate-position">Cargo de interés *</label
            ><input id="candidate-position" v-model.trim="form.cargoInteres" required minlength="2" maxlength="120" />
          </div>
          <div class="form-group">
            <label for="candidate-source">Fuente de postulación</label
            ><input
              id="candidate-source"
              v-model.trim="form.fuente"
              maxlength="80"
              placeholder="Referido, portal de empleo…"
            />
          </div>
        </div>

        <fieldset class="candidate-form">
          <legend>Formación académica</legend>
          <div v-for="(item, index) in form.formacion" :key="item.id" class="candidate-form">
            <div class="form-row">
              <div class="form-group">
                <label :for="`education-title-${index}`">Título *</label
                ><input :id="`education-title-${index}`" v-model.trim="item.titulo" required minlength="2" />
              </div>
              <div class="form-group">
                <label :for="`education-school-${index}`">Institución *</label
                ><input :id="`education-school-${index}`" v-model.trim="item.institucion" required minlength="2" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label :for="`education-level-${index}`">Nivel</label
                ><input
                  :id="`education-level-${index}`"
                  v-model.trim="item.nivel"
                  placeholder="Técnico, tecnólogo, profesional…"
                />
              </div>
              <div class="form-group">
                <label :for="`education-year-${index}`">Año de grado</label
                ><input
                  :id="`education-year-${index}`"
                  v-model.number="item.anio"
                  type="number"
                  min="1950"
                  :max="maxGraduationYear"
                />
              </div>
            </div>
            <div class="button-row">
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

        <fieldset class="candidate-form">
          <legend>Experiencia laboral</legend>
          <div v-for="(item, index) in form.experiencia" :key="item.id" class="candidate-form">
            <div class="form-row">
              <div class="form-group">
                <label :for="`experience-position-${index}`">Cargo *</label
                ><input :id="`experience-position-${index}`" v-model.trim="item.cargo" required minlength="2" />
              </div>
              <div class="form-group">
                <label :for="`experience-company-${index}`">Empresa *</label
                ><input :id="`experience-company-${index}`" v-model.trim="item.empresa" required minlength="2" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label :for="`experience-from-${index}`">Desde *</label
                ><input :id="`experience-from-${index}`" v-model="item.desde" type="month" required />
              </div>
              <div class="form-group">
                <label :for="`experience-to-${index}`">Hasta (vacío si trabaja allí)</label
                ><input :id="`experience-to-${index}`" v-model="item.hasta" type="month" :min="item.desde" />
              </div>
            </div>
            <div class="button-row">
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

        <fieldset class="candidate-form">
          <legend>Certificaciones</legend>
          <div v-for="(item, index) in form.certificaciones" :key="item.id" class="candidate-form">
            <div class="form-row">
              <div class="form-group">
                <label :for="`certification-name-${index}`">Certificación *</label
                ><input :id="`certification-name-${index}`" v-model.trim="item.nombre" required minlength="2" />
              </div>
              <div class="form-group">
                <label :for="`certification-entity-${index}`">Entidad</label
                ><input :id="`certification-entity-${index}`" v-model.trim="item.entidad" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label :for="`certification-expiry-${index}`">Vencimiento</label
                ><input :id="`certification-expiry-${index}`" v-model="item.vencimiento" type="date" />
              </div>
              <div class="button-row">
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
          </div>
          <div class="button-row">
            <button class="btn btn-outline" type="button" @click="add('certificaciones')">
              <i class="fas fa-plus" aria-hidden="true"></i>Agregar certificación
            </button>
          </div>
        </fieldset>

        <label class="consent-option">
          <input v-model="form.autorizacionDatos" type="checkbox" /> El candidato autoriza el tratamiento de sus datos
          personales según la Ley 1581 de 2012.
        </label>

        <div class="button-row">
          <button class="btn btn-primary" :disabled="saving">Registrar candidato</button>
        </div>
      </form>
    </details>

    <h3 class="mt-6">Candidatos registrados</h3>
    <div v-if="loading" class="loading-state"><span class="spinner spinner-primary"></span>Cargando candidatos…</div>
    <EmptyState
      v-else-if="!registered.length"
      icon="fa-id-card"
      title="No hay candidatos"
      message="Aún no se han registrado candidatos."
    />
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Identificación</th>
            <th>Cargo de interés</th>
            <th>Contacto</th>
            <th>Autorización de datos</th>
            <th>Registro</th>
            <th>Estado</th>
            <th>Documentos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in registered" :key="item.id">
            <td>{{ item.nombre }}</td>
            <td class="font-mono">{{ item.tipoIdentificacion }} {{ item.identificacion }}</td>
            <td>{{ item.cargoInteres }}</td>
            <td>{{ [item.correo, item.telefono].filter(Boolean).join(' · ') }}</td>
            <td>{{ item.autorizacionDatos?.otorgada ? 'Sí' : 'No' }}</td>
            <td>{{ dateShort(item.createdAt) }}</td>
            <td><StatusBadge :status="item.estado" /></td>
            <td>
              <button class="btn btn-outline" type="button" @click="openDocuments(item)">
                Documentos ({{ item.documentos?.length || 0 }})
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal :open="Boolean(selected)" :title="`Documentos de ${selected?.nombre || ''}`" @close="closeDocuments">
      <p v-if="documentError" class="alert error" role="alert">{{ documentError }}</p>
      <EmptyState
        v-if="!selected?.documentos?.length"
        icon="fa-file-lines"
        title="Sin documentos"
        message="Adjunta la hoja de vida o los soportes del candidato."
      />
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Tipo</th>
              <th>Tamaño</th>
              <th>Cargado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="document in selected.documentos" :key="document.id">
              <td>{{ document.nombre }}</td>
              <td>{{ documentTypes[document.tipoDocumento] }}</td>
              <td>{{ Math.max(1, Math.round(document.tamano / 1024)) }} KB</td>
              <td>{{ dateShort(document.cargadoEn) }} · {{ document.cargadoPor }}</td>
              <td>
                <div class="button-row">
                  <button class="btn btn-outline" type="button" @click="download(document)">Descargar</button>
                  <button
                    v-if="analyzable(document)"
                    class="btn btn-outline"
                    type="button"
                    :disabled="Boolean(analyzing) || !selected.autorizacionDatos?.otorgada"
                    :title="
                      selected.autorizacionDatos?.otorgada
                        ? 'La IA propone los datos y tú los revisas antes de guardarlos.'
                        : 'El candidato no autorizó el tratamiento de sus datos: no se puede enviar a la IA.'
                    "
                    @click="analyze(document)"
                  >
                    {{ analyzing === document.id ? 'Analizando…' : 'Analizar con IA' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <form class="candidate-form" @submit.prevent="attach">
        <div class="form-group">
          <label for="document-type">Tipo de documento</label
          ><select id="document-type" v-model="upload.tipoDocumento">
            <option v-for="(label, value) in documentTypes" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="document-file">Archivo PDF, DOC o DOCX (máximo 10 MB)</label
          ><input
            id="document-file"
            ref="fileInput"
            type="file"
            :accept="ACCEPTED_FILES"
            required
            @change="upload.file = $event.target.files[0] || null"
          />
        </div>
        <div class="button-row modal-actions">
          <button class="btn btn-primary" :disabled="uploading || !upload.file">Adjuntar documento</button>
          <button class="btn btn-outline" type="button" @click="closeDocuments">Cerrar</button>
        </div>
      </form>
    </BaseModal>

    <BaseModal :open="Boolean(discarding)" title="Descartar hoja de vida" @close="discarding = null">
      <p class="text-muted">
        Se eliminará la hoja de vida {{ discarding?.documentos[0]?.nombre }} y su análisis. Esta acción no se puede
        deshacer.
      </p>
      <div class="button-row modal-actions">
        <button class="btn btn-danger" type="button" :disabled="saving" @click="confirmDiscard">
          <i class="fas fa-trash" aria-hidden="true"></i>Descartar
        </button>
        <button class="btn btn-outline" type="button" @click="discarding = null">Cancelar</button>
      </div>
    </BaseModal>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseModal from '@/components/BaseModal.vue';
import EmptyState from '@/components/EmptyState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { idTypes } from '@/config/domain';
import { dateShort, fileToDataUrl } from '@/services/format';
import { candidatosService } from '@/services/candidatos.service';
import { vacantesService } from '@/services/vacantes.service';
import { useToastStore } from '@/stores/toast.store';

const toast = useToastStore();
const router = useRouter();
const candidates = ref([]);
// HU-34: los candidatos registrados desde su hoja de vida esperan la revisión de RRHH.
const PENDING = 'pendiente_revision';
const pending = computed(() => candidates.value.filter((item) => item.estado === PENDING));
const registered = computed(() => candidates.value.filter((item) => item.estado !== PENDING));
const pendingAnalysis = (candidate) => (candidate.analisis || []).findLast((item) => item.estado === 'pendiente');
const openVacancies = ref([]);
const batchInput = ref(null);
const batch = reactive({ vacanteId: '', files: [], autorizacionDatos: false });
const progress = ref([]);
const analyzingBatch = ref(false);
const discarding = ref(null);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const maxGraduationYear = new Date().getFullYear() + 6;
let rowSequence = 0;

const rows = {
  formacion: () => ({ titulo: '', institucion: '', nivel: '', anio: null }),
  experiencia: () => ({ cargo: '', empresa: '', desde: '', hasta: '' }),
  certificaciones: () => ({ nombre: '', entidad: '', vencimiento: '' })
};
const emptyForm = () => ({
  tipoIdentificacion: 'CC',
  identificacion: '',
  nombre: '',
  correo: '',
  telefono: '',
  ciudad: '',
  cargoInteres: '',
  fuente: '',
  formacion: [],
  experiencia: [],
  certificaciones: [],
  autorizacionDatos: false
});
const form = reactive(emptyForm());

function add(section) {
  form[section].push({ id: `fila-${(rowSequence += 1)}`, ...rows[section]() });
}

// Lo que la validación nativa del navegador no expresa: un dato de contacto y fechas en orden.
function validate() {
  if (!form.correo && !form.telefono) return 'Indica al menos un correo o un teléfono de contacto.';
  if (form.experiencia.some((item) => item.hasta && item.hasta < item.desde))
    return 'En la experiencia laboral, la fecha final no puede ser anterior a la inicial.';
  return '';
}

async function load() {
  try {
    const [candidateList, vacancyList] = await Promise.all([candidatosService.list(), vacantesService.list()]);
    candidates.value = candidateList.items;
    openVacancies.value = vacancyList.items.filter((item) => item.estado === 'abierta');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function save() {
  error.value = validate();
  if (error.value) return;
  saving.value = true;
  try {
    const strip = (items) => items.map(({ id: _id, ...item }) => item);
    const created = await candidatosService.create({
      ...form,
      formacion: strip(form.formacion).map((item) => ({ ...item, anio: item.anio || null })),
      experiencia: strip(form.experiencia),
      certificaciones: strip(form.certificaciones)
    });
    candidates.value.unshift(created);
    Object.assign(form, emptyForm());
    toast.show(`${created.nombre} quedó registrado como candidato.`, 'success');
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

// HU-14: documentos del candidato. El servidor vuelve a validar formato, contenido y tamaño.
const ACCEPTED_FILES =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
// El tipo sale de la extensión: algunos navegadores entregan los .doc con el tipo vacío.
const MIME_BY_EXTENSION = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};
const documentTypes = { hoja_de_vida: 'Hoja de vida', soporte: 'Soporte' };
const selected = ref(null);
const documentError = ref('');
const uploading = ref(false);
const fileInput = ref(null);
const upload = reactive({ tipoDocumento: 'hoja_de_vida', file: null });

function resetUpload() {
  Object.assign(upload, { tipoDocumento: 'hoja_de_vida', file: null });
  if (fileInput.value) fileInput.value.value = '';
}
function openDocuments(candidate) {
  selected.value = candidate;
  documentError.value = '';
  resetUpload();
}
function closeDocuments() {
  selected.value = null;
  documentError.value = '';
}

async function attach() {
  const file = upload.file;
  const tipo = MIME_BY_EXTENSION[(file?.name.split('.').pop() || '').toLowerCase()];
  documentError.value = !tipo
    ? 'Solo se aceptan archivos PDF, DOC o DOCX.'
    : file.size > MAX_FILE_BYTES
      ? 'El archivo supera el tamaño máximo de 10 MB.'
      : '';
  if (documentError.value) return;
  uploading.value = true;
  try {
    const document = await candidatosService.attach(selected.value.id, {
      nombre: file.name,
      tipo,
      tipoDocumento: upload.tipoDocumento,
      fileDataUrl: await fileToDataUrl(file)
    });
    selected.value.documentos = [...(selected.value.documentos || []), document];
    resetUpload();
    toast.show(`${document.nombre} quedó adjunto a ${selected.value.nombre}.`, 'success');
  } catch (err) {
    documentError.value = err.message;
  } finally {
    uploading.value = false;
  }
}

async function download(document) {
  documentError.value = '';
  try {
    await candidatosService.download(selected.value.id, document);
  } catch (err) {
    documentError.value = err.message;
  }
}

// HU-28: solo PDF y DOCX se analizan; un DOC se registra a mano.
const analyzable = (document) => document.tipo === MIME_BY_EXTENSION.pdf || document.tipo === MIME_BY_EXTENSION.docx;
const analyzing = ref('');
async function analyze(document) {
  documentError.value = '';
  analyzing.value = document.id;
  try {
    const analysis = await candidatosService.analyze(selected.value.id, document.id);
    router.push(`/candidatos/${selected.value.id}/analisis/${analysis.id}`);
  } catch (err) {
    // Si la IA falla, el documento y los datos del candidato quedan como estaban (CA5).
    documentError.value = err.message;
  } finally {
    analyzing.value = '';
  }
}

// HU-34: cada hoja de vida se analiza una tras otra; si una falla, las demás continúan (CA3).
async function analyzeResumes() {
  error.value = '';
  analyzingBatch.value = true;
  progress.value = batch.files.map((file, index) => ({
    id: `${index}-${file.name}`,
    archivo: file.name,
    estado: 'espera',
    mensaje: 'En espera'
  }));
  for (const [index, file] of batch.files.entries()) {
    const row = progress.value[index];
    const tipo = MIME_BY_EXTENSION[(file.name.split('.').pop() || '').toLowerCase()];
    if (!tipo || tipo === MIME_BY_EXTENSION.doc) {
      Object.assign(row, { estado: 'error', mensaje: 'Solo PDF o DOCX; un DOC se registra manualmente.' });
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      Object.assign(row, { estado: 'error', mensaje: 'El archivo supera el tamaño máximo de 10 MB.' });
      continue;
    }
    Object.assign(row, { estado: 'analizando', mensaje: 'Analizando…' });
    try {
      const { candidato, analisis } = await candidatosService.registerFromResume({
        vacanteId: batch.vacanteId,
        autorizacionDatos: batch.autorizacionDatos,
        nombre: file.name,
        tipo,
        fileDataUrl: await fileToDataUrl(file)
      });
      candidates.value.unshift(candidato);
      Object.assign(row, {
        estado: 'listo',
        mensaje: `Listo para revisar: ${analisis.propuesta.datos.nombre || 'sin nombre detectado'}`
      });
    } catch (err) {
      Object.assign(row, { estado: 'error', mensaje: err.message });
    }
  }
  const ready = progress.value.filter((item) => item.estado === 'listo').length;
  toast.show(
    `${ready} de ${progress.value.length} hoja(s) de vida quedaron pendientes de revisión.`,
    ready ? 'success' : 'danger'
  );
  Object.assign(batch, { files: [] });
  if (batchInput.value) batchInput.value.value = '';
  analyzingBatch.value = false;
}

async function confirmDiscard() {
  saving.value = true;
  try {
    await candidatosService.removePending(discarding.value.id);
    candidates.value = candidates.value.filter((item) => item.id !== discarding.value.id);
    toast.show('Hoja de vida descartada.', 'info');
  } catch (err) {
    error.value = err.message;
  } finally {
    discarding.value = null;
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
/* Separa los grupos del formulario con el mismo espacio que las clases compartidas .form-row y .grid-2. */
.candidate-form {
  display: grid;
  gap: 16px;
}
/* Casilla con su texto al lado, como .receipt-option en SettlementView (la única otra casilla). */
.consent-option {
  display: flex;
  align-items: center;
  gap: 12px;
}
.consent-option input {
  width: 20px;
  height: 20px;
  min-height: 20px;
  flex: 0 0 20px;
  margin: 0;
}
/* Mismo aspecto que el único desplegable con estilo propio (.ocr-adjust summary en styles.css). */
.manual-entry summary {
  color: var(--primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.manual-entry[open] summary {
  margin-bottom: 16px;
}
</style>
