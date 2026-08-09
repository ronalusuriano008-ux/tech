const path = require('path');

const backendPackage = require('./backend/package.json');

const config = {
  app: {
    name: 'Taller Tech',
    shortName: 'TallerTech',
    serviceName: 'taller-tech',
    version: process.env.APP_VERSION || backendPackage.version || '1.2.0',
    environment: process.env.NODE_ENV || 'development',
    timezone: 'America/Lima',
    locale: 'es-PE',
    currency: {
      code: 'PEN',
      symbol: 'S/.',
      decimals: 2,
      locale: 'es-PE'
    },
    dateFormats: {
      isoDate: 'YYYY-MM-DD',
      displayDate: 'es-PE',
      displayTime: 'es-PE',
      timeZone: 'America/Lima'
    },
    roles: {
      admin: 'ADMIN',
      technician: 'TECNICO'
    },
    paths: {
      login: '/login/index.html',
      dashboard: '/dashboard.html',
      admin: '/admin/index.html',
      registro: '/registro/index.html',
      calculadora: '/calculadora/index.html',
      fill: '/fill.html',
      table: '/table.html',
      tienda: '/pages/tienda.html'
    }
  },
  api: {
    baseUrl: process.env.API_BASE_URL || '/api',
    health: '/api/health',
    auth: '/api/auth',
    users: '/api/users',
    servicios: '/api/servicios',
    config: '/api/config',
    inventario: '/api/inventario',
    reportes: '/api/reportes',
    backup: '/api/backup',
    tienda: '/api/tienda'
  },
  session: {
    cookieName: 'tt.sid',
    ttlMs: 1000 * 60 * 60 * 8,
    secureInProduction: true,
    sameSite: 'lax'
  },
  http: {
    jsonBodyLimit: '2mb',
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  },
  server: {
    port: Number(process.env.PORT || 3000)
  },
  runtime: {
    frontendRoot: path.join(__dirname, 'frontend'),
    backendRoot: path.join(__dirname, 'backend'),
    publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000'
  }
};

module.exports = config;
module.exports.default = config;
