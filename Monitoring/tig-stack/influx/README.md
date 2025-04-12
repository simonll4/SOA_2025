
# Stack de Monitoreo con InfluxDB 2, Nginx y Certbot

Este entorno despliega un stack orientado a la recopilación de métricas utilizando **InfluxDB 2**, ideal para integrarse con herramientas como **Telegraf** y **Grafana**. Incluye también un servidor **Nginx** configurado con certificados SSL automáticos mediante **Certbot**. Todo el entorno está diseñado para correr en contenedores Docker y facilitar la automatización de certificados.

---

## 📦 Servicios Incluidos

- **InfluxDB 2**: Base de datos de series temporales para almacenar métricas.
- **Nginx**: Servidor web que actúa como proxy inverso con soporte SSL.
- **Certbot**: Cliente de Let's Encrypt para generar certificados automáticamente.
- **Cert Exporter**: Contenedor auxiliar que exporta los certificados generados al host.
- **Automatización con cron**: Un script revisa y recarga los certificados automáticamente si detecta cambios.

---

## 🛠 Estructura del Proyecto

```
.
├── certs/                      # Certificados exportados por cert-exporter
├── nginx/                      # Configuraciones de Nginx (SSL y no-SSL)
├── .env                        # Variables de entorno usadas por InfluxDB
├── docker-compose.yml          # Definición de servicios
├── init.sh                     # Script para inicialización y setup de servicios
└── README.md                   # Este archivo
```

---

## ⚙️ Inicialización

1. Asegurate de tener Docker y Docker Compose instalados.
2. Configurá tus variables en el archivo `.env` (ver ejemplo más abajo).
3. Ejecutá el script de inicialización:

```bash
chmod +x init.sh
./init.sh
```

Este script:

- Despliega los contenedores en el orden correcto.
- Espera que estén saludables antes de avanzar.
- Genera certificados con Let's Encrypt si es necesario.
- Activa un `cronjob` para renovar y recargar certificados automáticamente.

---