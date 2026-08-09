// backend/server.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const appConfig = require('../config');

// Importar el almacenamiento de sesiones en disco
const FileStore = require('session-file-store')(session);

const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/api');
const userRoutes = require('./routes/userRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const configRoutes = require('./routes/configRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const backupRoutes = require('./routes/backupRoutes');
const tiendaRoutes = require('./routes/tiendaRoutes');
const { idempotency } = require('./middleware/idempotency');

const app = express();

// ─────────────────────────────────────────────
// Configuración de entorno
// ─────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

const { ensureApplicationRuntime } = require('./config/runtime');
const { getRuntimeConfig } = require('./config/app');

ensureApplicationRuntime();

// Necesario para que express respete X-Forwarded-Proto (HTTPS detrás de proxy)
app.set('trust proxy', 1);

const diaryDataPath = path.join(__dirname, 'data', 'stdiario.json');
const frontendRoot = path.join(__dirname, '..', 'frontend');
const sharedRoot = path.join(frontendRoot, 'shared');
const authenticationRoot = path.join(frontendRoot, 'modules', 'authentication');
const adminPanelRoot = path.join(frontendRoot, 'modules', 'admin-panel');
const registroServiciosRoot = path.join(frontendRoot, 'modules', 'registro-servicios');
const calculadoraRoot = path.join(frontendRoot, 'modules', 'servicio-tecnico', 'calculadora');
const servicioTecnicoPagesRoot = path.join(frontendRoot, 'modules', 'servicio-tecnico', 'pages');
const servicioTecnicoJsRoot = path.join(frontendRoot, 'modules', 'servicio-tecnico', 'js');
const tiendaPagesRoot = path.join(frontendRoot, 'modules', 'tienda', 'pages');
const tiendaJsRoot = path.join(frontendRoot, 'modules', 'tienda', 'js');

// ─────────────────────────────────────────────
// Sesión persistente con cookies seguras
// ─────────────────────────────────────────────
const sessionDir = path.join(__dirname, 'data', 'sessions');
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

app.use(session({
    name: appConfig.session.cookieName,
    secret: process.env.SESSION_SECRET || 'taller-tech-secret',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new FileStore({
        path: sessionDir,
        retries: 0,
        logFn: () => {}
    }),
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: appConfig.session.sameSite,
        maxAge: appConfig.session.ttlMs,
        path: '/'
    }
}));

app.use((req, res, next) => {
    if (!req.session?.cookie) return next();

    const requestIsSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    if (isProduction && requestIsSecure) {
        req.session.cookie.secure = true;
        req.session.cookie.sameSite = 'none';
    } else {
        req.session.cookie.secure = false;
        req.session.cookie.sameSite = 'lax';
    }

    next();
});

// ─────────────────────────────────────────────
// CORS con credentials para cookies cross-origin
// ─────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,https://panel.vixbox.xyz,https://beta.vixbox.xyz,https://api.vixbox.xyz,https://unmended-lacey-nondefinitively.ngrok-free.dev')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedVixboxSubdomain = (origin) => {
  try {
    const url = new URL(origin);
    return url.hostname === 'vixbox.xyz' || url.hostname.endsWith('.vixbox.xyz');
  } catch {
    return false;
  }
};

const isAllowedNgrokSubdomain = (origin) => {
  try {
    const url = new URL(origin);
    return url.hostname === 'ngrok-free.dev' || url.hostname.endsWith('.ngrok-free.dev');
  } catch {
    return false;
  }
};

app.use(cors({
  origin(origin, callback) {
    const normalizedOrigin = origin?.trim();
    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin) || isAllowedVixboxSubdomain(normalizedOrigin) || isAllowedNgrokSubdomain(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por CORS: ' + origin));
  },
  credentials: true, // CRÍTICO: Permite que el navegador envíe cookies cross-origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role']
}));

app.options('*', cors()); // Preflight para todas las rutas
app.use(express.json({ limit: appConfig.http.jsonBodyLimit }));
app.use('/api', idempotency);

// ... (EL RESTO DEL CÓDIGO PERMANECE IGUAL QUE EN LA RESPUESTA ANTERIOR) ...

const configService = require('./services/configService');

// ─────────────────────────────────────────────
// Helpers para distinguir peticiones API vs navegación
// ─────────────────────────────────────────────
const wantsJson = (req) => {
  return (
    req.path.startsWith('/api/') ||
    req.xhr === true ||
    (req.headers.accept || '').includes('application/json')
  );
};

// ─────────────────────────────────────────────
// Middlewares de autorización corregidos
// ─────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  if (req.session?.user) return next();

  // Peticiones API / fetch: devolver 401 JSON
  if (wantsJson(req)) {
    return res.status(401).json({
      error: 'No autenticado',
      code: 'UNAUTHENTICATED',
      redirect: '/login/index.html'
    });
  }

  // Navegación directa: redirigir al login
  return res.redirect(302, '/login/index.html');
};

