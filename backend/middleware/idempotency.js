const fs = require('fs/promises');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'idempotency.json');
let lock = Promise.resolve();

async function read() {
  try { return JSON.parse(await fs.readFile(filePath, 'utf8')); } catch { return {}; }
}
async function write(data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(data, null, 2));
  await fs.rename(temporary, filePath);
}

// Repetir un POST/PUT/DELETE tras recuperar conectividad devuelve el primer resultado,
// en vez de volver a ejecutar la mutación. Los registros expiran en 14 días.
async function idempotency(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const key = req.get('X-Operation-Id');
  if (!key || key.length > 120) return next();
  const operations = await read();
  const previous = operations[key];
  if (previous) return res.status(previous.status).json(previous.body);
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const status = res.statusCode;
    if (status < 500) {
      lock = lock.then(async () => {
        const all = await read();
        all[key] = { status, body, createdAt: Date.now() };
        const limit = Date.now() - 14 * 24 * 60 * 60 * 1000;
        Object.keys(all).forEach((id) => { if (all[id].createdAt < limit) delete all[id]; });
        await write(all);
      }).catch((error) => console.error('[idempotency]', error.message));
    }
    return originalJson(body);
  };
  next();
}

module.exports = { idempotency };
