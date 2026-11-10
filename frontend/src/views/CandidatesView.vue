<template>
  <section class="card card-pad">
    <h2>Registrar candidato</h2>
    <p>Registra los datos principales del candidato. Queda en estado Registrado y con su autorización de datos.</p>
    <p v-if="error" class="alert error" role="alert">{{ error }}</p>
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

    <h3>Candidatos registrados</h3>
    <div v-if="loading" class="loading-state"><span class="spinner spinner-primary"></span>Cargando candidatos…</div>
    <EmptyState
      v-else-if="!candidates.length"
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
          <tr v-for="item in candidates" :key="item.id">
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
                <button class="btn btn-outline" type="button" @click="download(document)">Descargar</button>
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
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import BaseModal from '@/components/BaseModal.vue';
import EmptyState from '@/components/EmptyState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { idTypes } from '@/config/domain';
import { dateShort, fileToDataUrl } from '@/services/format';
import { candidatosService } from '@/services/candidatos.service';
import { useToastStore } from '@/stores/toast.store';

const toast = useToastStore();
const candidates = ref([]);
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
    candidates.value = (await candidatosService.list()).items;
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
</style>
