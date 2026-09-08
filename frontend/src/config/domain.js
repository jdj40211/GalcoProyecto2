export const expenseTypes = [
  { id: 'alimentacion', nombre: 'Alimentación', cuenta: '511505', centroCostos: '001' },
  { id: 'transporte', nombre: 'Transporte', cuenta: '511510', centroCostos: '001' },
  { id: 'hospedaje', nombre: 'Hospedaje', cuenta: '511515', centroCostos: '001' },
  { id: 'combustible', nombre: 'Combustible', cuenta: '511520', centroCostos: '001' },
  { id: 'peajes', nombre: 'Peajes', cuenta: '511525', centroCostos: '001' },
  { id: 'parqueadero', nombre: 'Parqueadero', cuenta: '511530', centroCostos: '001' },
  { id: 'papeleria', nombre: 'Papelería', cuenta: '511535', centroCostos: '001' },
  { id: 'otros', nombre: 'Otros', cuenta: '511595', centroCostos: '001' }
];

export const statuses = {
  borrador: { label: 'Borrador', tone: 'info', icon: 'fa-pen' },
  enviada: { label: 'Enviada', tone: 'warning', icon: 'fa-paper-plane' },
  aprobada: { label: 'Aprobada', tone: 'success', icon: 'fa-circle-check' },
  rechazada: { label: 'Rechazada', tone: 'danger', icon: 'fa-ban' },
  pendiente_revision: { label: 'Pendiente revisión', tone: 'warning', icon: 'fa-clock' },
  incompleto: { label: 'Incompleto', tone: 'warning', icon: 'fa-triangle-exclamation' },
  aprobado: { label: 'Aprobado', tone: 'success', icon: 'fa-circle-check' },
  rechazado: { label: 'Rechazado', tone: 'danger', icon: 'fa-ban' },
  exportado: { label: 'Exportado', tone: 'info', icon: 'fa-file-export' },
  pendiente: { label: 'Pendiente', tone: 'warning', icon: 'fa-clock' },
  confirmado: { label: 'Confirmado', tone: 'success', icon: 'fa-circle-check' },
  procesado: { label: 'Procesado', tone: 'info', icon: 'fa-file-export' },
  error: { label: 'Con error', tone: 'warning', icon: 'fa-triangle-exclamation' }
};

export const fileRules = {
  maxBytes: 10 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  extensions: ['jpg', 'jpeg', 'png', 'pdf']
};
