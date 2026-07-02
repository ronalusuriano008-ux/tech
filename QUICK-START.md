# 🚀 GUÍA RÁPIDA DE DESPLIEGUE

## 📦 Lo que se ha preparado

```
✅ Configuración de variables de entorno
✅ Scripts de inicialización 
✅ Dockerfile para contenedorización
✅ Docker Compose para orquestación
✅ Configuración de PM2 para Node.js
✅ Configuración de Nginx (ejemplo incluido)
✅ Guía completa de despliegue (DEPLOYMENT.md)
✅ Script de verificación pre-despliegue
✅ Scripts ejecutables para automatización
```

---

## ⚡ INICIO RÁPIDO (5 minutos)

### Opción 1: Ejecutar localmente
```bash
npm start
# Acceder a http://localhost:3000
```

### Opción 2: Con Docker
```bash
docker-compose up --build
# Acceder a http://localhost:3000
```

### Opción 3: Despliegue completo
```bash
./deploy.sh
npm start
```

---

## 📋 Comandos útiles

### Inicializar datos
```bash
npm run init
# o
./init-data.sh
```

### Verificar sistema antes de desplegar
```bash
./pre-deploy-check.sh
```

### Despliegue con Docker
```bash
npm run docker:up           # Iniciar
npm run docker:down         # Detener
npm run docker:logs         # Ver logs
npm run docker:status       # Estado
```

### Con PM2 (producción)
```bash
npm run pm2:start           # Iniciar
npm run pm2:restart         # Reiniciar
npm run pm2:logs            # Logs
npm run pm2:status          # Estado
```

### Verificar salud
```bash
npm run health
# o
curl http://localhost:3000/health
```

### Auditoría de seguridad
```bash
npm run audit               # Revisar vulnerabilidades
npm run audit:fix           # Intentar corregir
```

---

## 🔐 ANTES DE DESPLEGAR A PRODUCCIÓN

### 1. Configurar variables de entorno
```bash
# Editar .env con valores reales
nano .env

# Variables críticas:
SESSION_SECRET=<generar-valor-seguro-largo>
ALLOWED_ORIGINS=https://tu-dominio.com
API_BASE_URL=https://api.tu-dominio.com
APP_BASE_URL=https://app.tu-dominio.com
```

### 2. Generar SESSION_SECRET seguro
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Verificar seguridad
```bash
npm run audit              # Revisar vulnerabilidades
```

### 4. Verificar sistema
```bash
./pre-deploy-check.sh     # Debe pasar todo
```

---

## 📁 Estructura de despliegue

```
taller-tech/
├── .env                   # Variables de entorno (crear desde .env.example)
├── .env.example          # Variables de entorno ejemplo
├── .env.production       # Template para producción
├── Dockerfile            # Imagen Docker multi-etapa
├── docker-compose.yml    # Orquestación de contenedores
├── ecosystem.config.js   # Configuración PM2
├── nginx.conf.example    # Configuración Nginx (referencia)
├── 
├── deploy.sh            # Script de despliegue (bash)
├── deploy-docker.sh     # Script para Docker
├── init-data.sh         # Inicializar datos JSON
├── pre-deploy-check.sh  # Verificación pre-despliegue
│
├── DEPLOYMENT.md        # Guía completa (este archivo)
├── package.json         # Scripts npm útiles
│
├── backend/
│   ├── data/           # Archivos JSON (persistente)
│   ├── temp/           # Archivos temporales
│   └── server.js       # Servidor Express
│
└── frontend/
    ├── public/         # Archivos estáticos
    ├── login/          # Módulo de login
    ├── admin-panel/    # Panel de administrador
    ├── calculadora/    # Módulo calculadora
    └── registro-servicios/ # Módulo de servicios
```

---

## 🐳 Despliegue recomendado para producción

### 1. Usar Docker en un servidor VPS
```bash
# En el servidor:
git clone <repo> taller-tech
cd taller-tech
cp .env.production .env
nano .env  # Configurar valores reales

# Ejecutar con Docker Compose
docker-compose up -d

# Verificar
docker-compose ps
docker-compose logs -f
```

### 2. Configurar Nginx como proxy inverso
```bash
# Ver ejemplo en: nginx.conf.example
# Copiar a: /etc/nginx/sites-available/taller-tech
sudo cp nginx.conf.example /etc/nginx/sites-available/taller-tech
sudo ln -s /etc/nginx/sites-available/taller-tech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Configurar SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d tu-dominio.com
```

### 4. Backups automáticos
```bash
mkdir -p /home/usuario/backups
cat > /home/usuario/backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar -czf /home/usuario/backups/backup_$TIMESTAMP.tar.gz /home/usuario/taller-tech/backend/data/
find /home/usuario/backups -name "backup_*.tar.gz" -mtime +30 -delete
EOF

chmod +x /home/usuario/backup.sh
crontab -e
# Agregar: 0 2 * * * /home/usuario/backup.sh
```

---

## 📞 Solución rápida de problemas

### Puerto 3000 en uso
```bash
lsof -i :3000
kill -9 <PID>
```

### Permisos negados
```bash
sudo chown -R usuario:usuario /home/usuario/taller-tech
chmod -R 755 backend/data
```

### Errores de JSON
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('./backend/data/users.json')))"
```

### Ver logs
```bash
npm run pm2:logs
# o
docker-compose logs -f
# o
tail -f logs/out.log
```

---

## ✅ Checklist final

- [ ] `.env` configurado con valores reales
- [ ] `SESSION_SECRET` generado y único
- [ ] CORS configurado correctamente
- [ ] Datos iniciales creados
- [ ] Pre-deploy check pasado (`./pre-deploy-check.sh`)
- [ ] Seguridad auditada (`npm run audit`)
- [ ] Backups configurados
- [ ] Nginx configurado (para producción)
- [ ] SSL/TLS habilitado (para producción)
- [ ] Health check funcional (`curl http://localhost:3000/health`)

---

## 📚 Documentación

- **DEPLOYMENT.md** - Guía completa de despliegue
- **nginx.conf.example** - Configuración Nginx de referencia
- **.env.production** - Template de variables de producción
- **ecosystem.config.js** - Configuración PM2
- **Dockerfile** - Imagen Docker optimizada
- **docker-compose.yml** - Orquestación de contenedores

---

**Última actualización:** Julio 2026
**Estado:** ✅ Listo para despliegue
