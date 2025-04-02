# Certbot Infrastructure

## Descripción
Este servicio utiliza **Certbot** para gestionar certificados SSL de forma automática mediante el método *standalone*.

## Servicios
### Certbot
- **Imagen:** `certbot/certbot`
- **Nombre del contenedor:** `certbot`
- **Volúmenes:**
  - `./certbot/conf:/etc/letsencrypt`: Almacena los certificados SSL y archivos de configuración.
- **Entrypoint:**
  - Genera un certificado SSL para el dominio `lpn1.crabdance.com`.
  - Renueva automáticamente el certificado cada 30 días.
- **Puertos:**
  - Expone el puerto `80` para realizar la validación del certificado.

## Uso
Levanta el servicio utilizando `docker-compose up -d` y Certbot gestionará automáticamente los certificados SSL para el dominio configurado.