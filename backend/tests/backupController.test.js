const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { importBackup } = require('../controllers/backupController');

const dataDir = path.join(__dirname, '..', 'data');
const files = ['users.json', 'servicios.json', 'inventario.json', 'config.json'];

async function readFileSafe(fileName) {
  try {
    return await fs.readFile(path.join(dataDir, fileName), 'utf8');
  } catch {
    return null;
  }
}

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
