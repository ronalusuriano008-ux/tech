# =====================================================
# DOCKERFILE - Construcción multi-etapa
# =====================================================

# Etapa 1: Build del frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build 2>/dev/null || echo "No build script in frontend"

# Etapa 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema necesarias para sharp/canvas
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

# Copiar package.json y dependencias del backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

WORKDIR /app

# Copiar archivos del backend
COPY backend/ ./backend/

# Copiar frontend construido
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/login ./frontend/login
COPY --from=frontend-builder /app/frontend/admin-panel ./frontend/admin-panel
COPY --from=frontend-builder /app/frontend/calculadora ./frontend/calculadora
COPY --from=frontend-builder /app/frontend/registro-servicios ./frontend/registro-servicios

# Copiar archivo de configuración
COPY .env.production .env

# Crear directorios necesarios
RUN mkdir -p backend/data backend/temp/reportes backend/public/reports

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar aplicación
CMD ["node", "backend/server.js"]
