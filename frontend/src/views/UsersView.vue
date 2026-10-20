<template>
  <section class="card card-pad">
    <h2>Administrar usuarios</h2>
    <p>Las cuentas nuevas tienen acceso únicamente al módulo de su rol.</p>
    <p v-if="error" class="alert error" role="alert">{{ error }}</p>
    <form @submit.prevent="create">
      <div class="form-group">
        <label for="user-name">Nombre</label><input id="user-name" v-model.trim="form.nombre" required minlength="2" />
      </div>
      <div class="form-group">
        <label for="user-email">Correo</label><input id="user-email" v-model.trim="form.email" type="email" required />
      </div>
      <div class="form-group">
        <label for="user-password">Contraseña inicial (mínimo 12 caracteres)</label
        ><input
          id="user-password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          minlength="12"
          required
        />
      </div>
      <div class="form-group">
        <label for="user-role">Rol</label
        ><select id="user-role" v-model="form.rol">
          <option value="comercial">Comercial / solicitante</option>
          <option value="contabilidad">Contabilidad / aprobador</option>
          <option value="admin">Administración</option>
        </select>
      </div>
      <button class="btn btn-primary" :disabled="busy">Crear usuario</button>
    </form>
    <h3>Usuarios registrados</h3>
    <p v-if="loading">Cargando…</p>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.uid">
            <td>{{ user.nombre }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.rol }}</td>
            <td>{{ user.activo ? 'Activo' : 'Inactivo' }}</td>
            <td>
              <button class="btn btn-outline" :disabled="busy || user.uid === auth.user.uid" @click="toggle(user)">
                {{ user.activo ? 'Desactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue';
import http from '@/services/http';
import { useAuthStore } from '@/stores/auth.store';
const auth = useAuthStore(),
  users = ref([]),
  busy = ref(false),
  loading = ref(true),
  error = ref('');
const form = reactive({ nombre: '', email: '', password: '', rol: 'comercial' });
async function load() {
  try {
    users.value = (await http.get('/usuarios')).data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
async function create() {
  busy.value = true;
  error.value = '';
  try {
    await http.post('/usuarios', { ...form });
    Object.assign(form, { nombre: '', email: '', password: '', rol: 'comercial' });
    await load();
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
async function toggle(user) {
  busy.value = true;
  error.value = '';
  try {
    await http.patch(`/usuarios/${user.uid}/activo`, { activo: !user.activo });
    await load();
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
onMounted(load);
</script>
