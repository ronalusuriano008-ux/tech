const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSummaryItems } = require('../services/tiendaReportService');

test('buildSummaryItems usa únicamente los valores del resumen devuelto por el backend', () => {
  const monthResult = {
    resumen: {
      totalMes: 125.5,
      bancoDepositado: 30,
      saldoTienda: 95.5,
      saldoBanco: 40
    }
  };

  assert.deepEqual(buildSummaryItems(monthResult), [
    ['Total Mes', 125.5],
    ['Depósito Banco', 30],
    ['Acumulado Tienda', 95.5],
    ['Saldo Banco', 40]
  ]);
});
