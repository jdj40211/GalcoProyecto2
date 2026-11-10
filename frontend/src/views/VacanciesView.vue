<template>
  <section class="card card-pad">
    <h2>{{ editing ? `Editar vacante: ${editing.cargo}` : 'Crear vacante' }}</h2>
    <p>
      Define el perfil del cargo y cuánto pesa cada criterio. Los candidatos se evalúan contra estos criterios, iguales
      para todos.
    </p>
    <p v-if="error" class="alert error" role="alert">{{ error }}</p>
    <form class="vacancy-form" @submit.prevent="save">
      <div class="form-row">
        <div class="form-group">
          <label for="vacancy-position">Cargo *</label
          ><input id="vacancy-position" v-model.trim="form.cargo" required minlength="2" maxlength="120" />
        </div>
        <div class="form-group">
          <label for="vacancy-area">Área</label><input id="vacancy-area" v-model.trim="form.area" maxlength="120" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="vacancy-education">Formación mínima *</label
          ><select id="vacancy-education" v-model="form.formacionMinima" required>
            <option value="" disabled>Selecciona un nivel</option>
            <option v-for="level in formationLevels" :key="level" :value="level">{{ level }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="vacancy-years">Años mínimos de experiencia *</label
          ><input
            id="vacancy-years"
            v-model.number="form.experienciaMinima"
            type="number"
            min="0"
            max="40"
            step="0.5"
            required
          />
        </div>
      </div>
      <div class="form-group">
        <label for="vacancy-city">Ciudad</label><input id="vacancy-city" v-model.trim="form.ciudad" maxlength="120" />
      </div>
      <div class="form-group">
        <label for="vacancy-required-certs">Certificaciones obligatorias (separadas por comas)</label
        ><input id="vacancy-required-certs" v-model="form.certificacionesObligatorias" />
      </div>
      <div class="form-group">
        <label for="vacancy-desired-certs">Certificaciones deseables (separadas por comas)</label
        ><input id="vacancy-desired-certs" v-model="form.certificacionesDeseables" />
      </div>
      <div class="form-group">
        <label for="vacancy-skills">Habilidades requeridas (separadas por comas)</label
        ><input id="vacancy-skills" v-model="form.habilidades" />
      </div>

      <fieldset class="vacancy-form">
        <legend>Peso de cada criterio · Total: {{ totalWeight }} / 100</legend>
        <div class="form-row">
          <div v-for="criterion in vacancyCriteria" :key="criterion.id" class="form-group">
            <label :for="`vacancy-weight-${criterion.id}`">{{ criterion.nombre }} (%)</label
            ><input
              :id="`vacancy-weight-${criterion.id}`"
              v-model.number="form.pesos[criterion.id]"
              type="number"
              min="0"
              max="100"
              step="1"
              required
            />
          </div>
        </div>
      </fieldset>

      <div class="button-row">
        <button class="btn btn-primary" :disabled="saving">{{ editing ? 'Guardar cambios' : 'Crear vacante' }}</button>
        <button v-if="editing" class="btn btn-outline" type="button" @click="cancelEdit">Cancelar edición</button>
      </div>
    </form>

    <h3>Vacantes</h3>
    <div v-if="loading" class="loading-state"><span class="spinner spinner-primary"></span>Cargando vacantes…</div>
    <EmptyState
      v-else-if="!vacancies.length"
      icon="fa-briefcase"
      title="No hay vacantes"
      message="Crea la primera vacante para evaluar candidatos frente a su perfil."
    />
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Cargo</th>
            <th>Formación mínima</th>
            <th>Experiencia mínima</th>
            <th>Pesos</th>
            <th>Versión</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in vacancies" :key="item.id">
            <td>{{ item.cargo }}{{ item.area ? ` · ${item.area}` : '' }}</td>
            <td>{{ item.formacionMinima }}</td>
            <td>{{ item.experienciaMinima }} años</td>
            <td>
              {{ vacancyCriteria.map((criterion) => `${criterion.nombre} ${item.pesos[criterion.id]}%`).join(' · ') }}
            </td>
            <td>v{{ item.version }}</td>
            <td><StatusBadge :status="item.estado" /></td>
            <td>
              <div class="button-row">
                <RouterLink class="btn btn-outline" :to="`/vacantes/${item.id}/ranking`">Ranking</RouterLink>
                <template v-if="item.estado === 'abierta'">
                  <button class="btn btn-outline" type="button" @click="startEdit(item)">Editar</button>
                  <button class="btn btn-outline" type="button" @click="closing = item">Cerrar</button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal :open="Boolean(closing)" title="Cerrar vacante" @close="closing = null">
      <p class="text-muted">
        La vacante {{ closing?.cargo }} seguirá disponible para consulta, pero no admitirá nuevas evaluaciones ni
        cambios. Esta acción no se puede deshacer.
      </p>
      <div class="button-row modal-actions">
        <button class="btn btn-danger" type="button" :disabled="saving" @click="confirmClose">
          <i class="fas fa-lock" aria-hidden="true"></i>Cerrar vacante
        </button>
        <button class="btn btn-outline" type="button" @click="closing = null">Cancelar</button>
      </div>
    </BaseModal>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import BaseModal from '@/components/BaseModal.vue';
import EmptyState from '@/components/EmptyState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { formationLevels, vacancyCriteria } from '@/config/domain';
import { vacantesService } from '@/services/vacantes.service';
import { useToastStore } from '@/stores/toast.store';

const toast = useToastStore();
const vacancies = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const editing = ref(null);
const closing = ref(null);

const emptyForm = () => ({
  cargo: '',
  area: '',
  ciudad: '',
  formacionMinima: '',
  experienciaMinima: null,
  certificacionesObligatorias: '',
  certificacionesDeseables: '',
  habilidades: '',
  pesos: { formacion: 25, experiencia: 25, certificaciones: 25, habilidades: 25 }
});
const form = reactive(emptyForm());
const totalWeight = computed(() =>
  vacancyCriteria.reduce((sum, criterion) => sum + (Number(form.pesos[criterion.id]) || 0), 0)
);
const toList = (text) =>
  text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

async function load() {
  try {
    vacancies.value = (await vacantesService.list()).items;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function startEdit(vacancy) {
  editing.value = vacancy;
  error.value = '';
  Object.assign(form, {
    cargo: vacancy.cargo,
    area: vacancy.area,
    ciudad: vacancy.ciudad,
    formacionMinima: vacancy.formacionMinima,
    experienciaMinima: vacancy.experienciaMinima,
    certificacionesObligatorias: vacancy.certificacionesObligatorias.join(', '),
    certificacionesDeseables: vacancy.certificacionesDeseables.join(', '),
    habilidades: vacancy.habilidades.join(', '),
    pesos: { ...vacancy.pesos }
  });
}
function cancelEdit() {
  editing.value = null;
  error.value = '';
  Object.assign(form, emptyForm());
}

async function save() {
  // Mismo mensaje que el servidor: los pesos suman 100 o se indica la diferencia.
  const difference = 100 - totalWeight.value;
  error.value = difference
    ? `Los pesos de los criterios suman ${totalWeight.value}: ${difference > 0 ? 'faltan' : 'sobran'} ${Math.abs(difference)} puntos para llegar a 100.`
    : '';
  if (error.value) return;
  saving.value = true;
  try {
    const payload = {
      ...form,
      certificacionesObligatorias: toList(form.certificacionesObligatorias),
      certificacionesDeseables: toList(form.certificacionesDeseables),
      habilidades: toList(form.habilidades)
    };
    if (editing.value) {
      const updated = await vacantesService.update(editing.value.id, payload);
      vacancies.value = vacancies.value.map((item) => (item.id === updated.id ? updated : item));
      toast.show(`La vacante ${updated.cargo} quedó en la versión ${updated.version}.`, 'success');
    } else {
      const created = await vacantesService.create(payload);
      vacancies.value.unshift(created);
      toast.show(`La vacante ${created.cargo} quedó abierta.`, 'success');
    }
    editing.value = null;
    Object.assign(form, emptyForm());
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function confirmClose() {
  saving.value = true;
  try {
    const closed = await vacantesService.close(closing.value.id);
    vacancies.value = vacancies.value.map((item) => (item.id === closed.id ? closed : item));
    if (editing.value?.id === closed.id) cancelEdit();
    toast.show(`La vacante ${closed.cargo} quedó cerrada.`, 'info');
    closing.value = null;
  } catch (err) {
    error.value = err.message;
    closing.value = null;
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
/* Separa los grupos del formulario con el mismo espacio que las clases compartidas .form-row y .grid-2. */
.vacancy-form {
  display: grid;
  gap: 16px;
}
</style>
