<template>
  <div class="requests-page">
    <section v-if="!auth.isAccounting" class="card request-form-card">
      <div class="card-header">
        <div>
          <div class="eyebrow">Sprint 1 · HU-20 y HU-21</div>
          <h2>Nueva solicitud de viáticos</h2>
          <p>Registra el viaje y sus gastos estimados. La solicitud se guardará inicialmente como borrador.</p>
        </div>
      </div>

      <form class="request-form" novalidate @submit.prevent="save">
        <div class="form-row">
          <div class="form-group">
            <label for="request-destination">Destino *</label>
            <input
              id="request-destination"
              v-model.trim="form.destino"
              autocomplete="off"
              :aria-invalid="Boolean(errors.destino)"
            />
            <small v-if="errors.destino" class="field-error">{{ errors.destino }}</small>
          </div>
          <div class="form-group">
            <label for="request-cost-center">Centro de costo *</label>
            <input
              id="request-cost-center"
              v-model.trim="form.centroCosto"
              placeholder="Ej. COM-001"
              autocomplete="off"
              :aria-invalid="Boolean(errors.centroCosto)"
            />
            <small v-if="errors.centroCosto" class="field-error">{{ errors.centroCosto }}</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="request-start">Fecha inicial *</label>
            <input id="request-start" v-model="form.fechaInicio" type="date" :aria-invalid="Boolean(errors.fechas)" />
          </div>
          <div class="form-group">
            <label for="request-end">Fecha final *</label>
            <input
              id="request-end"
              v-model="form.fechaFin"
              type="date"
              :min="form.fechaInicio"
              :aria-invalid="Boolean(errors.fechas)"
            />
          </div>
        </div>
        <small v-if="errors.fechas" class="field-error date-error">{{ errors.fechas }}</small>

        <div class="form-group">
          <label for="request-reason">Motivo del viaje *</label>
          <textarea
            id="request-reason"
            v-model.trim="form.motivo"
            rows="3"
            :aria-invalid="Boolean(errors.motivo)"
          ></textarea>
          <small v-if="errors.motivo" class="field-error">{{ errors.motivo }}</small>
        </div>

        <div class="expenses-heading">
          <div>
            <h3>Gastos estimados</h3>
            <p>Moneda predeterminada: COP</p>
          </div>
          <button class="btn btn-outline" type="button" @click="addExpense">
            <i class="fas fa-plus" aria-hidden="true"></i>Agregar gasto
          </button>
        </div>

        <div class="expense-list">
          <div v-for="(expense, index) in form.gastos" :key="expense.id" class="expense-row">
            <div class="form-group">
              <label :for="`expense-category-${index}`">Categoría *</label>
              <select :id="`expense-category-${index}`" v-model="expense.categoria">
                <option v-for="item in expenseTypes" :key="item.id" :value="item.id">{{ item.nombre }}</option>
              </select>
            </div>
            <div class="form-group expense-description">
              <label :for="`expense-description-${index}`">Descripción *</label>
              <input
                :id="`expense-description-${index}`"
                v-model.trim="expense.descripcion"
                placeholder="Concepto estimado"
              />
            </div>
            <div class="form-group">
              <label :for="`expense-value-${index}`">Valor *</label>
              <input
                :id="`expense-value-${index}`"
                v-model.number="expense.valor"
                type="number"
                min="1"
                step="1000"
                inputmode="numeric"
              />
            </div>
            <button
              class="icon-btn expense-remove"
              type="button"
              :disabled="form.gastos.length === 1"
              :aria-label="`Eliminar gasto ${index + 1}`"
              @click="removeExpense(index)"
            >
              <i class="fas fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <small v-if="errors.gastos" class="field-error">{{ errors.gastos }}</small>

        <div class="request-summary">
          <span>Total solicitado</span>
          <strong>{{ formatCurrency(total) }}</strong>
        </div>

        <div class="button-row request-actions">
          <button class="btn btn-primary btn-lg" :disabled="saving" type="submit">
            <span v-if="saving" class="spinner"></span><i v-else class="fas fa-floppy-disk" aria-hidden="true"></i>
            {{ saving ? 'Guardando…' : 'Guardar borrador' }}
          </button>
          <button class="btn btn-outline btn-lg" type="button" @click="resetForm">Limpiar</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="card-header list-heading">
        <div>
          <h2>{{ auth.isAccounting ? 'Solicitudes por aprobar' : 'Mis solicitudes' }}</h2>
          <p>
            {{
              auth.isAccounting
                ? 'Consulta y decide las solicitudes enviadas por los empleados.'
                : 'Envía los borradores completos y consulta su estado.'
            }}
          </p>
        </div>
        <button class="btn btn-outline" type="button" :disabled="loading" @click="load">
          <i class="fas fa-rotate" aria-hidden="true"></i>Actualizar
        </button>
      </div>

      <div v-if="loading" class="loading-state"><span class="spinner spinner-primary"></span>Cargando solicitudes…</div>
      <EmptyState
        v-else-if="!requests.length"
        icon="fa-route"
        title="No hay solicitudes"
        message="Aún no existen solicitudes de viáticos para mostrar."
      />
      <div v-else class="table-wrapper">
        <table class="data-table requests-table">
          <caption class="visually-hidden">
            Solicitudes de viáticos
          </caption>
          <thead>
            <tr>
              <th>Consecutivo</th>
              <th>Viaje</th>
              <th>Solicitante</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in requests" :key="item.id">
              <td>
                <strong class="font-mono">{{ item.consecutivo }}</strong>
              </td>
              <td>
                <strong>{{ item.destino }}</strong
                ><small>{{ item.fechaInicio }} a {{ item.fechaFin }}</small>
              </td>
              <td>{{ item.solicitante }}</td>
              <td class="font-mono">{{ formatCurrency(item.totalSolicitado) }}</td>
              <td><StatusBadge :status="item.estado" /></td>
              <td>
                <div class="table-actions">
                  <button
                    v-if="!auth.isAccounting && item.estado === 'borrador'"
                    class="icon-btn approve"
                    type="button"
                    aria-label="Enviar a aprobación"
                    title="Enviar a aprobación"
                    @click="send(item)"
                  >
                    <i class="fas fa-paper-plane" aria-hidden="true"></i>
                  </button>
                  <button
                    v-if="!auth.isAccounting && item.estado === 'borrador'"
                    class="icon-btn reject"
                    type="button"
                    aria-label="Eliminar borrador"
                    title="Eliminar borrador"
                    @click="remove(item)"
                  >
                    <i class="fas fa-trash" aria-hidden="true"></i>
                  </button>
                  <button
                    v-if="auth.isAccounting && item.estado === 'enviada'"
                    class="icon-btn approve"
                    type="button"
                    aria-label="Aprobar solicitud"
                    title="Aprobar solicitud"
                    @click="approve(item)"
                  >
                    <i class="fas fa-check" aria-hidden="true"></i>
                  </button>
                  <button
                    v-if="auth.isAccounting && item.estado === 'enviada'"
                    class="icon-btn reject"
                    type="button"
                    aria-label="Rechazar solicitud"
                    title="Rechazar solicitud"
                    @click="openReject(item)"
                  >
                    <i class="fas fa-ban" aria-hidden="true"></i>
                  </button>
                  <span v-if="item.estado !== 'borrador' && item.estado !== 'enviada'" class="text-muted text-sm"
                    >Sin acciones</span
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <BaseModal :open="Boolean(rejecting)" title="Rechazar solicitud" @close="closeReject">
      <p class="text-muted">Indica una razón clara para que el solicitante pueda corregir o continuar.</p>
      <div class="form-group">
        <label for="request-reject-reason">Motivo *</label>
        <textarea id="request-reject-reason" v-model.trim="rejectReason" rows="4"></textarea>
      </div>
      <div class="button-row modal-actions">
        <button class="btn btn-danger" type="button" @click="confirmReject">
          <i class="fas fa-ban" aria-hidden="true"></i>Confirmar rechazo
        </button>
        <button class="btn btn-outline" type="button" @click="closeReject">Cancelar</button>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import BaseModal from '@/components/BaseModal.vue';
