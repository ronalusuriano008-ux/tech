const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

const stDiaryFile = path.join(dataDir, 'stdiario.json');
const tDiaryFile = path.join(dataDir, 'tdiario.json');

async function ensureDataDir() {
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

async function readJsonFile(filePath, defaultValue) {
    await ensureDataDir();

    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') return defaultValue;
        throw err;
    }
}

async function writeJsonFile(filePath, data) {
    await ensureDataDir();

    const tempPath = `${filePath}.tmp`;

    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tempPath, filePath);
}

const getMonthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

/* =====================================================
   SERVICIO TÉCNICO (stdiario.json)
===================================================== */

async function readDiary() {
    return await readJsonFile(stDiaryFile, {});
}

async function seedDiaryFile() {
    await ensureDataDir();

    try {
        await fs.access(stDiaryFile);
    } catch {
        await writeJsonFile(stDiaryFile, {});
    }
}

async function readMonth(year, month) {
    const diary = await readDiary();

    return diary[getMonthKey(year, month)] || {
        year,
        month,
        days: []
    };
}

async function writeMonth(data) {
    const diary = await readDiary();
    const key = getMonthKey(data.year, data.month);
    diary[key] = data;
    await writeJsonFile(stDiaryFile, diary);
}

async function deleteMonth(year, month) {
    const diary = await readDiary();
    const key = getMonthKey(year, month);

    if (diary[key]) {
        delete diary[key];
        await writeJsonFile(stDiaryFile, diary);
    }
}

async function deleteDay(year, month, day) {
    const diary = await readDiary();
    const key = getMonthKey(year, month);
    const monthData = diary[key];

    if (!monthData || !Array.isArray(monthData.days)) return;

    const index = monthData.days.findIndex((d) => d.day === day);

    if (index >= 0) {
        monthData.days.splice(index, 1);
        diary[key] = monthData;
        await writeJsonFile(stDiaryFile, diary);
    }
}

/* =====================================================
   TIENDAS (tdiario.json)
===================================================== */

async function readTDiary() {
    return await readJsonFile(tDiaryFile, {});
}

async function seedTDiaryFile() {
    await ensureDataDir();

    try {
        await fs.access(tDiaryFile);
    } catch {
        await writeJsonFile(tDiaryFile, {});
    }
}

async function readTMonth(year, month) {
    const diary = await readTDiary();

    return diary[getMonthKey(year, month)] || {
        year,
        month,
        days: []
    };
}

async function writeTMonth(data) {
    const diary = await readTDiary();
    const key = getMonthKey(data.year, data.month);
    diary[key] = data;
    await writeJsonFile(tDiaryFile, diary);
}

async function deleteTMonth(year, month) {
    const diary = await readTDiary();
    const key = getMonthKey(year, month);

    if (diary[key]) {
        delete diary[key];
        await writeJsonFile(tDiaryFile, diary);
    }
}

async function deleteTDay(year, month, day) {
    const diary = await readTDiary();
    const key = getMonthKey(year, month);
    const monthData = diary[key];

    if (!monthData || !Array.isArray(monthData.days)) return;

    const index = monthData.days.findIndex((d) => d.day === day);

    if (index >= 0) {
        monthData.days.splice(index, 1);
        diary[key] = monthData;
        await writeJsonFile(tDiaryFile, diary);
    }
}

module.exports = {
    readDiary,
    seedDiaryFile,
    readMonth,
    writeMonth,
    deleteMonth,
    deleteDay,
    readTDiary,
    seedTDiaryFile,
    readTMonth,
    writeTMonth,
    deleteTMonth,
    deleteTDay
};
