#!/bin/bash

# COLORES PARA LOS MENSAJES
GREEN='\033[38;5;46m'
NC='\033[0m' # Sin color
HOSTNAME=lpn3.crabdance.com

# CHECK-RENEW-CERT.SH
RENEW_CERT_SCRIPT="check-renew-cert.sh"
if [ ! -f "$RENEW_CERT_SCRIPT" ]; then
    echo "${GREEN}Creando el archivo check-renew-cert.sh...${NC}"
    cat <<'EOF' >"$RENEW_CERT_SCRIPT"
#!/bin/bash

HOSTNAME=lpn3.crabdance.com
CERT_FILE="/home/user/SOA2025/infra-nginx/certbot/conf/live/${HOSTNAME}/fullchain.pem"
BACKUP_FILE="/home/user/SOA2025/infra-nginx/certbot/conf/live/${HOSTNAME}/fullchain.pem.backup"

# Verifica si existe una copia de respaldo
if [ ! -f "$BACKUP_FILE" ]; then
  # Crea una copia de respaldo si no existe
  cp "$CERT_FILE" "$BACKUP_FILE"
  exit 0
fi

# Calcula el fingerprint del certificado actual y de la copia de respaldo
CURRENT_FINGERPRINT=$(openssl x509 -in "$CERT_FILE" -noout -fingerprint -sha256 | cut -d'=' -f2 | tr -d ':')
BACKUP_FINGERPRINT=$(openssl x509 -in "$BACKUP_FILE" -noout -fingerprint -sha256 | cut -d'=' -f2 | tr -d ':')

# Compara los fingerprints
if [ "$CURRENT_FINGERPRINT" != "$BACKUP_FINGERPRINT" ]; then
  # Si los fingerprints son diferentes, recarga el certificado en Nginx
  docker exec nginx nginx -s reload

  # Actualiza la copia de respaldo
  cp "$CERT_FILE" "$BACKUP_FILE"
  echo "Cert renovado"
else
  echo "No hay cambios en el cert"
fi

EOF

    chmod +x "$RENEW_CERT_SCRIPT"
    echo "${GREEN}Archivo renew-cert.sh creado y configurado correctamente.${NC}"
else
    echo "${GREEN}El archivo renew-cert.sh ya existe.${NC}"
fi

# Configurar Nginx sin SSL para obtener certificado
echo "${GREEN} Iniciando Nginx sin SSL...${NC}"
cp ./nginx/default.conf.no-ssl ./nginx/default.conf

# Iniciar servicios
echo "${GREEN}Iniciando servicios mysql backend nodered adminer...${NC}"
docker compose up -d mysql backend nodered adminer

# Iniciar Nginx sin SSL
echo "${GREEN}Iniciando Nginx sin SSL...${NC}"
docker compose up -d nginx

echo "${GREEN}Ejecutando Certbot para obtener los certificados...${NC}"
docker compose up -d certbot

# Esperar unos segundos para que Certbot termine
echo "${GREEN}Esperando a que Certbot termine...${NC}"
sleep 80

# Verificar si los archivos del certificado existen
CERT_PATH="/home/user/SOA2025/infra-nginx/certbot/conf/live/${HOSTNAME}/fullchain.pem"
if [ -f "$CERT_PATH" ]; then
    echo "${GREEN}Certificados obtenidos correctamente. Configurando Nginx con SSL...${NC}"
    rm ./nginx/default.conf
    cp ./nginx/default.conf.ssl ./nginx/default.conf
    docker compose restart nginx
else
    echo "${RED}Error al obtener los certificados.${NC}"
    exit 1
fi

# Agregar cronjob para ejecutar renew-cert.sh que se ejecute los domingos a las 4:00 AM
CRON_JOB="0 4 * * 0 $RENEW_CERT_SCRIPT >> /var/log/check-renew-cert.log 2>&1"

# Verificar si el cronjob ya existe usando una expresión regular
if ! crontab -l | grep -qE "0 4 \* \* 0 $RENEW_CERT_SCRIPT >> /var/log/check-renew-cert\.log 2>&1"; then
    echo "${GREEN}Agregando cronjob para check-renew-cert.sh...${NC}"
    (
        crontab -l 2>/dev/null
        echo "$CRON_JOB"
    ) | crontab -
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Cronjob agregado correctamente.${NC}"
    else
        echo -e "${RED}Error al agregar el cronjob.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}El cronjob ya existe.${NC}"
fi

# Ejecutar el archivo check-renew-cert.sh en segundo plano
echo "${GREEN}Ejecutando check-renew-cert.sh para crear copia de respaldo de certificado${NC}"
./check-renew-cert.sh &