import EmptyState from '@/components/EmptyState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { expenseTypes } from '@/config/domain';
import { formatCurrency } from '@/services/format';
import { solicitudesService } from '@/services/solicitudes.service';
import { useAuthStore } from '@/stores/auth.store';
import { useToastStore } from '@/stores/toast.store';

const auth = useAuthStore();
const toast = useToastStore();
const requests = ref([]);
const loading = ref(false);
const saving = ref(false);
const rejecting = ref(null);
const rejectReason = ref('');
const errors = reactive({});
let expenseSequence = 0;

const newExpense = () => ({
  id: `gasto-${Date.now()}-${(expenseSequence += 1)}`,
  categoria: 'transporte',
  descripcion: '',
  valor: null
});
const emptyForm = () => ({
  destino: '',
  fechaInicio: '',
  fechaFin: '',
  motivo: '',
  centroCosto: '',
  moneda: 'COP',
  gastos: [newExpense()]
});
const form = reactive(emptyForm());
const total = computed(() => form.gastos.reduce((sum, item) => sum + (Number(item.valor) || 0), 0));

function addExpense() {
  form.gastos.push(newExpense());
}
function removeExpense(index) {
  if (form.gastos.length > 1) form.gastos.splice(index, 1);
}
function resetForm() {
  Object.assign(form, emptyForm());
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function validate() {
  Object.keys(errors).forEach((key) => delete errors[key]);
  if (!form.destino) errors.destino = 'El destino es obligatorio.';
  if (!form.centroCosto) errors.centroCosto = 'El centro de costo es obligatorio.';
  if (!form.fechaInicio || !form.fechaFin) errors.fechas = 'Completa ambas fechas.';
  else if (form.fechaFin < form.fechaInicio) errors.fechas = 'La fecha final no puede ser anterior a la fecha inicial.';
  if (!form.motivo || form.motivo.length < 5) errors.motivo = 'Describe brevemente el motivo del viaje.';
  if (form.gastos.some((item) => !item.descripcion || Number(item.valor) <= 0))
    errors.gastos = 'Cada gasto necesita descripción y un valor mayor a cero.';
  return Object.keys(errors).length === 0;
}

async function load() {
  loading.value = true;
  try {
    requests.value = (await solicitudesService.list()).items;
  } catch (error) {
    toast.show(error.message, 'danger');
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!validate()) return toast.show('Revisa los campos marcados.', 'danger');
  saving.value = true;
  try {
    const created = await solicitudesService.create({
      ...form,
      gastos: form.gastos.map((item) => ({ ...item, valor: Number(item.valor) }))
    });
    requests.value.unshift(created);
    resetForm();
    toast.show(`Solicitud ${created.consecutivo} guardada como borrador.`, 'success');
  } catch (error) {
    toast.show(error.message, 'danger');
  } finally {
    saving.value = false;
  }
}

async function send(item) {
  try {
    await solicitudesService.send(item.id);
    await load();
    toast.show(`${item.consecutivo} enviada a aprobación.`, 'success');
  } catch (error) {
    toast.show(error.message, 'danger');
  }
}
async function remove(item) {
  try {
    await solicitudesService.remove(item.id);
    await load();
    toast.show('Borrador eliminado.', 'info');
  } catch (error) {
    toast.show(error.message, 'danger');
  }
}
async function approve(item) {
  try {
    await solicitudesService.approve(item.id);
    await load();
    toast.show(`${item.consecutivo} aprobada.`, 'success');
  } catch (error) {
    toast.show(error.message, 'danger');
  }
}
function openReject(item) {
  rejecting.value = item;
  rejectReason.value = '';
}
function closeReject() {
  rejecting.value = null;
  rejectReason.value = '';
}
async function confirmReject() {
  if (rejectReason.value.length < 3) return toast.show('Escribe un motivo de rechazo.', 'danger');
  try {
    await solicitudesService.reject(rejecting.value.id, rejectReason.value);
    closeReject();
    await load();
    toast.show('Solicitud rechazada.', 'info');
  } catch (error) {
    toast.show(error.message, 'danger');
  }
}

onMounted(load);
</script>

<style scoped>
.requests-page {
  display: grid;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto;
}
.request-form {
  display: grid;
  gap: 18px;
}
.expenses-heading,
.list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.expenses-heading h3 {
  margin: 0;
  color: var(--primary);
  font-size: 16px;
}
.expenses-heading p {
  margin: 2px 0 0;
  color: var(--text-light);
  font-size: 12px;
}
.expense-list {
  display: grid;
  gap: 12px;
}
.expense-row {
  display: grid;
  grid-template-columns: minmax(150px, 0.8fr) minmax(220px, 1.6fr) minmax(150px, 0.7fr) 44px;
  align-items: end;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--secondary);
}
.expense-remove {
  margin-bottom: 3px;
}
.request-summary {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  padding: 18px;
  border-radius: 12px;
  background: var(--primary);
  color: #fff;
}
.request-summary strong {
  font: 700 24px/1 var(--font-num);
}
.request-actions {
  justify-content: flex-end;
}
.requests-table td small {
  display: block;
  margin-top: 3px;
  color: var(--text-light);
}
.date-error {
  margin-top: -12px;
}
@media (max-width: 980px) {
  .expense-row {
    grid-template-columns: 1fr 1fr;
  }
  .expense-remove {
    align-self: end;
  }
}
@media (max-width: 620px) {
  .expenses-heading,
  .list-heading {
    align-items: stretch;
    flex-direction: column;
  }
  .expenses-heading .btn,
  .list-heading .btn {
    width: 100%;
  }
  .expense-row {
    grid-template-columns: 1fr;
  }
  .expense-remove {
    width: 100%;
  }
  .request-summary {
    justify-content: space-between;
  }
  .request-summary strong {
    font-size: 18px;
  }
}
</style>
