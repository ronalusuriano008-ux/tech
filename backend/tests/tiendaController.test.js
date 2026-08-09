const test = require('node:test');
const assert = require('node:assert/strict');
const { buildMonthlySummary } = require('../controllers/tiendaController');

test('buildMonthlySummary usa el último registro para acumulado y disponible', () => {
  const summary = buildMonthlySummary([
    {
      day: 1,
      totalDiario: 1000,
      bancoDepositado: 0,
      acumuladoTienda: 700
    },
    {
      day: 2,
      totalDiario: 1000,
      bancoDepositado: 0,
      acumuladoTienda: 1400
    }
  ]);

  assert.equal(summary.totalMes, 2000);
  assert.equal(summary.banco, 0);
  assert.equal(summary.bancoDepositado, 0);
  assert.equal(summary.acumulado, 1400);
  assert.equal(summary.promedioDiario, 1000);
});
