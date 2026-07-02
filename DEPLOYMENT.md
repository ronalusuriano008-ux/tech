# 📋 GUÍA DE DESPLIEGUE - TALLER TECH

## 📌 Contenido

- [Requisitos](#requisitos)
- [Despliegue Local](#despliegue-local)
- [Despliegue con Docker](#despliegue-con-docker)
- [Despliegue en Servidor (VPS/Linux)](#despliegue-en-servidor)
- [Configuración de Seguridad](#configuración-de-seguridad)
- [Mantenimiento](#mantenimiento)
- [Solución de Problemas](#solución-de-problemas)

---

## 🔧 Requisitos

### Mínimos
- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **npm** 8+
- **Git**

### Para Producción (recomendado)
- **Docker** 20.10+
- **Docker Compose** 1.29+
- **Linux** (Ubuntu 20.04+ o similar)

---

## 🚀 Despliegue Local

### 1. Clonar el repositorio
```bash
git clone <tu-repo> taller-tech
cd taller-tech
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env según necesidades locales
```

### 3. Ejecutar script de despliegue
```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Iniciar la aplicación
```bash
npm start          # Producción
# o
npm run dev        # Desarrollo (con auto-reload)
```

### 5. Acceder a la aplicación
- Dashboard: http://localhost:3000/dashboard.html
- Admin: http://localhost:3000/admin/index.html
- Login: http://localhost:3000/login/index.html

---

## 🐳 Despliegue con Docker

### Requisitos previos
```bash
# Verificar Docker
docker --version
docker-compose --version
```

### Pasos

#### 1. Preparar configuración
```bash
cp .env.production .env
# Editar .env con valores reales:
# - SESSION_SECRET: generar valor seguro
# - ALLOWED_ORIGINS: dominios permitidos
# - API_BASE_URL, APP_BASE_URL: URLs de producción
```

#### 2. Iniciar con Docker Compose
```bash
chmod +x deploy-docker.sh
./deploy-docker.sh up
```

#### 3. Verificar estado
```bash
./deploy-docker.sh status
docker-compose logs -f
```

#### 4. Acceder
- La aplicación estará disponible en el puerto especificado en `.env` (default: 3000)

### Comandos útiles
```bash
# Ver logs
./deploy-docker.sh logs

# Reiniciar
./deploy-docker.sh restart

# Detener
./deploy-docker.sh down

# Realizar backup
./deploy-docker.sh backup

# Ver estado
./deploy-docker.sh status
```

---

## 🖥️ Despliegue en Servidor (VPS/Linux)

### 1. Preparación del servidor

#### SSH al servidor
```bash
ssh usuario@tu-servidor.com
```

#### Actualizar paquetes
```bash
sudo apt update && sudo apt upgrade -y
```

#### Instalar Node.js
```bash
# Opción 1: NodeSource (recomendado)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Opción 2: NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
```

#### Instalar Git y otras herramientas
```bash
sudo apt install -y git build-essential curl wget
```

### 2. Clonar repositorio
```bash
cd /home/usuario
git clone <tu-repo> taller-tech
cd taller-tech
```

### 3. Configurar aplicación
```bash
cp .env.production .env
nano .env  # Editar con valores reales
```

### 4. Instalar dependencias
```bash
cd backend
npm install --only=production
cd ..

cd frontend
npm install
cd ..
```

### 5. Crear directorios necesarios
```bash
mkdir -p backend/data backend/temp/reportes backend/public/reports
```

### 6. Inicializar datos
```bash
# Ejecutar el script de despliegue
chmod +x deploy.sh
./deploy.sh
```

### 7. Configurar PM2 (gestor de procesos)

#### Instalar PM2
```bash
npm install -g pm2
```

#### Crear configuración PM2
```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'taller-tech',
      script: './backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000
    }
  ]
};
EOF
```

#### Iniciar con PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Verificar estado
```bash
pm2 status
pm2 logs taller-tech
```

### 8. Configurar Nginx (servidor web reverso)

#### Instalar Nginx
```bash
sudo apt install -y nginx
```

#### Crear configuración
```bash
sudo cat > /etc/nginx/sites-available/taller-tech << 'EOF'
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

#### Habilitar sitio
```bash
sudo ln -s /etc/nginx/sites-available/taller-tech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Configurar SSL (Let's Encrypt)

#### Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### Generar certificado
```bash
sudo certbot certonly --nginx -d tu-dominio.com -d www.tu-dominio.com
```

---

## 🔒 Configuración de Seguridad

### 1. Variables de entorno críticas

```bash
# .env
SESSION_SECRET=generar_una_cadena_muy_larga_y_aleatoria_de_al_menos_32_caracteres

# Usar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. CORS - Restricciones

```bash
# .env
ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com
```

### 3. Headers de seguridad (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' cdn.jsdelivr.net;" always;
```

### 4. Firewall (UFW en Linux)

```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
```

### 5. Actualización de dependencias

```bash
# Revisar vulnerabilidades
npm audit
npm audit fix

# Mantener actualizado
npm update --save
```

---

## 🛠️ Mantenimiento

### Backups automáticos

#### Crear script de backup
```bash
mkdir -p /home/usuario/backups
cat > /home/usuario/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/usuario/backups"
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz /home/usuario/taller-tech/backend/data/
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete  # Eliminar backups >30 días
EOF

chmod +x /home/usuario/backup.sh
```

#### Programar con cron
```bash
crontab -e

# Agregar:
0 2 * * * /home/usuario/backup.sh  # Daily backup at 2 AM
```

### Monitoreo de logs

```bash
# Ver logs en tiempo real
pm2 logs taller-tech

# Ver logs específicos
tail -f logs/out.log
tail -f logs/err.log
```

### Limpieza de reportes temporales

```bash
# Script de limpieza
cat > /home/usuario/cleanup.sh << 'EOF'
#!/bin/bash
# Limpiar archivos temp > 7 días
find /home/usuario/taller-tech/backend/temp -type f -mtime +7 -delete
EOF

chmod +x /home/usuario/cleanup.sh
```

---

## 🐛 Solución de Problemas

### La aplicación no inicia

```bash
# Verificar sintaxis JSON en archivos de datos
node -e "console.log(JSON.parse(require('fs').readFileSync('./backend/data/users.json')))"

# Ver logs detallados
npm start  # Sin PM2 para ver errores en consola
```

### Puerto 3000 en uso

```bash
# Encontrar proceso
lsof -i :3000

# Liberar puerto (cambiar 1234 al PID)
kill -9 1234

# O cambiar puerto en .env
PORT=3001
```

### Errores de permisos

```bash
# Dar permisos al usuario
sudo chown -R usuario:usuario /home/usuario/taller-tech

# Permisos en directorios de datos
chmod -R 755 backend/data backend/temp
```

### Problemas con CORS

```bash
# Verificar ALLOWED_ORIGINS en .env
# Asegurarse que incluya el dominio del frontend

# Ejemplo correcto:
ALLOWED_ORIGINS=https://app.tu-dominio.com,https://tu-dominio.com
```

### Falta de memoria

```bash
# Aumentar límite en PM2
pm2 start ecosystem.config.js --max-memory-restart 1G

# O en Dockerfile
ENV NODE_OPTIONS=--max-old-space-size=1024
```

---

## 📞 Soporte

Para reportar problemas o sugerencias:
1. Verificar logs: `pm2 logs taller-tech`
2. Ejecutar health check: `curl http://localhost:3000/health`
3. Revisar documentación del proyecto

---

## ✅ Checklist de despliegue

- [ ] Node.js 18+ instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Directorios de datos creados
- [ ] Datos iniciales generados
- [ ] PM2 configurado (para producción)
- [ ] Nginx configurado (para producción)
- [ ] SSL/TLS configurado (para producción)
- [ ] Firewall configurado (para producción)
- [ ] Backups automáticos configurados
- [ ] Health check funcional
- [ ] Logs monitoreados

---

**Última actualización:** Julio 2026
**Versión:** 1.0
