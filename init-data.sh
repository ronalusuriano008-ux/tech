#!/bin/bash

# =====================================================
# INICIALIZAR DATOS
# =====================================================
# Este script inicializa los archivos JSON necesarios

set -e

echo "Inicializando datos del sistema..."

mkdir -p backend/data

# Users
if [ ! -f "backend/data/users.json" ]; then
    echo "✓ Creando users.json"
    cat > backend/data/users.json << 'EOF'
[
  {
    "id": "admin-001",
    "nombre": "Administrador",
    "usuario": "admin",
    "password": "admin123",
    "role": "ADMIN",
    "diasDescanso": []
  },
  {
    "id": "tech-001",
    "nombre": "Técnico Demo",
    "usuario": "tecnico",
    "password": "tecnico123",
    "role": "TECNICO",
    "diasDescanso": []
  }
]
EOF
fi

# Config
if [ ! -f "backend/data/config.json" ]; then
    echo "✓ Creando config.json"
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

# Servicios
if [ ! -f "backend/data/servicios.json" ]; then
    echo "✓ Creando servicios.json"
    echo "[]" > backend/data/servicios.json
fi

# Diario
if [ ! -f "backend/data/diario.json" ]; then
    echo "✓ Creando diario.json"
    echo "[]" > backend/data/diario.json
fi

# Inventario
if [ ! -f "backend/data/inventario.json" ]; then
    echo "✓ Creando inventario.json"
    echo "[]" > backend/data/inventario.json
fi

# Mensajes
if [ ! -f "backend/data/mensajes.json" ]; then
    echo "✓ Creando mensajes.json"
    echo "[]" > backend/data/mensajes.json
fi

# Asistencia
if [ ! -f "backend/data/asistencia.json" ]; then
    echo "✓ Creando asistencia.json"
    echo "[]" > backend/data/asistencia.json
fi

echo ""
echo "✅ Datos inicializados correctamente"
echo ""
echo "Credenciales por defecto:"
echo "Admin: usuario=admin, password=admin123"
echo "Técnico: usuario=tecnico, password=tecnico123"
