# Imagen de la Suite GALCO para la nube (HU-32): un solo servicio que publica la API y la interfaz.
# Guía completa: docs/wiki/29-Sprint-3-Despliegue.md

# --- 1. Interfaz: se compila con la configuración web de Firebase -------------------------------
FROM node:22-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./

# Render entrega las variables de entorno del servicio como argumentos de compilación.
# La configuración web de Firebase no es secreta: viaja en el JavaScript que recibe el navegador.
ARG VITE_API_BASE=/api
ARG VITE_AUTH_BYPASS=false
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_EMAIL_DOMAIN=galco.com.co
ARG VITE_SESSION_IDLE_MINUTES=30
# Sin Firebase la interfaz caería en el modo demo, que en producción no tiene servidor: se detiene la compilación.
# Se comprueba desde Node para que el registro de compilación no muestre los valores.
RUN node -e "const e = process.env; if (!e.VITE_FIREBASE_API_KEY || !e.VITE_FIREBASE_PROJECT_ID) { console.error('Faltan VITE_FIREBASE_API_KEY y VITE_FIREBASE_PROJECT_ID: configúralas en el servicio.'); process.exit(1); }"
RUN npm run build

# --- 2. Ejecución: API + interfaz compilada + Chromium para los PDF de cotización ----------------
FROM node:22-bookworm-slim AS runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium fonts-liberation ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Puppeteer usa el Chromium del sistema en lugar de descargar el suyo.
ENV NODE_ENV=production \
    SERVE_FRONTEND=true \
    HOST=0.0.0.0 \
    PORT=10000 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY backend/ ./
COPY --from=frontend /app/frontend/dist /app/frontend/dist

# Sin privilegios de administrador dentro del contenedor.
USER node
EXPOSE 10000
CMD ["node", "app.js"]
