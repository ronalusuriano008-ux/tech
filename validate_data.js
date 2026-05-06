const fs = require('fs');
const path = require('path');

const dataDir = './backend/data';

// Load all JSON files
const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json')));
const servicios = JSON.parse(fs.readFileSync(path.join(dataDir, 'servicios.json')));
const asistencia = JSON.parse(fs.readFileSync(path.join(dataDir, 'asistencia.json')));
const config = JSON.parse(fs.readFileSync(path.join(dataDir, 'config.json')));
const inventario = JSON.parse(fs.readFileSync(path.join(dataDir, 'inventario.json')));
const mensajes = JSON.parse(fs.readFileSync(path.join(dataDir, 'mensajes.json')));

console.log('=== DATA CONSISTENCY VALIDATION ===\n');

// Validate users
console.log('✓ Users file: ' + users.length + ' records');
users.forEach(u => {
  if (!u.id || !u.usuario) console.log('  ❌ Missing required fields:', u);
});

// Validate servicios and cross-references
console.log('✓ Servicios file: ' + servicios.length + ' records');
const userIds = new Set(users.map(u => u.id));
servicios.forEach(s => {
  if (!userIds.has(s.usuarioId)) console.log('  ❌ Servicios referencias usuarioId inválido:', s.usuarioId);
  if (!s.id || !s.precio) console.log('  ❌ Missing required fields:', s);
});

// Validate asistencia and cross-references
console.log('✓ Asistencia file: ' + asistencia.length + ' records');
asistencia.forEach(a => {
  if (!userIds.has(a.usuarioId)) console.log('  ❌ Asistencia referencias usuarioId inválido:', a.usuarioId);
  if (!a.id || !a.fecha) console.log('  ❌ Missing required fields:', a);
});

// Validate config
console.log('✓ Config file: ' + config.length + ' records');
config.forEach(c => {
  if (typeof c.vh !== 'number') console.log('  ❌ Config vh debe ser número');
});

// Validate inventario
console.log('✓ Inventario file: ' + inventario.length + ' records (está vacío - esto es normal)');

// Validate mensajes
console.log('✓ Mensajes file: ' + mensajes.length + ' records (está vacío - esto es normal)');

console.log('\n=== VALIDACIÓN COMPLETADA ===');
