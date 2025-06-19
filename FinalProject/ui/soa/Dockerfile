# Etapa 1: Build de la app Vue
FROM node:20-alpine AS builder

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos los archivos necesarios
COPY package*.json ./
COPY . .

# Instalamos dependencias
RUN npm install

# Compilamos la aplicación
RUN npm run build


# Etapa 2: Servimos los archivos con NGINX
FROM nginx:stable-alpine AS production

# Copiamos configuración personalizada de NGINX (si tenés)
COPY nginx.conf /etc/nginx/nginx.conf

# Copiamos el build generado por Vue (dist) al path que NGINX sirve
COPY --from=builder /app/dist /usr/share/nginx/html

# Opcional: Copiamos un archivo de salud para monitoreo
COPY healthcheck.html /usr/share/nginx/html/health.html

# Exponemos el puerto (por defecto NGINX usa 80)
EXPOSE 80

# Comando por defecto para iniciar NGINX en modo foreground
CMD ["nginx", "-g", "daemon off;"]
