'use strict';

const Boom = require('@hapi/boom');

// El adaptador del proveedor debe aceptar este contrato y devolver un id de envío.
// Nunca se marca como enviada una cotización solo por preparar o descargar su PDF.
module.exports = {
  async send({ to, subject, pdf, filename }) {
    const endpoint = process.env.MAIL_ENDPOINT;
    const token = process.env.MAIL_TOKEN;
    if (!endpoint || !token) throw Boom.serverUnavailable('Configura MAIL_ENDPOINT y MAIL_TOKEN para enviar correo.');
    if (!endpoint.startsWith('https://')) throw Boom.serverUnavailable('El proveedor de correo requiere HTTPS.');
    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        signal: AbortSignal.timeout(20000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to,
          subject,
          text: 'Adjuntamos su cotización de GALCO.',
          attachments: [{ filename, contentType: 'application/pdf', content: pdf.toString('base64') }]
        })
      });
    } catch (error) {
      throw Boom.badGateway('No fue posible confirmar el envío con el proveedor.', error);
    }
    if (!response.ok) throw Boom.badGateway('El proveedor de correo no aceptó el envío.');
    let result;
    try {
      result = await response.json();
    } catch (error) {
      throw Boom.badGateway('El proveedor devolvió una confirmación inválida.', error);
    }
    if (!result.id || typeof result.id !== 'string') throw Boom.badGateway('Falta la confirmación del proveedor.');
    return { proveedorId: result.id, destinatario: to, fecha: new Date().toISOString() };
  }
};
