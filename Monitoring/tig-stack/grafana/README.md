
# Infraestructura Grafana con Nginx y Certbot

Este entorno despliega el servicio Grafana, servido a través de Nginx con certificados SSL generados y renovados automáticamente mediante Certbot.

## Estructura del Proyecto

```
grafana/
├── certs/                  # Certificados exportados para Nginx
├── nginx/                  # Configuraciones de Nginx (.conf con y sin SSL)
├── docker-compose.yml      # Definición de servicios Docker
├── init.sh                 # Script de inicialización y automatización
└── README.md               # Documentación del entorno
```

## Servicios

### 1. **Grafana**
- Imagen: `grafana/grafana-oss:latest`
- Provee la interfaz de monitoreo.
- Volumen persistente: `/var/lib/grafana`
- Configurado para servir desde `https://lpn3.crabdance.com`.

### 2. **Nginx**
- Imagen: `nginx:1.23.3`
- Servidor proxy inverso.
- Escucha en puertos 80 (HTTP) y 443 (HTTPS).
- Redirecciona tráfico hacia Grafana.
- Usa certificados SSL proporcionados por Certbot y exportados por `cert-exporter`.

### 3. **Certbot**
- Imagen: `certbot/certbot`
- Obtiene certificados desde Let's Encrypt.
- Usa el método `webroot`.
- Renueva los certificados automáticamente cada 30 días.

### 4. **Cert-Exporter**
- Imagen: `alpine:latest`
- Exporta los certificados desde Certbot al directorio montado en `./certs`.
- Verifica y actualiza los certificados periódicamente.
- Cambios de certificados disparan la recarga automática de Nginx.

## Inicialización

Usar el script `init.sh`, el cual realiza:

- Generación de `check-renew-cert.sh` si no existe.
- Configuración inicial de Nginx sin SSL.
- Inicio progresivo de contenedores.
- Verificación del estado `healthy` de los servicios críticos.
- Obtención y validación de certificados.
- Sustitución automática de configuración de Nginx para habilitar SSL.
- Programación de una tarea `cron` semanal para renovación del certificado.

### Comando para inicializar:

```bash
chmod +x init.sh
./init.sh
```

## Requisitos

- Docker & Docker Compose instalados.
- Acceso a puertos 80 y 443 en la máquina anfitriona.
- Dominio `lpn3.crabdance.com` apuntando a la IP pública del host.