FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src

EXPOSE 5002

# Usa Gunicorn para iniciar el servicio Flask
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5002", "src.main:app"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl --fail http://localhost:5002/ || exit 1
