'use strict';
const mongoose = require('mongoose');
const Boom = require('@hapi/boom');
const config = require('../../../config');
const { TIPOS_POSTE, ALTURAS_VALIDAS, getBrazosValidosParaTipo, PLATINAS, TUBOS } = require('../data/tablasBase');
const State =
  mongoose.models.ConfiguracionEstado ||
  mongoose.model(
    'ConfiguracionEstado',
    new mongoose.Schema({
      codigo: { type: String, unique: true },
      activo: Boolean
    })
  );
const states = new Map();
const configurations = TIPOS_POSTE.flatMap((tipoPoste) =>
  ALTURAS_VALIDAS.flatMap((altura) =>
    (getBrazosValidosParaTipo(tipoPoste) || [5]).map((brazo) => ({
      codigo: `${tipoPoste}-${altura}-${brazo}`,
      nombre: `Poste ${tipoPoste} ${altura} m / brazo ${brazo} m`,
      configuracion: { tipoPoste, altura, brazo, pintura: false, cantidad: 1 },
      componentes: PLATINAS[tipoPoste],
      tubos: TUBOS,
      acabado: 'Galvanizado; pintura opcional',
      especificacionPendiente: 'Espesor y grado del acero requieren ficha técnica validada por GALCO.'
    }))
  )
);
module.exports = {
  async list(q = '', includeInactive = false) {
    const saved =
      config.persistence.mode === 'mongo'
        ? new Map((await State.find().lean()).map((item) => [item.codigo, item.activo]))
        : states;
    const term = q.toLocaleLowerCase('es').trim();
    return configurations
      .map((item) => ({ ...item, activo: saved.get(item.codigo) !== false }))
      .filter(
        (item) =>
          (includeInactive || item.activo) && `${item.codigo} ${item.nombre}`.toLocaleLowerCase('es').includes(term)
      );
  },
  async setActive(codigo, activo) {
    if (!configurations.some((item) => item.codigo === codigo)) throw Boom.notFound();
    if (config.persistence.mode === 'mongo') await State.findOneAndUpdate({ codigo }, { activo }, { upsert: true });
    else states.set(codigo, activo);
    return { codigo, activo };
  },
  async assertActive(configuration) {
    const code = `${configuration.tipoPoste}-${configuration.altura}-${configuration.brazo}`;
    const item = (await this.list('', true)).find((entry) => entry.codigo === code);
    if (item && !item.activo) throw Boom.conflict('La configuración está inactiva.');
  },
  reset() {
    states.clear();
  }
};
