#!/bin/bash

# Script para construir y desplegar la aplicación Vue

set -e  # Exit on any error

echo "🚀 Iniciando build de la aplicación Vue..."

# Construir la imagen Docker
echo "📦 Construyendo imagen Docker..."
docker build -t vue-app:latest .

echo "✅ Imagen construida exitosamente!"

# Opcional: Ejecutar con docker-compose
if [ "$1" = "--deploy" ]; then
    echo "🚀 Desplegando con docker-compose..."
    docker-compose up -d
    
    echo "✅ Aplicación desplegada!"
    echo "🌐 La aplicación estará disponible en: https://app.lpn2.crabdance.com"
    echo "🔍 Health check: http://localhost:3000/health.html"
else
    echo ""
    echo "📋 Comandos disponibles:"
    echo "  ./build.sh --deploy    # Construir y desplegar automáticamente"
    echo "  docker-compose up -d   # Desplegar manualmente"
    echo "  docker run -p 3000:3000 vue-app:latest  # Ejecutar manualmente"
    echo ""
    echo "🔍 Para verificar que funciona:"
    echo "  curl http://localhost:3000/health.html"
fi 