const requireAdmin = (req, res, next) => {
  // Si no hay sesión, redirigir o 401
  if (!req.session?.user) {
    if (wantsJson(req)) {
      return res.status(401).json({
        error: 'No autenticado',
        code: 'UNAUTHENTICATED',
        redirect: '/login/index.html'
      });
    }
    return res.redirect(302, '/login/index.html');
  }

  const role = req.session.user.role;
  console.log('Usuario sesión:', req.session.user.username, '| Rol:', role);

  if (role === 'ADMIN') return next();

  // Autenticado pero sin permisos
  if (wantsJson(req)) {
    return res.status(403).json({
      error: 'Acceso denegado: se requiere rol ADMIN',
      code: 'FORBIDDEN',
      role: role
    });
  }

  return res.status(403).send(`
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><title>Acceso denegado</title></head>
    <body>
      <h2>Acceso denegado</h2>
      <p>No tienes permisos de administrador.</p>
      <p>Rol actual: <strong>${role}</strong></p>
      <a href="/dashboard.html">Volver al panel</a>
    </body>
    </html>
  `);
};

// ─────────────────────────────────────────────
// Rutas que requieren protección antes del middleware de tema
// Bloquear acceso directo a HTML protegidos vía rutas internas
// ─────────────────────────────────────────────
const protectedHtmlPaths = [
  '/pages/dashboard.html',
  '/pages/fill.html',
  '/pages/table.html',
  '/pages/tienda.html'
];

// Middleware: bloquear acceso directo a HTML protegidos vía tema/static
app.use((req, res, next) => {
  if (req.method === 'GET' && protectedHtmlPaths.includes(req.path)) {
    // Estas rutas se manejan explícitamente más abajo con requireAuth/requireAdmin
    // Si llegan aquí, dejar que continúen a los manejadores explícitos
    return next();
  }
  next();
});

