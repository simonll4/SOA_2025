# Monitoring

Este módulo contiene la infraestructura de monitoreo centralizada del proyecto, desplegada sobre múltiples máquinas virtuales y organizada en stacks independientes para cada tecnología principal.

## Estructura general

- **tig-stack/grafana/**: Visualización de métricas y alertas mediante Grafana.
- **tig-stack/telegraf/**: Recolección de métricas de sistemas y contenedores con Telegraf.
- **tig-stack/influx/**: Almacenamiento de series temporales con InfluxDB.

Cada subdirectorio incluye su propio `README.md` con instrucciones de despliegue, configuración y detalles técnicos específicos.

## Descripción general

El objetivo de este módulo es proveer una solución de monitoreo robusta y escalable para los servicios y sistemas desplegados en el proyecto. La arquitectura está basada en contenedores Docker y utiliza:

- **Grafana** para dashboards y visualización de datos.
- **InfluxDB** como base de datos de series temporales.
- **Telegraf** para la recolección de métricas de hosts, contenedores y servicios.
- **Nginx** como reverse proxy y terminación SSL.
- **Certbot** para la gestión automática de certificados SSL.
- **Alertas** configuradas en Grafana para notificaciones proactivas sobre el estado de los sistemas.

## Características

- Despliegue modular y automatizado por stack.
- Seguridad mediante certificados SSL y reverse proxy.
- Dashboards y alertas personalizables.
- Integración con el resto de la infraestructura del proyecto.

## Documentación específica

Para detalles sobre configuración, variables de entorno, ejemplos de dashboards y alertas, consulta los README de cada stack:

- [Grafana](./tig-stack/grafana/README.md)
- [Telegraf](./tig-stack/telegraf/README.md)
- [InfluxDB](./tig-stack/influx/README.md)

---
