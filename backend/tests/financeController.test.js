const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { saveDay } = require('../controllers/financeController');

const diaryPath = path.join(__dirname, '..', 'data', 'stdiario.json');

test('saveDay normaliza y persiste los datos del día con valores numéricos', async () => {
  const originalDiary = await fs.readFile(diaryPath, 'utf8').catch(() => null);

  try {
    await fs.writeFile(diaryPath, JSON.stringify({
      '2026-07': {
        year: 2026,
        month: 7,
        days: []
      }
    }, null, 2));

    const req = {
      body: {
        year: '2026',
        month: '7',
        day: '3',
        st1: { cash: '12.5', yape: '4' },
        st2: { cash: '5.5', yape: '0' }
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

    await saveDay(req, res);

    assert.equal(statusCode, undefined);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.days[0].day, 'number');
    assert.equal(payload.data.days[0].day, 3);
    assert.equal(typeof payload.data.days[0].st1.cash, 'number');
    assert.equal(payload.data.days[0].st1.cash, 12.5);

    const savedDiary = JSON.parse(await fs.readFile(diaryPath, 'utf8'));
    assert.equal(savedDiary['2026-07'].days[0].day, 3);
    assert.equal(savedDiary['2026-07'].days[0].st1.cash, 12.5);
  } finally {
    if (originalDiary === null) {
      await fs.rm(diaryPath, { force: true });
    } else {
      await fs.writeFile(diaryPath, originalDiary);
    }
  }
});
