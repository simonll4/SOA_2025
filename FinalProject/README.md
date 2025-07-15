# FinalProject - SOA 2025

Este módulo corresponde al proyecto final de la materia **Arquitectura Orientada a Servicios**. Aquí se integran y resuelven las consignas del **2do parcial** y el **proyecto final**, desplegando una solución completa sobre una infraestructura distribuida compuesta por 3 máquinas virtuales (VMs) en la nube y una Raspberry Pi para adquisición y procesamiento de datos, así como control remoto de actuadores.

---

## Resolución de consignas

### 2do Parcial: Adquisición y procesamiento en Raspberry Pi

- **Consigna:** Implementar un sistema de adquisición de datos de sensores (temperatura, humedad, ultrasonido, etc.), cálculo de volumen de líquidos en contenedores, y control de actuadores (relés, servos, LEDs RGB) desde una Raspberry Pi.
- **Solución:**  
  - Scripts en Python y Node.js para adquisición de datos (`data_acquisition.py`, `metrics_calculation_node.js`, etc.).
  - Control de actuadores mediante GPIO (relés, servos, LEDs).
  - Flujos de Node-RED para integración, automatización y lógica de negocio.
  - Persistencia de datos de contenedores en archivos JSON.
  - Exposición de datos y comandos a través de MQTT y HTTP.

### Consigna Final: Integración, monitoreo y servicios distribuidos

- **Consigna:** Integrar la solución de la Raspberry Pi con una infraestructura de servicios en la nube, implementando autenticación, monitoreo, gestión de perfiles y reconocimiento facial, y control remoto seguro.
- **Solución:**  
  - **Infraestructura distribuida:**  
    - **/lpn1, /lpn2, /lpn3:** Cada directorio representa una VM en la nube, con su propio dominio y stack de servicios desplegados mediante Docker Compose.
      - **lpn1:** Keycloak (autenticación y autorización), InfluxDB (base de datos de series temporales).
      - **lpn2:** Node-RED, MQTT Proxy Service, Mosquitto (broker MQTT), Frontend (Vue 3).
      - **lpn3:** Grafana (visualización), servicios de reconocimiento y perfiles faciales, base de datos vectorial (pgvector), Adminer.
  - **Raspberry Pi:**  
    - Scripts y flujos para sensado, control y lógica local.
  - **Servicios Backend:**  
    - *face_profile_service:* Gestión y almacenamiento de perfiles faciales.
    - *face_recognition_service:* Reconocimiento facial en tiempo real.
    - *mqtt_proxy_service:* Proxy seguro para comandos MQTT autenticados.
    - *keycloak_sync_service:* Sincronización de usuarios y roles desde Keycloak.
  - **Frontend:**  
    - Aplicación web en Vue 3, Vite, Pinia y TailwindCSS.
    - Paneles de monitoreo, administración de perfiles, control de dispositivos y visualización de métricas.
    - Integración con Keycloak para autenticación y control de acceso.
  - **Monitoreo y visualización:**  
    - Grafana para dashboards de métricas y alertas.
    - InfluxDB para almacenamiento de series temporales.
    - Telegraf para recolección de métricas de sistemas y contenedores.
  - **Seguridad:**  
    - Autenticación centralizada con Keycloak.
    - Certificados SSL automáticos con Certbot.
    - OAuth2 Proxy para proteger accesos a Node-RED y otros servicios.
    - Roles y permisos gestionados desde Keycloak.

---

## Estructura del módulo

- **/lpn1, /lpn2, /lpn3:** Infraestructura y servicios desplegados en cada VM.
- **/raspberry-pi:** Scripts, flujos de Node-RED, configuración y datos de la Raspberry Pi.
- **/services:** Servicios backend.
- **/ui:** Frontend web (SPA en Vue 3).
- **/presentations:** Presentaciones y documentación adicional.

---

## Tecnologías principales

- **Docker & Docker Compose** (orquestación de servicios)
- **Python, Flask** (servicios backend)
- **Vue 3, Vite, Pinia, TailwindCSS** (frontend)
- **Keycloak** (autenticación y autorización)
- **MQTT, Mosquitto** (mensajería IoT)
- **Node-RED** (automatización y lógica visual)
- **Grafana, InfluxDB, Telegraf** (monitorización)
- **pgvector, PostgreSQL** (almacenamiento vectorial y relacional)
- **Certbot** (SSL)
- **OAuth2 Proxy** (seguridad de acceso)

---

## Despliegue y uso

Cada VM cuenta con su propio `docker-compose.yml` y scripts de inicialización. Consulta los README específicos en cada subdirectorio para instrucciones detalladas de despliegue y configuración.

---

## Referencias de consignas

- [2do parcial 2025 - RASPI calculo volumen, etc - SOA-1.pdf](./2do%20parcial%202025%20-%20RASPI%20calculo%20volumen,%20etc%20-%20SOA-1.pdf)
- [Consigna Final SOA 2025.pdf](./Consigna%20Final%20SOA%202025.pdf)

---
