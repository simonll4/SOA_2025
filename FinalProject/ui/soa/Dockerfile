# Build y servidor en una sola etapa
FROM node:20-alpine

# Instalar curl para health check
RUN apk add --no-cache curl

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente (incluyendo .env si existe)
COPY . .

# Copiar archivo de health check
COPY healthcheck.html ./public/health.html

# Build de la aplicación (usará el .env copiado)
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health.html || exit 1

# Servir la aplicación
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
