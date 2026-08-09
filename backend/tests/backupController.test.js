const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { exportBackup, importBackup } = require('../controllers/backupController');

const dataDir = path.join(__dirname, '..', 'data');
const files = ['users.json', 'servicios.json', 'inventario.json', 'config.json'];

async function readFileSafe(fileName) {
  try {
    return await fs.readFile(path.join(dataDir, fileName), 'utf8');
  } catch {
    return null;
  }
}

test('exportBackup incluye todos los JSON presentes en la carpeta de datos', async () => {
  const originals = {};
  const extraFiles = ['stdiario.json', 'tdiario.json'];

  for (const file of extraFiles) {
    try {
      originals[file] = await fs.readFile(path.join(dataDir, file), 'utf8');
    } catch {
      originals[file] = null;
    }
  }

  try {
    await fs.writeFile(path.join(dataDir, 'stdiario.json'), JSON.stringify({ '2026-08': { year: 2026, month: 8, days: [] } }, null, 2));
    await fs.writeFile(path.join(dataDir, 'tdiario.json'), JSON.stringify({ '2026-08': { year: 2026, month: 8, days: [] } }, null, 2));

    const payload = await new Promise((resolve, reject) => {
      const res = {
        status(code) { this.statusCode = code; return this; },
        json(data) { resolve(data); }
      };
      exportBackup({}, res).catch(reject);
    });

    assert.ok(payload.stdiario);
    assert.ok(payload.tdiario);
  } finally {
    for (const [file, content] of Object.entries(originals)) {
      if (content === null) {
        await fs.rm(path.join(dataDir, file), { force: true });
      } else {
        await fs.writeFile(path.join(dataDir, file), content);
      }
    }
  }
});

test('importBackup acepta backups anidados bajo data y restaura colecciones disponibles', async () => {
  const originals = {};
  for (const file of files) {
    originals[file] = await readFileSafe(file);
  }

  try {
    const req = {
      body: {
        data: {
          users: [{ id: 'u-test', nombre: 'Test', usuario: 'test', password: '1234', role: 'TECNICO' }],
          servicios: [{ id: 's-test', nombre: 'Servicio test' }],
          inventario: [{ id: 'i-test', nombre: 'Producto test' }],
          config: [{ id: 'global', vh: 1, cf: 2, margen: 3, riesgo: 4, garantia: 5 }]
        }
      }
    };

    let statusCode;
    let payload;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        payload = data;
      }
    };

    await importBackup(req, res);

    assert.equal(statusCode, undefined);
    assert.equal(payload.message, 'Backup restaurado correctamente');

    const users = JSON.parse(await fs.readFile(path.join(dataDir, 'users.json'), 'utf8'));
    assert.equal(users[0].usuario, 'test');
  } finally {
    for (const [file, content] of Object.entries(originals)) {
      if (content === null) {
        await fs.rm(path.join(dataDir, file), { force: true });
      } else {
        await fs.writeFile(path.join(dataDir, file), content);
      }
    }
  }
});

test('importBackup restaura también archivos de backup de diario', async () => {
  const originals = {};
  const extraFiles = ['stdiario.json', 'tdiario.json'];
  for (const file of extraFiles) {
    originals[file] = await readFileSafe(file);
  }

  try {
    const req = {
      body: {
        data: {
          stdiario: { '2026-08': { year: 2026, month: 8, days: [] } },
          tdiario: { '2026-08': { year: 2026, month: 8, days: [] } }
        }
      }
    };

    let payload;
    const res = {
      status() { return this; },
      json(data) { payload = data; }
    };

    await importBackup(req, res);

    assert.equal(payload.message, 'Backup restaurado correctamente');

    const stdiario = JSON.parse(await fs.readFile(path.join(dataDir, 'stdiario.json'), 'utf8'));
    const tdiario = JSON.parse(await fs.readFile(path.join(dataDir, 'tdiario.json'), 'utf8'));

    assert.equal(stdiario['2026-08'].month, 8);
    assert.equal(tdiario['2026-08'].month, 8);
  } finally {
    for (const [file, content] of Object.entries(originals)) {
      if (content === null) {
        await fs.rm(path.join(dataDir, file), { force: true });
      } else {
        await fs.writeFile(path.join(dataDir, file), content);
      }
    }
  }
});
