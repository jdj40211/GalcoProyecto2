<template>
  <div class="filters-bar">
    <div class="form-group compact">
      <label :for="`${id}-from`">Desde</label>
      <input :id="`${id}-from`" :value="model.desde" type="date" @input="update('desde', $event.target.value)" />
    </div>
    <div class="form-group compact">
      <label :for="`${id}-to`">Hasta</label>
      <input :id="`${id}-to`" :value="model.hasta" type="date" @input="update('hasta', $event.target.value)" />
    </div>
    <div class="form-group compact">
      <label :for="`${id}-status`">Estado</label>
      <select :id="`${id}-status`" :value="model.estado" @change="update('estado', $event.target.value)">
        <option value="todos">Todos</option>
        <option v-for="(value, key) in statuses" :key="key" :value="key">{{ value.label }}</option>
      </select>
    </div>
    <div v-if="showUser" class="form-group compact">
      <label :for="`${id}-user`">Usuario</label>
      <select :id="`${id}-user`" :value="model.usuario" @change="update('usuario', $event.target.value)">
        <option value="todos">Todos</option>
        <option v-for="user in users" :key="user" :value="user">{{ user }}</option>
      </select>
    </div>
    <div v-if="showType" class="form-group compact">
      <label :for="`${id}-type`">Tipo de gasto</label>
      <select :id="`${id}-type`" :value="model.tipoGasto" @change="update('tipoGasto', $event.target.value)">
        <option value="todos">Todos</option>
        <option v-for="type in expenseTypes" :key="type.id" :value="type.id">{{ type.nombre }}</option>
      </select>
    </div>
    <button class="btn btn-outline" type="button" @click="$emit('clear')">
      <i class="fas fa-eraser" aria-hidden="true"></i>Limpiar
    </button>
  </div>
</template>

<script setup>
import { statuses, expenseTypes } from '@/config/domain';

const props = defineProps({
  model: { type: Object, required: true },
  users: { type: Array, default: () => [] },
  showUser: Boolean,
  showType: Boolean,
  id: { type: String, default: 'filters' }
});

const emit = defineEmits(['clear', 'update:model']);

function update(field, value) {
  emit('update:model', { ...props.model, [field]: value });
}
</script>
