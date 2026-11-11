<template>
  <section class="card">
    <div class="card-header">
      <h2>Ranking: {{ vacancy?.cargo || 'vacante' }}</h2>
      <p>
        Puntaje de 0 a 100 según los criterios de la vacante. Es un apoyo para priorizar: la decisión y la etapa de cada
        candidato las define Recursos Humanos.
      </p>
    </div>
    <div class="filters-bar">
      <div class="form-group compact">
        <label for="ranking-candidate">Candidato</label>
        <select id="ranking-candidate" v-model="candidateId" :disabled="closed">
          <option value="">Selecciona un candidato</option>
          <option v-for="item in candidates" :key="item.id" :value="item.id">
            {{ item.nombre }} · {{ item.cargoInteres }}
          </option>
        </select>
      </div>
      <button
        class="btn btn-primary"
        type="button"
        :disabled="closed || !candidateId || evaluating"
        @click="evaluate()"
      >
        <span v-if="evaluating" class="spinner"></span><i v-else class="fas fa-scale-balanced" aria-hidden="true"></i
        >{{ evaluating ? 'Evaluando…' : 'Evaluar' }}
      </button>
      <div class="form-group compact">
        <label for="ranking-filter">Requisitos obligatorios</label>
        <select id="ranking-filter" v-model="onlyCompliant" @change="loadRanking">
          <option :value="false">Todos</option>
          <option :value="true">Solo quienes los cumplen</option>
        </select>
      </div>
    </div>
    <p v-if="closed" class="alert">
      Esta vacante está cerrada: se puede consultar, pero no admite nuevas evaluaciones.
    </p>

    <div v-if="loading" class="loading-state"><span class="spinner spinner-primary"></span>Cargando ranking…</div>
    <EmptyState
      v-else-if="!rows.length"
      icon="fa-ranking-star"
      title="Sin candidatos evaluados"
      :message="
        onlyCompliant
          ? 'Ningún candidato evaluado cumple todos los requisitos obligatorios.'
          : 'Evalúa candidatos para verlos ordenados por su ajuste a la vacante.'
      "
    />
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Candidato</th>
            <th>Puntaje</th>
            <th>Requisitos obligatorios</th>
            <th>Evaluada</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="row.candidato.id">
            <td>{{ index + 1 }}</td>
            <td>
              {{ row.candidato.nombre }}
              <span v-if="row.evaluacion.habilidadesPendientes" class="text-muted text-sm"
                >· Habilidades pendientes</span
              >
            </td>
            <td class="font-mono">{{ row.evaluacion.puntaje }} / 100</td>
            <td>
              <span v-if="row.evaluacion.cumpleObligatorios">Cumple</span>
              <strong v-else class="field-error"
                >No cumple ({{ row.evaluacion.obligatoriosIncumplidos.length }})</strong
              >
            </td>
            <td>{{ dateShort(row.evaluacion.fecha) }} · v{{ row.evaluacion.vacanteVersion }}</td>
            <td>
              <button class="btn btn-outline" type="button" @click="selected = row">Ver detalle</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <footer class="table-footer">
      <span>{{ rows.length }} candidato(s)</span>
    </footer>

    <BaseModal
      :open="Boolean(selected)"
      :title="`Evaluación de ${selected?.candidato.nombre || ''}`"
      @close="selected = null"
    >
      <template v-if="selected">
        <p>
          <strong class="font-mono">{{ selected.evaluacion.puntaje }} / 100</strong> · versión
          {{ selected.evaluacion.vacanteVersion }} de la vacante · {{ dateShort(selected.evaluacion.fecha) }}
          <span v-if="selected.anteriores"> · {{ selected.anteriores }} evaluación(es) anterior(es)</span>
        </p>
        <div v-if="selected.evaluacion.obligatoriosIncumplidos.length" class="alert error" role="alert">
          <div>
            <strong>Requisitos obligatorios no cumplidos</strong>
            <ul>
              <li v-for="item in selected.evaluacion.obligatoriosIncumplidos" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
        <p v-if="selected.evaluacion.aviso" class="alert">{{ selected.evaluacion.aviso }}</p>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Criterio</th>
                <th>Peso</th>
                <th>Cumplimiento</th>
                <th>Aporte</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="criterion in vacancyCriteria" :key="criterion.id">
                <td>{{ criterion.nombre }}</td>
                <td>{{ selected.evaluacion.criterios[criterion.id].peso }}%</td>
                <td>{{ Math.round(selected.evaluacion.criterios[criterion.id].cumplimiento * 100) }}%</td>
                <td class="font-mono">{{ selected.evaluacion.criterios[criterion.id].aporte }}</td>
                <td>{{ selected.evaluacion.criterios[criterion.id].detalle }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h3>Habilidades</h3>
        <ul>
          <li v-for="item in selected.evaluacion.criterios.habilidades.habilidades" :key="item.habilidad">
            <strong>{{ item.habilidad }}:</strong> {{ skillLabels[item.cumple] }}
            <span v-if="item.evidencia" class="text-muted"> — {{ item.evidencia }}</span>
          </li>
        </ul>
        <h3>Justificación</h3>
        <p>{{ selected.evaluacion.justificacion }}</p>
        <div class="button-row modal-actions">
          <button
            class="btn btn-outline"
            type="button"
            :disabled="closed || evaluating"
            @click="evaluate(selected.candidato.id)"
          >
            Volver a evaluar
          </button>
          <button class="btn btn-outline" type="button" @click="selected = null">Cerrar</button>
        </div>
      </template>
    </BaseModal>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import BaseModal from '@/components/BaseModal.vue';
import EmptyState from '@/components/EmptyState.vue';
import { vacancyCriteria } from '@/config/domain';
import { dateShort } from '@/services/format';
import { candidatosService } from '@/services/candidatos.service';
import { vacantesService } from '@/services/vacantes.service';
import { useToastStore } from '@/stores/toast.store';

const route = useRoute();
const toast = useToastStore();
const vacancy = ref(null);
const candidates = ref([]);
const rows = ref([]);
const loading = ref(true);
const evaluating = ref(false);
const candidateId = ref('');
const onlyCompliant = ref(false);
const selected = ref(null);
const closed = computed(() => vacancy.value?.estado === 'cerrada');
const skillLabels = { si: 'sí la demuestra', parcial: 'parcialmente', no: 'no aparece', null: 'pendiente' };

async function loadRanking() {
  try {
    rows.value = (await vacantesService.ranking(route.params.id, onlyCompliant.value)).items;
  } catch (error) {
    toast.show(error.message, 'danger');
  }
}

async function load() {
  try {
    [vacancy.value, candidates.value] = await Promise.all([
      vacantesService.get(route.params.id),
      // HU-34: los pendientes de revisión aún no tienen datos confirmados y no se pueden evaluar.
      candidatosService.list().then((result) => result.items.filter((item) => item.estado !== 'pendiente_revision'))
    ]);
    await loadRanking();
  } catch (error) {
    toast.show(error.message, 'danger');
  } finally {
    loading.value = false;
  }
}

// Evaluar o volver a evaluar: la evaluación anterior se conserva y la nueva queda vigente.
async function evaluate(id = candidateId.value) {
  evaluating.value = true;
  try {
    const evaluation = await vacantesService.evaluate(route.params.id, id);
    await loadRanking();
    const row = rows.value.find((item) => item.candidato.id === id);
    if (selected.value) selected.value = row || null;
    candidateId.value = '';
    toast.show(
      evaluation.habilidadesPendientes
        ? `Evaluación con ${evaluation.puntaje} / 100; la valoración de habilidades quedó pendiente.`
        : `Evaluación con ${evaluation.puntaje} / 100.`,
      evaluation.habilidadesPendientes ? 'info' : 'success'
    );
  } catch (error) {
    toast.show(error.message, 'danger');
  } finally {
    evaluating.value = false;
  }
}

onMounted(load);
</script>
