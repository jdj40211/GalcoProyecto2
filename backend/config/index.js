'use strict';

require('dotenv').config();
const Joi = require('joi');

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  HOST: Joi.string().default('0.0.0.0'),
  PORT: Joi.number().integer().default(3000),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  SERVE_FRONTEND: Joi.boolean().default(false),
  PERSISTENCE_MODE: Joi.string().valid('memory', 'mongo').default('memory'),
  MONGO_URI: Joi.string().allow('').default('mongodb://127.0.0.1:27017'),
  MONGO_DB: Joi.string().default('galco_viaticos'),
  AUTH_BYPASS: Joi.boolean().default(true),
  FIREBASE_CREDENTIALS_PATH: Joi.string().allow('').default(''),
  FIREBASE_CREDENTIALS_JSON: Joi.string().allow('').default(''),
  FIREBASE_PROJECT_ID: Joi.string().allow('').default(''),
  OCR_PROVIDER: Joi.string().valid('demo', 'openai', 'ocrspace', 'custom').default('demo'),
  OCR_TIMEOUT_MS: Joi.number().integer().min(1000).default(20000),
  OPENAI_API_KEY: Joi.string().allow('').default(''),
  OPENAI_MODEL: Joi.string().default('gpt-4.1-mini'),
  OCRSPACE_API_KEY: Joi.string().allow('').default(''),
  CUSTOM_OCR_ENDPOINT: Joi.string().allow('').default(''),
  CUSTOM_OCR_TOKEN: Joi.string().allow('').default('')
}).unknown(true);

const { value, error } = schema.validate(process.env);
if (error) throw new Error(`[config] ${error.message}`);
if (value.NODE_ENV === 'production' && value.AUTH_BYPASS)
  throw new Error('AUTH_BYPASS debe estar desactivado en producción.');
if (value.PERSISTENCE_MODE === 'mongo' && !value.MONGO_URI)
  throw new Error('MONGO_URI es obligatorio con PERSISTENCE_MODE=mongo.');

module.exports = {
  env: value.NODE_ENV,
  host: value.HOST,
  port: value.PORT,
  corsOrigin: value.CORS_ORIGIN,
  serveFrontend: value.SERVE_FRONTEND,
  persistence: { mode: value.PERSISTENCE_MODE, uri: value.MONGO_URI, db: value.MONGO_DB },
  auth: {
    bypass: value.AUTH_BYPASS,
    credentialsPath: value.FIREBASE_CREDENTIALS_PATH,
    credentialsJson: value.FIREBASE_CREDENTIALS_JSON,
    projectId: value.FIREBASE_PROJECT_ID
  },
  ocr: {
    provider: value.OCR_PROVIDER,
    timeoutMs: value.OCR_TIMEOUT_MS,
    openaiKey: value.OPENAI_API_KEY,
    openaiModel: value.OPENAI_MODEL,
    ocrspaceKey: value.OCRSPACE_API_KEY,
    customEndpoint: value.CUSTOM_OCR_ENDPOINT,
    customToken: value.CUSTOM_OCR_TOKEN
  }
};
