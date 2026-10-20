/**
 * indicadores.service.js
 *
 * Flujo de estados de una cotización e indicadores comerciales (HU-12).
 * Funciones puras: reciben las cotizaciones y devuelven los cálculos.
 */

'use strict';

const ESTADOS = ['borrador', 'enviada', 'aprobada', 'rechazada', 'anulada'];

// Una cotización se envía al cliente y él decide; aprobada, rechazada y anulada son finales.
// "Enviada" solo la registra el envío por correo confirmado. Desde borrador también se puede decidir:
// cubre cotizaciones entregadas por otro medio, aunque entonces no se mide el tiempo de respuesta.
const TRANSICIONES = {
  borrador: ['enviada', 'aprobada', 'rechazada', 'anulada'],
  enviada: ['aprobada', 'rechazada', 'anulada'],
  aprobada: [],
  rechazada: [],
  anulada: []
};

const puedeCambiar = (desde, hacia) => (TRANSICIONES[desde] || []).includes(hacia);

const HORA = 60 * 60 * 1000;
const fechaDe = (historial, estado) => {
  const entrada = (historial || []).find((item) => item.estado === estado);
  return entrada ? new Date(entrada.fecha).getTime() : null;
};
const promedio = (valores) =>
  valores.length ? Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10 : null;
const precio = (doc) => Number(doc.precios?.precioFinal) || 0;

function agrupar(docs, clave) {
  const grupos = new Map();
  for (const doc of docs) {
    const nombre = clave(doc);
    const grupo = grupos.get(nombre) || { nombre, cantidad: 0, valor: 0, aprobadas: 0, rechazadas: 0 };
    grupo.cantidad += 1;
    grupo.valor += precio(doc);
    if (doc.estado === 'aprobada') grupo.aprobadas += 1;
    if (doc.estado === 'rechazada') grupo.rechazadas += 1;
    grupos.set(nombre, grupo);
  }
  return [...grupos.values()];
}

/**
 * - tiempoRespuestaHoras: de creada a enviada al cliente.
 * - tiempoDecisionHoras: de enviada a aprobada o rechazada.
 * - tasaAprobacion: aprobadas sobre decididas (aprobadas + rechazadas); null si no hay decididas.
 * Las cotizaciones sin historial (migradas) cuentan en totales pero no en los tiempos.
 */
function calcularIndicadores(docs) {
  const porEstado = Object.fromEntries(ESTADOS.map((estado) => [estado, { cantidad: 0, valor: 0 }]));
  const respuestas = [];
  const decisiones = [];
  for (const doc of docs) {
    const estado = porEstado[doc.estado] ? doc.estado : 'borrador';
    porEstado[estado].cantidad += 1;
    porEstado[estado].valor += precio(doc);
    const creada = fechaDe(doc.historialEstados, 'borrador');
    const enviada = fechaDe(doc.historialEstados, 'enviada');
    const decidida = fechaDe(doc.historialEstados, 'aprobada') ?? fechaDe(doc.historialEstados, 'rechazada');
    if (creada !== null && enviada !== null) respuestas.push((enviada - creada) / HORA);
    if (enviada !== null && decidida !== null) decisiones.push((decidida - enviada) / HORA);
  }
  const decididas = porEstado.aprobada.cantidad + porEstado.rechazada.cantidad;
  return {
    total: docs.length,
    valorTotal: docs.reduce((suma, doc) => suma + precio(doc), 0),
    valorAprobado: porEstado.aprobada.valor,
    tasaAprobacion: decididas ? Math.round((porEstado.aprobada.cantidad / decididas) * 1000) / 10 : null,
    tiempoRespuestaHoras: promedio(respuestas),
    tiempoDecisionHoras: promedio(decisiones),
    porEstado,
    porMes: agrupar(docs, (doc) => new Date(doc.createdAt).toISOString().slice(0, 7)).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    ),
    porVendedor: agrupar(docs, (doc) => doc.metadata?.vendedor || 'Sin asignar').sort((a, b) => b.valor - a.valor),
    porTipoPoste: agrupar(docs, (doc) => doc.configuracion?.tipoPoste || 'Sin tipo').sort((a, b) => b.valor - a.valor)
  };
}

module.exports = { ESTADOS, TRANSICIONES, puedeCambiar, calcularIndicadores };
