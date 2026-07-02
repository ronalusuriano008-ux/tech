#!/bin/bash

# =====================================================
# PRE-DEPLOYMENT VERIFICATION CHECKLIST
# =====================================================
# Ejecutar antes de desplegar: ./pre-deploy-check.sh

echo "=========================================="
echo "VERIFICACIÓN PRE-DESPLIEGUE"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

# 1. Verificar dependencias
echo "1️⃣  VERIFICANDO DEPENDENCIAS..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js instalado: $NODE_VERSION"
else
    check_fail "Node.js no está instalado"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm instalado: $NPM_VERSION"
else
    check_fail "npm no está instalado"
fi

# 2. Verificar archivos críticos
echo ""
echo "2️⃣  VERIFICANDO ARCHIVOS..."

REQUIRED_FILES=(
    ".env"
    "backend/package.json"
    "backend/server.js"
    "frontend/package.json"
    "package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "Archivo encontrado: $file"
    else
        check_fail "Archivo faltante: $file"
    fi
done

# 3. Verificar directorios
echo ""
echo "3️⃣  VERIFICANDO DIRECTORIOS..."

REQUIRED_DIRS=(
    "backend/data"
    "backend/temp"
    "backend/public"
    "frontend/public"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        check_pass "Directorio encontrado: $dir"
    else
        check_warn "Directorio faltante: $dir (se creará automáticamente)"
        mkdir -p "$dir"
    fi
done

# 4. Verificar variables de entorno
echo ""
echo "4️⃣  VERIFICANDO VARIABLES DE ENTORNO..."

if [ -f ".env" ]; then
    check_pass "Archivo .env existe"
    
    # Verificar variables críticas
    if grep -q "SESSION_SECRET" .env; then
        SECRET=$(grep SESSION_SECRET .env | cut -d '=' -f 2)
        if [ -z "$SECRET" ] || [ "$SECRET" = "cambiar-esto-por-una-cadena-segura-aleatorio-muy-larga" ]; then
            check_warn "SESSION_SECRET no configurado o es default"
        else
            check_pass "SESSION_SECRET configurado"
        fi
    else
        check_warn "SESSION_SECRET no especificado en .env"
    fi
    
    if grep -q "ALLOWED_ORIGINS" .env; then
        check_pass "ALLOWED_ORIGINS configurado"
    else
        check_warn "ALLOWED_ORIGINS no especificado"
    fi
else
    check_fail "Archivo .env no existe"
fi

# 5. Verificar datos iniciales
echo ""
echo "5️⃣  VERIFICANDO DATOS INICIALES..."

DATA_FILES=(
    "backend/data/users.json"
    "backend/data/config.json"
    "backend/data/servicios.json"
)

for file in "${DATA_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "Archivo de datos: $file"
    else
        check_warn "Archivo de datos faltante: $file"
    fi
done

# 6. Verificar JSON válido
echo ""
echo "6️⃣  VALIDANDO JSON..."

for file in backend/data/*.json; do
    if [ -f "$file" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('$file'))" 2>/dev/null; then
            check_pass "JSON válido: $(basename $file)"
        else
            check_fail "JSON inválido: $(basename $file)"
        fi
    fi
done

# 7. Verificar permisos
echo ""
echo "7️⃣  VERIFICANDO PERMISOS..."

SCRIPTS=(
    "deploy.sh"
    "deploy-docker.sh"
    "init-data.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -x "$script" ]; then
        check_pass "Script ejecutable: $script"
    else
        check_warn "Script no ejecutable: $script"
        chmod +x "$script"
    fi
done

# 8. Verificar tamaño de dependencias
echo ""
echo "8️⃣  ANALIZANDO DEPENDENCIAS..."

if [ -d "node_modules" ]; then
    SIZE=$(du -sh node_modules | cut -f1)
    check_pass "node_modules: $SIZE"
else
    check_warn "node_modules no instalado"
fi

if [ -d "backend/node_modules" ]; then
    SIZE=$(du -sh backend/node_modules | cut -f1)
    check_pass "backend/node_modules: $SIZE"
else
    check_warn "backend/node_modules no instalado"
fi

# 9. Verificar Git
echo ""
echo "9️⃣  VERIFICANDO GIT..."

if [ -d ".git" ]; then
    check_pass "Repositorio Git encontrado"
    
    STATUS=$(git status --porcelain)
    if [ -z "$STATUS" ]; then
        check_pass "Árbol Git limpio"
    else
        check_warn "Cambios sin confirmar en Git"
    fi
else
    check_warn "No es un repositorio Git"
fi

# 10. Verificar Docker (opcional)
echo ""
echo "🔟  VERIFICANDO DOCKER (OPCIONAL)..."

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    check_pass "Docker instalado: $DOCKER_VERSION"
    
    if command -v docker-compose &> /dev/null; then
        DC_VERSION=$(docker-compose --version)
        check_pass "Docker Compose instalado: $DC_VERSION"
    else
        check_warn "Docker Compose no instalado"
    fi
else
    check_warn "Docker no instalado (opcional para despliegue)"
fi

# 11. Verificar puertos
echo ""
echo "1️⃣1️⃣  VERIFICANDO PUERTOS..."

if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    check_pass "Puerto 3000 disponible"
else
    check_warn "Puerto 3000 está en uso"
fi

# Resumen
echo ""
echo "=========================================="
echo "RESUMEN"
echo "=========================================="
echo -e "Errores encontrados: ${RED}$ERRORS${NC}"
echo -e "Advertencias: ${YELLOW}$WARNINGS${NC}"

if [ $ERRORS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Sistema listo para despliegue${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Resolver errores antes de desplegar${NC}"
    exit 1
fi
