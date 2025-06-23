# #!/bin/sh
# export PYTHONPATH=/app
# exec gunicorn -w 1 -b 0.0.0.0:${PORT:-5001} src.main:create_app --access-logfile - --error-logfile -

#!/bin/sh

echo "Entrypoint iniciado"
echo "FACE_PROFILE_SERVICE_PORT=${FACE_PROFILE_SERVICE_PORT}"
echo "DB_URL=${DB_URL}"

exec gunicorn -w 4 -b 0.0.0.0:${FACE_PROFILE_SERVICE_PORT} src.main:create_app --access-logfile - --error-logfile -
