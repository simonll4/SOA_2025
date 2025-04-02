# Infraestructura Nginx con Certbot

## Descripción
Esta infraestructura usa **Nginx** como servidor web y **Certbot** para gestionar certificados SSL automáticamente. Se configura inicialmente sin SSL, obtiene los certificados y luego habilita la configuración segura.

## Servicios
- **Nginx**: Proxy inverso que redirige las peticiones a los servicios internos.
- **Certbot**: Genera y renueva los certificados SSL.
- **Backend**: Servidor en Spring ([Repositorio](https://github.com/simonll4/FuelOps-backend)).
- **MySQL**: Base de datos.
- **Adminer**: Interfaz web para gestionar la base de datos.
- **Node-RED**: Plataforma de integración visual.

## Despliegue
Ejecutar el siguiente script con **sudo** para inicializar la infraestructura:

```bash
sudo ./init.sh
```

Este script:
1. Configura Nginx sin SSL.
2. Inicia los servicios MySQL, Backend, Node-RED y Adminer.
3. Inicia Nginx y Certbot para obtener los certificados.
4. Espera la generación de los certificados y configura Nginx con SSL.
5. Programa una tarea cron para renovar certificados automáticamente.

## Pendiente
- Modificar `init.sh` para que no requiera `sudo`.
- Implementar un mecanismo para verificar la finalización del contenedor de Certbot antes de continuar con el flujo de ejecución.

