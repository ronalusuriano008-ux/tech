const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');
const { recalculateMonth, saveDay } = require('../services/tiendaService');

const dataFilePath = path.join(__dirname, '..', 'data', 'tdiario.json');

async function withFixture(monthPayload, callback) {
  const originalContent = await fs.readFile(dataFilePath, 'utf8');

  try {
    await fs.writeFile(dataFilePath, JSON.stringify({ '2026-08': monthPayload }, null, 2));
    return await callback();
  } finally {
    await fs.writeFile(dataFilePath, originalContent);
  }
}

test('recalculateMonth calcula acumuladoTienda con la regla real del negocio', async () => {
  await withFixture(
    {
      year: 2026,
      month: 8,
      days: [
        {
          day: 1,
          tienda1: 450,
          tienda2: 550,
          tienda3: 0,
          bancoDepositado: 0
        },
        {
          day: 2,
          tienda1: 300,
          tienda2: 200,
          tienda3: 0,
          bancoDepositado: 300
        }
      ]
    },
      async () => {
        const result = await recalculateMonth(2026, 8);
        // ahora result tiene la forma { resumen, dias }
        const firstDay = result.dias.find((day) => day.day === 1);
        const secondDay = result.dias.find((day) => day.day === 2);

        assert.equal(firstDay.totalDiario, 1000);
        assert.equal(firstDay.bancoDepositado, 0);
        assert.equal(firstDay.acumuladoTienda, 1000);
        assert.equal(firstDay.disponible, 1000);

        assert.equal(secondDay.totalDiario, 500);
        assert.equal(secondDay.bancoDepositado, 300);
        assert.equal(secondDay.acumuladoTienda, 1000 + 500 - 300);
        assert.equal(secondDay.disponible, 1000 + 500 - 300);
      }
  );
});

test('saveDay persiste los datos del día y recalcula el saldo con los valores reales', async () => {
  await withFixture(
    {
      year: 2026,
      month: 8,
      days: []
    },
    async () => {
      const result = await saveDay(2026, 8, {
        day: 3,
        tienda1: 400,
        tienda2: 100,
        tienda3: 0,
        bancoDepositado: 150
      });

      const savedDay = result.dias.find((day) => day.day === 3);

      assert.equal(savedDay.totalDiario, 500);
      assert.equal(savedDay.bancoDepositado, 150);
      assert.equal(savedDay.acumuladoTienda, 500 - 150);
      assert.equal(savedDay.disponible, 500 - 150);

      const persisted = JSON.parse(await fs.readFile(dataFilePath, 'utf8'));
      assert.ok(persisted['2026-08']);
      const raw = persisted['2026-08'].days[0];
      assert.equal(raw.day, 3);
      assert.equal(typeof raw.bancoDepositado !== 'undefined', true);
      // Asegurarse que solo se persistieron movimientos (sin campos calculados)
      assert.equal(typeof raw.totalDiario, 'undefined');
      assert.equal(typeof raw.acumuladoTienda, 'undefined');
    }
  );
});
