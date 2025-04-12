# Documentación de la VM - Monitoreo con Telegraf e Infraestructura de Servicios

## Descripción General
Esta máquina virtual (VM) está diseñada para desplegar un stack de servicios a modo de demostración, con el objetivo principal de monitorear tanto el sistema anfitrión como los contenedores en ejecución mediante Telegraf. Las métricas recolectadas se envían a una base de datos InfluxDB para su análisis.
El entorno también incluye varios servicios complementarios como un backend, Node-RED, Adminer y un servidor Nginx configurado con certificados SSL. Además, se implementa un sistema automatizado para la renovación y aplicación de los certificados, asegurando su actualización continua sin intervención manual.

---

## Servicios Desplegados

### 1. **Nginx**
- Actúa como proxy reverso para exponer servicios internos.
- Soporta HTTP y HTTPS.
- Usa certificados automáticos con Certbot.

### 2. **Certbot y Cert-Exporter**
- Certbot: Obtiene y renueva certificados SSL de Let's Encrypt.
- Cert-Exporter: Copia los certificados generados para que Nginx los use directamente.

### 3. **Backend**
- Imagen: `simonll4/fuelops-backend-iw3`
- Framework: Spring Boot.
- Conectado a MySQL.

### 4. **MySQL**
- Base de datos para el backend.
- Credenciales configuradas por variables de entorno.

### 5. **Adminer**
- UI web para administrar la base de datos MySQL.

### 6. **Node-RED**
- Plataforma de integración visual.
- Accesible vía Nginx.

### 7. **Telegraf**
- Recolecta métricas de:
  - Sistema operativo host.
  - Contenedores Docker.
  - Servicios desplegados.
- Usa un archivo `telegraf.conf` personalizado.
- Envía datos a una instancia externa de InfluxDB v2.

---

## Estructura del Proyecto
```
./telegraf/
├── certs/                        # Certificados exportados para Nginx
├── nginx/                        # Configuración de Nginx (HTTP y HTTPS)
├── nodered-data/                # Datos persistentes de Node-RED
├── .env                         # Variables de entorno sensibles
├── docker-compose.yml           # Orquestador de todos los servicios
├── init.sh                      # Script de inicio y configuración SSL
├── check-renew-cert.sh          # Script para renovar y verificar el cert SSL
├── README.md                    # Documentación (este archivo)
└── telegraf.conf                # Configuración personalizada de Telegraf
```

---

## Proceso de Inicialización (init.sh)
1. Inicia servicios base: `mysql`, `backend`, `nodered`, `adminer`, `telegraf`.
2. Levanta `nginx` sin SSL para que Certbot pueda generar certificados.
3. Una vez `nginx` está healthy, lanza `certbot` para obtener certificados.
4. Si Certbot es exitoso, se lanza `cert-exporter` para exportar los `.pem`.
5. Si los certificados están presentes, reemplaza la config de nginx por la versión SSL.
6. Reinicia nginx para usar HTTPS.
7. Programa en cron el script `check-renew-cert.sh` para verificar certificados semanalmente.

---

## Telegraf - Configuración
- Archivo: `telegraf.conf`
- Plugins habilitados:
  - `inputs.cpu`, `inputs.mem`, `inputs.disk`, `inputs.system`, `inputs.net`
  - `inputs.docker` para obtener métricas de contenedores
- Salida:
  - `outputs.influxdb_v2`
  - Usa el token y URL definidos en `.env`


## Monitoreo SSL (check-renew-cert.sh)
Verifica si el certificado fue renovado comparando su fingerprint con una copia de respaldo. Si hay cambios:
- Recarga `nginx`.
- Reemplaza el backup.

Se ejecuta automáticamente todos los domingos a las 4 AM via cron.

---

## Comando para levantar todo
```bash
chmod +x init.sh
./init.sh
```

---