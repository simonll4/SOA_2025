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

# # CHECK-RENEW-CERT.SH
# RENEW_CERT_SCRIPT="check-renew-cert.sh"
# if [ ! -f "$RENEW_CERT_SCRIPT" ]; then
#     echo "${GREEN}Creando el archivo check-renew-cert.sh...${NC}"
#     cat <<'EOF' >"$RENEW_CERT_SCRIPT"
# #!/bin/bash

# CERT_FILE="/home/user/SOA2025/grafana/certbot/conf/live/lpn3.crabdance.com/fullchain.pem"
# BACKUP_FILE="/home/user/SOA2025/grafana/certbot/conf/live/lpn3.crabdance.com/fullchain.pem.backup"

# # Verifica si existe una copia de respaldo
# if [ ! -f "$BACKUP_FILE" ]; then
#   # Crea una copia de respaldo si no existe
#   cp "$CERT_FILE" "$BACKUP_FILE"
#   echo "Copia de respaldo generada"
#   exit 0
# fi

# # Calcula el fingerprint del certificado actual y de la copia de respaldo
# CURRENT_FINGERPRINT=$(openssl x509 -in "$CERT_FILE" -noout -fingerprint -sha256 | cut -d'=' -f2 | tr -d ':')
# BACKUP_FINGERPRINT=$(openssl x509 -in "$BACKUP_FILE" -noout -fingerprint -sha256 | cut -d'=' -f2 | tr -d ':')

# # Compara los fingerprints
# if [ "$CURRENT_FINGERPRINT" != "$BACKUP_FINGERPRINT" ]; then
#   # Si los fingerprints son diferentes, recarga el certificado en Nginx
#   docker exec nginx nginx -s reload

#   # Actualiza la copia de respaldo
#   cp "$CERT_FILE" "$BACKUP_FILE"
#   echo "Cert renovado"
# else
#   echo "No hay cambios en el cert"
# fi

# EOF

#     chmod +x "$RENEW_CERT_SCRIPT"
#     echo "${GREEN}Archivo renew-cert.sh creado y configurado correctamente.${NC}"
# else
#     echo "${GREEN}El archivo renew-cert.sh ya existe.${NC}"
# fi

# Configurar Nginx sin SSL para obtener certificado
cp ./nginx/default.conf.no-ssl ./nginx/default.conf

# Iniciar servicios
docker compose up -d grafana

docker compose up -d nginx
wait_for_container_healthy "nginx" || exit 1

docker compose up -d certbot
wait_for_container_healthy "certbot" || exit 1

docker compose up -d cert-exporter
wait_for_container_healthy "cert-exporter" || exit 1

# # Iniciar Nginx sin SSL
# docker compose up -d nginx
# if ! wait_for_container_healthy "nginx"; then
#     exit 1
# fi

# docker compose up -d certbot
# if ! wait_for_container_healthy "certbot"; then
#     exit 1
# fi

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

# # Verificar si los archivos del certificado existen
# CERT_PATH="/home/user/SOA2025/grafana/certbot/conf/live/lpn3.crabdance.com/fullchain.pem"
# if [ -f "$CERT_PATH" ]; then
#     echo "${GREEN}Certificados obtenidos correctamente. Configurando Nginx con SSL...${NC}"
#     rm ./nginx/default.conf
#     cp ./nginx/default.conf.ssl ./nginx/default.conf
#     docker compose restart nginx
# else
#     echo "${RED}Error al obtener los certificados.${NC}"
#     exit 1
# fi

# # Agregar cronjob para ejecutar renew-cert.sh que se ejecute los domingos a las 4:00 AM
# CRON_JOB="0 4 * * 0 $RENEW_CERT_SCRIPT >> /var/log/check-renew-cert.log 2>&1"

# # Verificar si el cronjob ya existe usando una expresión regular
# if ! crontab -l | grep -qE "0 4 \* \* 0 $RENEW_CERT_SCRIPT >> /var/log/check-renew-cert\.log 2>&1"; then
#     echo "${GREEN}Agregando cronjob para check-renew-cert.sh...${NC}"
#     (
#         crontab -l 2>/dev/null
#         echo "$CRON_JOB"
#     ) | crontab -
#     if [ $? -eq 0 ]; then
#         echo "${GREEN}Cronjob agregado correctamente.${NC}"
#     else
#         echo "${RED}Error al agregar el cronjob.${NC}"
#         exit 1
#     fi
# else
#     echo "${GREEN}El cronjob ya existe.${NC}"
# fi

# # Ejecutar el archivo check-renew-cert.sh en segundo plano
# echo "${GREEN}Ejecutando check-renew-cert.sh para crear copia de respaldo de certificado${NC}"
# ./check-renew-cert.sh &
