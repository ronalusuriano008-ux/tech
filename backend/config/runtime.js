const fs = require('fs');
const path = require('path');

function ensureApplicationRuntime(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..', '..');
  const backendRoot = path.join(rootDir, 'backend');
  const dataDir = path.join(backendRoot, 'data');
  const sessionsDir = path.join(dataDir, 'sessions');
  const tempDir = path.join(backendRoot, 'temp');
  const reportsDir = path.join(tempDir, 'reportes');
  const publicReportsDir = path.join(backendRoot, 'public', 'reports');

  for (const dir of [dataDir, sessionsDir, tempDir, reportsDir, publicReportsDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const seedFiles = {
    'users.json': [
      {
        id: 'admin-001',
        nombre: 'Administrador',
        usuario: 'admin',
        password: 'admin123',
        role: 'ADMIN',
        diasDescanso: []
      }
    ],
    'config.json': [
      {
        id: 'global',
        vh: 15,
        cf: 5,
        margen: 0.3,
        riesgo: 0.1,
        garantia: 0.05,
        glassTheme: false
      }
    ],
    'servicios.json': [],
    'inventario.json': [],
    'stdiario.json': {},
    'tdiario.json': {}
  };

  for (const [fileName, defaultValue] of Object.entries(seedFiles)) {
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    }
  }

  return {
    rootDir,
    backendRoot,
    dataDir,
    sessionsDir,
    tempDir,
    reportsDir,
    publicReportsDir
  };
}

module.exports = {
  ensureApplicationRuntime
};
