const test = require('node:test');
const assert = require('node:assert/strict');
const { login, checkSession } = require('../controllers/authController');

test('login acepta username y password desde el frontend público', async () => {
  const req = { body: { username: 'admin', password: '1234' }, session: {} };
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

  await login(req, res);

  assert.equal(statusCode, undefined);
  assert.equal(payload.role, 'ADMIN');
  assert.equal(payload.nombre, 'Administrador');
  assert.equal(req.session.user.role, 'ADMIN');
});

test('checkSession devuelve false cuando no hay sesión activa', () => {
  const req = { session: {} };
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

  checkSession(req, res);

  assert.equal(statusCode, 401);
  assert.equal(payload.logged, false);
});
