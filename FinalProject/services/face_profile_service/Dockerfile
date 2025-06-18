# Usamos una imagen base con Python 3.10
FROM python:3.10-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código de la app
COPY . .

# Exportar variables de entorno desde el host (serán inyectadas por docker-compose)
ENV PYTHONUNBUFFERED=1

# Puerto expuesto (opcional)
EXPOSE 5000

# Comando para ejecutar la app con gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "src.main:create_app"]
