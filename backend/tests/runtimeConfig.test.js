const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ensureApplicationRuntime } = require('../config/runtime');

test('ensureApplicationRuntime crea los archivos base y directorios requeridos', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tech-runtime-'));

  const result = ensureApplicationRuntime({ rootDir: tempRoot });

  assert.equal(result.dataDir, path.join(tempRoot, 'backend', 'data'));
  assert.ok(fs.existsSync(path.join(tempRoot, 'backend', 'data', 'users.json')));
  assert.ok(fs.existsSync(path.join(tempRoot, 'backend', 'data', 'config.json')));
  assert.ok(fs.existsSync(path.join(tempRoot, 'backend', 'data', 'stdiario.json')));
  assert.ok(fs.existsSync(path.join(tempRoot, 'backend', 'data', 'sessions')));
});
