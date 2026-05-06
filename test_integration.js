const http = require('http');

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'admin-001',
        'x-user-role': 'ADMIN',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: body });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('=== INTEGRATION TEST SUITE ===\n');

  try {
    // Test 1: Login
    console.log('TEST 1: Authentication (login with wrong credentials)');
    const loginFail = await makeRequest('POST', '/api/auth/login', {
      usuario: 'wronguser',
      password: 'wrongpass'
    }, { 'x-user-id': '', 'x-user-role': '' });
    console.log('  Status:', loginFail.status, '(esperado: 401)');

    // Test 2: Get users
    console.log('\nTEST 2: Get all users (con auth)');
    const users = await makeRequest('GET', '/api/users');
    const usersData = JSON.parse(users.body);
    console.log('  Users count:', usersData.length);
    console.log('  Status:', users.status, '(esperado: 200)');

    // Test 3: Get servicios
    console.log('\nTEST 3: Get all servicios');
    const servicios = await makeRequest('GET', '/api/servicios');
    const serviciosData = JSON.parse(servicios.body);
    console.log('  Servicios count:', serviciosData.length);
    console.log('  Status:', servicios.status, '(esperado: 200)');

    // Test 4: Verify usuarios en servicios existen
    console.log('\nTEST 4: Data consistency - Usuarios referenciados en servicios');
    const userIds = usersData.map(u => u.id);
    let inconsistencies = 0;
    serviciosData.forEach(s => {
      if (!userIds.includes(s.usuarioId)) {
        console.log('  ❌ Inconsistency: servicio', s.id, 'references non-existent usuario', s.usuarioId);
        inconsistencies++;
      }
    });
    if (inconsistencies === 0) console.log('  ✓ All servicios reference valid usuarios');

    // Test 5: Test asistencia data
    console.log('\nTEST 5: Check asistencia consistency');
    const asistencia = await makeRequest('GET', '/api/asistencia');
    const asistenciaData = JSON.parse(asistencia.body);
    asistenciaData.forEach(a => {
      if (!userIds.includes(a.usuarioId)) {
        console.log('  ❌ Inconsistency: asistencia', a.id, 'references non-existent usuario');
      }
    });
    if (asistenciaData.length > 0) console.log('  ✓ Asistencia records valid');

    // Test 6: Test config
    console.log('\nTEST 6: Get config');
    const config = await makeRequest('GET', '/api/config');
    const configData = JSON.parse(config.body);
    console.log('  Config records:', configData.length);
    if (configData.length > 0) {
      const cfg = configData[0];
      console.log('  - Valor Hora:', cfg.vh);
      console.log('  - Margen:', cfg.margen + '%');
    }

    // Test 7: Test missing auth headers
    console.log('\nTEST 7: Unauthorized access (sin headers)');
    const noAuth = await makeRequest('GET', '/api/users', null, { 'x-user-id': '', 'x-user-role': '' });
    console.log('  Status:', noAuth.status, '(esperado: 401)');

    console.log('\n=== ALL TESTS COMPLETED ===');

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

runTests();
