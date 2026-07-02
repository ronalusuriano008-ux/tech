#!/bin/bash

# =====================================================
# SCRIPT DE DESPLIEGUE - PRODUCCIÓN
# =====================================================

set -e

echo "=========================================="
echo "TALLER TECH - SCRIPT DE DESPLIEGUE"
echo "=========================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json no encontrado. Ejecutar desde la raíz del proyecto."
    exit 1
fi

# 1. Verificar variables de entorno
echo ""
echo "📋 Verificando configuración..."
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado. Copiar .env.production a .env"
    cp .env.production .env
    echo "⚠️  IMPORTANTE: Actualizar .env con valores reales antes de iniciar"
fi

# 2. Instalar dependencias
echo ""
echo "📦 Instalando dependencias del backend..."
cd backend
npm install --only=production
cd ..

echo ""
echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install
cd ..

# 3. Crear directorios necesarios
echo ""
echo "📁 Creando directorios..."
mkdir -p backend/data
mkdir -p backend/temp/reportes
mkdir -p backend/public/reports

# 4. Inicializar datos si no existen
echo ""
echo "📊 Verificando datos iniciales..."
if [ ! -f "backend/data/users.json" ]; then
    echo "Creando users.json..."
    cat > backend/data/users.json << 'EOF'
[
  {
    "id": "admin-001",
    "nombre": "Administrador",
    "usuario": "admin",
    "password": "admin123",
    "role": "ADMIN",
    "diasDescanso": []
  }
]
EOF
fi

if [ ! -f "backend/data/config.json" ]; then
    echo "Creando config.json..."
    cat > backend/data/config.json << 'EOF'
{
  "vh": 15,
  "cf": 5,
  "margen": 0.3,
  "riesgo": 0.1,
  "garantia": 0.05
}
EOF
fi

if [ ! -f "backend/data/servicios.json" ]; then
    echo "Creando servicios.json..."
    echo "[]" > backend/data/servicios.json
fi

if [ ! -f "backend/data/diario.json" ]; then
    echo "Creando diario.json..."
    echo "[]" > backend/data/diario.json
fi

if [ ! -f "backend/data/inventario.json" ]; then
    echo "Creando inventario.json..."
    echo "[]" > backend/data/inventario.json
fi

if [ ! -f "backend/data/mensajes.json" ]; then
    echo "Creando mensajes.json..."
    echo "[]" > backend/data/mensajes.json
fi

if [ ! -f "backend/data/asistencia.json" ]; then
    echo "Creando asistencia.json..."
    echo "[]" > backend/data/asistencia.json
fi

# 5. Mostrar información de despliegue
echo ""
echo "✅ Despliegue preparado correctamente"
echo ""
echo "=========================================="
echo "PRÓXIMOS PASOS:"
echo "=========================================="
echo "1. Actualizar variables en .env:"
echo "   - SESSION_SECRET (generar valor seguro)"
echo "   - ALLOWED_ORIGINS (dominios permitidos)"
echo "   - API_BASE_URL, APP_BASE_URL (URLs de producción)"
echo ""
echo "2. Opción A - Ejecución directa:"
echo "   npm start"
echo ""
echo "2. Opción B - Con Docker:"
echo "   docker-compose up --build"
echo ""
echo "3. Verificar salud del servidor:"
echo "   curl http://localhost:3000/health"
echo ""
echo "=========================================="
