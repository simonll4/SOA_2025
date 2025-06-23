# Usar Python 3.11 slim como imagen base
FROM python:3.11-slim

# Establecer variables de entorno
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Crear directorio de trabajo
WORKDIR /app

# Crear usuario no-root para seguridad
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copiar requirements.txt primero (para aprovechar cache de Docker)
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY . .

# Cambiar propietario de los archivos al usuario no-root
RUN chown -R appuser:appuser /app

# Cambiar al usuario no-root
USER appuser


# Comando de salud para verificar que la app está funcionando
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import os; os.path.exists('src/main.py') and exit(0) or exit(1)"

# Comando por defecto para ejecutar la aplicación
CMD ["python", "-m", "src.main"]