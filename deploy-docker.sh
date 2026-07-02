#!/bin/bash

# =====================================================
# SCRIPT DE DESPLIEGUE CON DOCKER
# =====================================================

set -e

echo "=========================================="
echo "TALLER TECH - DESPLIEGUE CON DOCKER"
echo "=========================================="

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Instalar desde https://docker.com"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado."
    exit 1
fi

# Verificar archivos necesarios
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml no encontrado"
    exit 1
fi

# Verificar .env
if [ ! -f ".env" ]; then
    echo "⚠️  Creando .env desde .env.production..."
    cp .env.production .env
fi

# Opciones del script
case "$1" in
    "up")
        echo "🚀 Iniciando contenedores..."
        docker-compose up -d --build
        echo "✅ Contenedores iniciados"
        echo ""
        echo "Verificar logs: docker-compose logs -f"
        ;;
    
    "down")
        echo "🛑 Deteniendo contenedores..."
        docker-compose down
        echo "✅ Contenedores detenidos"
        ;;
    
    "logs")
        echo "📋 Mostrando logs..."
        docker-compose logs -f
        ;;
    
    "restart")
        echo "🔄 Reiniciando contenedores..."
        docker-compose restart
        echo "✅ Contenedores reiniciados"
        ;;
    
    "status")
        echo "📊 Estado de contenedores:"
        docker-compose ps
        ;;
    
    "build")
        echo "🔨 Compilando imagen..."
        docker-compose build --no-cache
        echo "✅ Imagen compilada"
        ;;
    
    "push")
        REGISTRY="${2:-docker.io}"
        USER="${3:-tunombre}"
        echo "📤 Subiendo imagen a $REGISTRY..."
        docker tag taller-tech-app:latest $REGISTRY/$USER/taller-tech:latest
        docker push $REGISTRY/$USER/taller-tech:latest
        echo "✅ Imagen subida"
        ;;
    
    "backup")
        echo "💾 Realizando backup..."
        mkdir -p backups
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        tar -czf backups/backup_$TIMESTAMP.tar.gz backend/data/
        echo "✅ Backup realizado: backups/backup_$TIMESTAMP.tar.gz"
        ;;
    
    *)
        echo "Uso: ./deploy-docker.sh [comando]"
        echo ""
        echo "Comandos disponibles:"
        echo "  up         - Iniciar contenedores"
        echo "  down       - Detener contenedores"
        echo "  logs       - Ver logs"
        echo "  restart    - Reiniciar contenedores"
        echo "  status     - Ver estado"
        echo "  build      - Compilar imagen (sin cache)"
        echo "  push       - Subir imagen a registry (ej: ./deploy-docker.sh push docker.io username)"
        echo "  backup     - Realizar backup de datos"
        exit 1
        ;;
esac

exit 0