// ─────────────────────────────────────────────
// Middleware para inyectar clase glass-theme en HTML servidos
// ─────────────────────────────────────────────
app.use(async (req, res, next) => {
  try {
    if (req.method !== 'GET') return next();

    const acceptHtml = (req.headers.accept || '').includes('text/html');
    if (!acceptHtml && !req.path.endsWith('.html')) return next();

    // No interceptar rutas protegidas — las manejan sus route handlers
    if (protectedHtmlPaths.includes(req.path)) return next();

    const frontendRoot = path.join(__dirname, '..', 'frontend');
    const candidatePaths = [
      path.join(frontendRoot, 'public', req.path),
      path.join(frontendRoot, req.path),
      path.join(frontendRoot, req.path.replace(/^\//, ''))
    ];

    let filePath = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile() && p.endsWith('.html')) {
        filePath = p;
        break;
      }
    }
    if (!filePath) return next();

    const config = await configService.getConfig();
    let html = fs.readFileSync(filePath, 'utf-8');

    if (config && config.glassTheme) {
      html = html.replace(/<html(.*?)>/i, (m, g1) => {
        if (/class=["'].*glass-theme.*["']/.test(g1)) return m;
        if (/class=["'](.*?)"/.test(g1)) {
          return `<html class="$1 glass-theme"${g1.replace(/class=["'](.*?)"/, '')}>`;
        }
        return `<html${g1} class="glass-theme">`;
      });
    }

    res.type('html').send(html);
  } catch (err) {
    console.error('[theme-middleware] Error procesando HTML:', err.message);
    next();
  }
});

// ─────────────────────────────────────────────
// Rutas API
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/config', configRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/tienda', requireAdmin, tiendaRoutes);

// Datos de diario protegidos por auth
app.get('/data/stdiario.json', requireAuth, (req, res) => {
  if (fs.existsSync(diaryDataPath)) {
    return res.sendFile(diaryDataPath);
  }
  return res.status(404).json({ error: 'stdiario.json no encontrado' });
});

// ─────────────────────────────────────────────
// Favicon (SVG inline)
// ─────────────────────────────────────────────
app.get('/favicon.ico', (req, res) => {
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="tGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#3b82f6"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.4"/>
      </filter>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#bgGrad)" stroke="#334155" stroke-width="1.5"/>
    <path d="M14 18 L50 18 L50 27 L38.5 27 L38.5 49 L25.5 49 L25.5 27 L14 27 Z" fill="url(#tGrad)" filter="url(#shadow)"/>
  </svg>`;
  res.type('image/svg+xml').send(svgIcon);
});

// ─────────────────────────────────────────────
// Health checks
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: appConfig.app.serviceName, timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: appConfig.app.serviceName, timestamp: new Date().toISOString() });
});

app.get('/api/config/runtime', (req, res) => {
  res.json(getRuntimeConfig());
});

// ─────────────────────────────────────────────
// Redirecciones de rutas públicas
// ─────────────────────────────────────────────
app.get('/', (req, res) => res.redirect(302, '/login/index.html'));
app.get('/index.html', (req, res) => res.redirect(302, '/login/index.html'));
app.get('/login', (req, res) => res.redirect(302, '/login/index.html'));
app.get('/login.html', (req, res) => res.redirect(302, '/login/index.html'));
app.get('/dashboard', requireAuth, (req, res) => res.redirect(302, '/dashboard.html'));
app.get('/tienda', requireAdmin, (req, res) => res.redirect(302, '/pages/tienda.html'));

// ─────────────────────────────────────────────
// Rutas HTML protegidas por autenticación
// ─────────────────────────────────────────────
app.get('/dashboard.html', requireAuth, (req, res) => {
  res.sendFile(path.join(servicioTecnicoPagesRoot, 'dashboard.html'));
});

app.get('/fill.html', requireAuth, (req, res) => {
  res.sendFile(path.join(servicioTecnicoPagesRoot, 'fill.html'));
});

app.get('/table.html', requireAuth, (req, res) => {
  res.sendFile(path.join(servicioTecnicoPagesRoot, 'table.html'));
});

// Tienda protegida solo para ADMIN
app.get('/pages/tienda.html', requireAdmin, async (req, res) => {
  console.log('ENTRANDO A TIENDA:', req.session.user.username, '|', req.session.user.role);
  try {
    const filePath = path.join(tiendaPagesRoot, 'tienda.html');
    let html = fs.readFileSync(filePath, 'utf8');

    const config = await configService.getConfig();

    if (config?.glassTheme) {
      html = html.replace(/<html(.*?)>/i, (m, g1) => {
        if (/class=["'].*glass-theme.*["']/.test(g1)) return m;
        if (/class=["'](.*?)"/.test(g1)) {
          return `<html class="$1 glass-theme"${g1.replace(/class=["'](.*?)"/, '')}>`;
        }
        return `<html${g1} class="glass-theme">`;
      });
    }

    res.type('html').send(html);
  } catch (error) {
    console.error('[tienda.html]', error.message);
    res.status(500).send('Error cargando tienda');
  }
});

// ─────────────────────────────────────────────
// Más redirecciones
// ─────────────────────────────────────────────
app.get('/admin', (req, res) => res.redirect(302, '/admin/index.html'));
app.get('/admin-panel.html', (req, res) => res.redirect(302, '/admin/index.html'));
app.get('/registro', (req, res) => res.redirect(302, '/registro/index.html'));
app.get('/registro-servicios.html', (req, res) => res.redirect(302, '/registro/index.html'));
app.get('/calculadora.html', (req, res) => res.redirect(302, '/calculadora/index.html'));
app.get('/calculadora', (req, res) => res.redirect(302, '/calculadora/index.html'));

// ─────────────────────────────────────────────
// Servir archivos estáticos con rutas explícitas
// sin búsqueda por coincidencia ni aliases de compatibilidad
// ─────────────────────────────────────────────
const staticCache = { maxAge: isProduction ? '7d' : 0, etag: true, lastModified: true };
app.use('/shared', express.static(sharedRoot, staticCache));
app.use('/modules', express.static(path.join(frontendRoot, 'modules'), staticCache));
app.use('/login', express.static(authenticationRoot));
app.use('/admin', express.static(adminPanelRoot));
app.use('/calculadora', express.static(calculadoraRoot));
app.use('/registro', express.static(registroServiciosRoot));
app.use('/servicio-tecnico', express.static(servicioTecnicoPagesRoot));
app.use('/tienda', express.static(tiendaPagesRoot));

app.get('/manifest.json', (req, res) => res.sendFile(path.join(sharedRoot, 'manifest.json')));
app.get('/sw.js', (req, res) => res.sendFile(path.join(sharedRoot, 'sw.js')));
app.get('/offline.html', (req, res) => res.sendFile(path.join(sharedRoot, 'offline.html')));

// ─────────────────────────────────────────────
// Iniciar servidor
// ─────────────────────────────────────────────
const PORT = Number(process.env.PORT || appConfig.server.port);

let isShuttingDown = false;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT} (${isProduction ? 'producción' : 'desarrollo'})`);
});

// Apagado controlado
const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[Interrupción] ${signal} recibido. Cerrando servidor...`);

  server.close(() => {
    console.log('[Interrupción] Servidor cerrado correctamente.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Interrupción] Forzando cierre por timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('[Error Crítico] Excepción no capturada:', err.message);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('[Error Crítico] Promesa rechazada no manejada:', reason);
  gracefulShutdown('unhandledRejection');
});
