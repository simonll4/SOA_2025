FROM python:3.10-slim

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential cmake pkg-config git \
    libopenblas-dev liblapack-dev libx11-dev libgtk-3-dev \
    libboost-all-dev libjpeg-dev python3-dev swig \
    libboost-python-dev libboost-thread-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Evitar AVX/SSE
ENV CXXFLAGS="-mno-avx -mno-sse4.2 -mno-sse4.1"
ENV CFLAGS="-mno-avx -mno-sse4.2 -mno-sse4.1"

# Compilar dlib sin AVX
RUN git clone https://github.com/davisking/dlib.git /tmp/dlib && \
    cd /tmp/dlib && mkdir build && cd build && \
    cmake .. -DDLIB_USE_AVX_INSTRUCTIONS=OFF && \
    cmake --build . --config Release && \
    cd .. && python3 setup.py install && \
    rm -rf /tmp/dlib

# Clonar face_recognition y quitar dependencia explícita a dlib
RUN git clone https://github.com/ageitgey/face_recognition.git /tmp/face_recognition && \
    cd /tmp/face_recognition && \
    sed -i '/^ *"dlib.*",*/d' setup.py && \
    pip install .

# Instalar dependencias del proyecto
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

# Arrancar
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "src.main:app"]



# FROM python:3.10-slim

# # Instalar dependencias del sistema
# RUN apt-get update && apt-get install -y \
#     build-essential cmake \
#     libopenblas-dev liblapack-dev \
#     libx11-dev libgtk-3-dev \
#     git \
#     && rm -rf /var/lib/apt/lists/*

# # Variables para compilar dlib sin AVX
# ENV CMAKE_ARGS="-DDLIB_USE_AVX_INSTRUCTIONS=OFF"
# ENV CXXFLAGS="-mno-avx -mno-sse4.2 -mno-sse4.1"
# ENV CFLAGS="-mno-avx -mno-sse4.2 -mno-sse4.1"

# # Copiar requirements e instalar dependencias
# COPY requirements.txt /app/requirements.txt
# WORKDIR /app

# # Instalar todo excepto dlib y face_recognition
# RUN pip install --no-cache-dir --upgrade pip && \
#     pip install --no-cache-dir \
#     --no-binary=dlib \
#     dlib==19.24.2 \
#     face_recognition==1.3.0

# # Instalar tus otras dependencias
# RUN pip install --no-cache-dir -r requirements.txt

# # Copiar el resto de tu app
# COPY . .

# # Comando de arranque
# CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "src.main:app"]
