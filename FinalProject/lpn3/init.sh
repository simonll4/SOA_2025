#!/bin/bash

# COLORES PARA LOS MENSAJES
GREEN='\033[38;5;46m'
NC='\033[0m' # Sin color

wait_for_container_healthy() {
    local CONTAINER_NAME=$1
    local TIMEOUT=${2:-300} # Tiempo máximo de espera en segundos (por defecto 5 minutos)
    local INTERVAL=5        # Intervalo entre verificaciones

    echo "${GREEN}Esperando a que $CONTAINER_NAME esté en estado healthy...${NC}"

    local START_TIME=$(date +%s)
    while true; do
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null)

        if [ "$STATUS" = "healthy" ]; then
            echo "${GREEN}$CONTAINER_NAME está listo.${NC}"
            return 0
        fi

        local CURRENT_TIME=$(date +%s)
        local ELAPSED_TIME=$((CURRENT_TIME - START_TIME))

        if [ $ELAPSED_TIME -ge $TIMEOUT ]; then
            echo "${RED}Tiempo de espera agotado para $CONTAINER_NAME${NC}"
            return 1
        fi

        sleep $INTERVAL
    done
}

RENEW_CERT_SCRIPT="check-renew-cert.sh"
CERT_PATH="./certs/lpn3.crabdance.com/fullchain.pem"
BACKUP_FILE="./certs/lpn3.crabdance.com/fullchain.pem.backup"

if [ ! -f "$RENEW_CERT_SCRIPT" ]; then
    echo "${GREEN}Creando el archivo check-renew-cert.sh...${NC}"
    cat <<EOF >"$RENEW_CERT_SCRIPT"
#!/bin/bash

CERT_FILE="$CERT_PATH"
BACKUP_FILE="$BACKUP_FILE"

if [ ! -f "\$BACKUP_FILE" ]; then
  cp "\$CERT_FILE" "\$BACKUP_FILE"
  echo "Copia de respaldo generada"
  exit 0
fi

CURRENT_FINGERPRINT=\$(openssl x509 -in "\$CERT_FILE" -noout -fingerprint -sha256 | cut -d'=' -f2 | tr -d ':')
BACKUP_FINGERPRINT=\$(openssl x509 -in "\$BACKUP_FILE" -noout -fingerprint -sha256 | cut -d'=' -f2 | tr -d ':')

if [ "\$CURRENT_FINGERPRINT" != "\$BACKUP_FINGERPRINT" ]; then
  docker exec nginx nginx -s reload
  cp "\$CERT_FILE" "\$BACKUP_FILE"
  echo "Cert renovado"
else
  echo "No hay cambios en el cert"
fi
EOF
    chmod +x "$RENEW_CERT_SCRIPT"
fi

# Configurar Nginx sin SSL para obtener certificado
cp ./nginx/default.conf.no-ssl ./nginx/default.conf

# Iniciar servicios
docker compose up -d grafana replic-db adminer keycloak_sync_service face_profile_service face_recognition_service

docker compose up -d nginx
wait_for_container_healthy "nginx" || exit 1

docker compose up -d certbot
wait_for_container_healthy "certbot" || exit 1

docker compose up -d cert-exporter
wait_for_container_healthy "cert-exporter" || exit 1

if [ -f "$CERT_PATH" ]; then
    echo "${GREEN}Certificados disponibles en cert-exporter. Configurando Nginx con SSL...${NC}"
    rm ./nginx/default.conf
    cp ./nginx/default.conf.ssl ./nginx/default.conf
    docker compose restart nginx
else
    echo "${RED}Error: Certificados aún no disponibles.${NC}"
    exit 1
fi

CRON_JOB="0 4 * * 0 $(pwd)/$RENEW_CERT_SCRIPT >> /var/log/check-renew-cert.log 2>&1"
crontab -l | grep -qF "$RENEW_CERT_SCRIPT" || (
    crontab -l 2>/dev/null
    echo "$CRON_JOB"
) | crontab -

echo "${GREEN}Ejecutando check-renew-cert.sh para crear copia de respaldo de certificado${NC}"
./check-renew-cert.sh &
