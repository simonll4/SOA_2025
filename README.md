# SOA

Este repositorio fue utilizado para los proyectos llevados a cabo en la materia **Arquitectura Orientada a Servicios**.

El repositorio está organizado en módulos principales:

---

## /Infrastructures
Infraestructuras de pruebas desplegadas en máquinas virtuales. Incluye stacks Docker para simular entornos reales y automatizar la provisión de servicios.

**Tecnologías y servicios empleados:**
- **Nginx**: Servidor web y proxy inverso.
- **Certbot**: Obtención y renovación automática de certificados SSL.
- **MySQL**: Base de datos relacional.
- **Adminer**: Interfaz web para administración de bases de datos.
- **Node-RED**: Plataforma de integración visual.
- **Spring Boot**: Backend Java.
- **Docker Compose**: Orquestación de servicios.

---

## /Monitoring
Proyecto de monitorización desplegado en 3 máquinas virtuales, utilizando un stack completo para recolectar, almacenar y visualizar métricas de sistemas y servicios.

**Tecnologías y servicios empleados:**
- **Grafana**: Visualización y dashboards de métricas.
- **InfluxDB 2**: Base de datos de series temporales.
- **Telegraf**: Recolección de métricas del sistema, contenedores y servicios.
- **Nginx**: Proxy inverso y servidor web.
- **Certbot**: Certificados SSL automáticos.
- **Docker Compose**: Orquestación de servicios.

---

## /FinalProject
Proyecto final de la materia, integrando los módulos anteriores y agregando nuevos servicios y soluciones.

**Componentes principales:**
- **Servicios Backend**:
  - *face_profile_service*: Servicio para la creacion de perfiles faciales (Python, Flask, dlib, face_recognition, PostgreSQL/pgvector).
  - *face_recognition_service*: Servicio de reconocimiento facial (Python, Flask, dlib, face_recognition, PostgreSQL/pgvector).
  - *mqtt_proxy_service*: Proxy MQTT (Python, Flask, paho-mqtt).
  - *keycloak_sync_service*: Sincronización de usuarios Keycloak (Python, SQLAlchemy, PostgreSQL, APScheduler).
- **Frontend**:
  - Aplicación web desarrollada en **Vue 3**, **Vite**, **Pinia**, **TailwindCSS**.
- **Automatización y scripts para Raspberry Pi**:
  - Scripts en Python y Node.js para adquisición de datos, control de hardware y procesamiento de métricas.
- **Orquestación y despliegue**:
  - Uso extensivo de **Docker Compose** para todos los servicios y stacks.

---

Cada módulo cuenta con su propio README más específico.

---

> **Nota:** Todos los servicios backend y el frontend fueron empaquetados como imágenes Docker y subidos a Docker Hub para su uso libre.
