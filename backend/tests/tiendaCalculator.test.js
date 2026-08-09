const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularEstadoFinanciero } = require('../services/tiendaCalculator');

test('calcularEstadoFinanciero aplica reglas básicas del negocio', () => {
  const monthPayload = {
    year: 2026,
    month: 8,
    days: [
      { day: 1, tienda1: 400, tienda2: 200, tienda3: 0, bancoDepositado: 0, retiroTienda: 0, retiroBanco: 0 },
      { day: 2, tienda1: 300, tienda2: 200, tienda3: 0, bancoDepositado: 300, retiroTienda: 0, retiroBanco: 0 }
    ]
  };

  const result = calcularEstadoFinanciero(monthPayload, { initialAcumuladoTienda: 0, initialSaldoBanco: 0 });

  const d1 = result.dias.find(d => d.day === 1);
  const d2 = result.dias.find(d => d.day === 2);

  assert.equal(d1.totalDiario, 600);
  assert.equal(d1.acumuladoTienda, 600);

  assert.equal(d2.totalDiario, 500);
  assert.equal(d2.acumuladoTienda, 600 + 500 - 300);
});
