'use strict';

// Llamadas a proveedores de IA compartidas por el OCR de viáticos y el analizador de hojas de vida:
// tiempo máximo, errores legibles y respuestas JSON validadas por esquema (Responses API de OpenAI).
const Boom = require('@hapi/boom');
const config = require('../config');

const RESPONSES_URL = 'https://api.openai.com/v1/responses';

async function request(provider, url, options) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(config.ocr.timeoutMs) });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError')
      throw Boom.gatewayTimeout(`${provider} superó el tiempo máximo de ${Math.round(config.ocr.timeoutMs / 1000)} s.`);
    throw Boom.badGateway(`No fue posible conectar con ${provider}: ${error.message}`);
  }
}

async function openaiError(response) {
  let detail = '';
  try {
    detail = (await response.json()).error?.message || '';
  } catch {
    /* respuesta sin cuerpo JSON */
  }
  if (response.status === 401)
    return Boom.badGateway('OpenAI rechazó la clave configurada. Revisa OPENAI_API_KEY en backend/.env.');
  if (response.status === 429)
    return Boom.badGateway(
      `OpenAI rechazó la solicitud por límite de uso o saldo insuficiente.${detail ? ` ${detail}` : ''}`
    );
  return Boom.badGateway(`OpenAI respondió ${response.status}${detail ? `: ${detail}` : '.'}`);
}

/**
 * Pide a OpenAI una respuesta JSON que cumple `schema` y devuelve su texto.
 * `store: false`: OpenAI no conserva el contenido enviado (comprobantes, hojas de vida).
 * @param {{ instructions: string, content: object[], name: string, schema: object, subject: string }} options
 */
async function respond({ instructions, content, name, schema, subject }) {
  if (!config.ocr.openaiKey) throw Boom.serverUnavailable('OPENAI_API_KEY no está configurada en backend/.env.');
  const response = await request('OpenAI', RESPONSES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.ocr.openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ocr.openaiModel,
      instructions,
      store: false,
      input: [{ role: 'user', content }],
      text: { format: { type: 'json_schema', name, strict: true, schema } }
    })
  });
  if (!response.ok) throw await openaiError(response);
  const body = await response.json();
  const output = (body.output || []).filter((item) => item.type === 'message').flatMap((item) => item.content || []);
  const refusal = output.find((item) => item.type === 'refusal');
  if (refusal) throw Boom.badGateway(`OpenAI no procesó ${subject}: ${refusal.refusal}`);
  const text = body.output_text || output.find((item) => item.type === 'output_text')?.text;
  if (body.status === 'incomplete' || !text)
    throw Boom.badGateway('OpenAI no devolvió una respuesta completa. Intenta de nuevo.');
  return text;
}

module.exports = { request, respond };
