// backend/server.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/api');
const userRoutes = require('./routes/userRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const configRoutes = require('./routes/configRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const backupRoutes = require('./routes/backupRoutes');

const app = express();
const diaryDataPath = path.join(__dirname, 'data', 'diario.json');
app.use(session({
  secret: process.env.SESSION_SECRET || 'taller-tech-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,https://panel.vixbox.xyz,https://api.vixbox.xyz')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vixbox.xyz')) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role']
}));
app.options('*', cors());
app.use(express.json({ limit: '2mb' }));

// Rutas API
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/config', configRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/backup', backupRoutes);

app.get('/data/diario.json', (req, res) => {
  if (fs.existsSync(diaryDataPath)) {
    return res.sendFile(diaryDataPath);
  }
  return res.status(404).json({ error: 'diario.json no encontrado' });
});

app.get('/favicon.ico', (req, res) => {
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="12" fill="#0f172a"/>
    <path d="M18 16h28v10H28v8h14v10H18z" fill="#f8fafc"/>
  </svg>`;
  res.type('image/svg+xml').send(svgIcon);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'taller-tech', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'taller-tech', timestamp: new Date().toISOString() });
});

app.get('/api/config/runtime', (req, res) => {
  res.json({
    apiBaseUrl: process.env.API_BASE_URL || '/api',
    appBaseUrl: process.env.APP_BASE_URL || '',
    loginPath: '/login/index.html',
    dashboardPath: '/dashboard.html',
    adminPath: '/admin/index.html',
    registroPath: '/registro/index.html',
    calculadoraPath: '/calculadora/index.html',
    fillPath: '/fill.html',
    tablePath: '/table.html'
  });
});

const requireAuth = (req, res, next) => {
  if (req.session?.user) return next();
  return res.redirect('/login/index.html');
};

const requireAdmin = (req, res, next) => {
  if (req.session?.user?.role === 'ADMIN') return next();
  return res.status(403).send('Acceso denegado. Requiere rol de administrador.');
};

// Frontend público
app.get('/', (req, res) => {
  res.redirect('/login/index.html');
});

app.get('/index.html', (req, res) => {
  res.redirect('/login/index.html');
});

app.get('/login', (req, res) => {
  res.redirect('/login/index.html');
});

app.get('/login.html', (req, res) => {
  res.redirect('/login/index.html');
});

app.get('/dashboard', (req, res) => {
  res.redirect('/dashboard.html');
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'pages', 'dashboard.html'));
});

app.get('/fill.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'pages', 'fill.html'));
});

app.get('/table.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'pages', 'table.html'));
});

app.get('/admin', (req, res) => {
  res.redirect('/admin/index.html');
});

app.get('/admin-panel.html', (req, res) => {
  res.redirect('/admin/index.html');
});

app.get('/registro', (req, res) => {
  res.redirect('/registro/index.html');
});

app.get('/registro-servicios.html', (req, res) => {
  res.redirect('/registro/index.html');
});

app.get('/calculadora.html', (req, res) => {
  res.redirect('/calculadora/index.html');
});

app.get('/calculadora', (req, res) => {
  res.redirect('/calculadora/index.html');
});

app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));
app.use('/login', express.static(path.join(__dirname, '..', 'frontend', 'login')));
app.use('/admin', express.static(path.join(__dirname, '..', 'frontend', 'admin-panel')));
app.use('/calculadora', express.static(path.join(__dirname, '..', 'frontend', 'calculadora')));
app.use('/registro', express.static(path.join(__dirname, '..', 'frontend', 'registro-servicios')));

const PORT = Number(process.env.PORT || 3000);

// Interruptor de estado para apagado seguro
let isShuttingDown = false;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});

// Función de apagado controlado
const gracefulShutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[Interrupción] ${signal} recibido. Cerrando servidor de forma segura...`);
    
    server.close(() => {
        console.log('[Interrupción] Servidor cerrado correctamente.');
        process.exit(0);
    });

    // Forzar cierre después de 10 segundos si algo se queda colgado
    setTimeout(() => {
        console.error('[Interrupción] Forzando el cierre por timeout.');
        process.exit(1);
    }, 10000);
};

// Escuchar señales de terminación del sistema operativo (Ctrl+C o kill)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Capturar errores síncronos no controlados
process.on('uncaughtException', (err) => {
    console.error('[Error Crítico] Excepción no capturada:', err.message);
    gracefulShutdown('uncaughtException');
});

// Capturar promesas rechazadas sin catch
process.on('unhandledRejection', (reason) => {
    console.error('[Error Crítico] Promesa rechazada no manejada:', reason);
    gracefulShutdown('unhandledRejection');
});
