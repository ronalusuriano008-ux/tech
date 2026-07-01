const fs = require('fs/promises');
const path = require('path');
const dataDir = path.join(__dirname, '..', 'data');
const diaryFile = path.join(dataDir, 'diario.json');

async function ensureDataDir() {
    try { await fs.access(dataDir); }
    catch { await fs.mkdir(dataDir, { recursive: true }); }
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

async function readDiary() {
    return await readJsonFile(diaryFile, {});
}

async function seedDiaryFile() {
    await ensureDataDir();
    try {
        await fs.access(diaryFile);
    } catch {
        await writeJsonFile(diaryFile, {});
    }
}

async function readMonth(year, month) {
    const diary = await readDiary();
    return diary[getMonthKey(year, month)] || { year, month, days: [] };
}

async function writeMonth(data) {
    const diary = await readDiary();
    const key = getMonthKey(data.year, data.month);
    diary[key] = data;
    await writeJsonFile(diaryFile, diary);
}

async function deleteMonth(year, month) {
    const diary = await readDiary();
    const key = getMonthKey(year, month);
    if (diary[key]) {
        delete diary[key];
        await writeJsonFile(diaryFile, diary);
    }
}

async function deleteDay(year, month, day) {
    const diary = await readDiary();
    const key = getMonthKey(year, month);
    const monthData = diary[key];
    if (!monthData || !Array.isArray(monthData.days)) return;
    const index = monthData.days.findIndex(d => d.day === day);
    if (index >= 0) {
        monthData.days.splice(index, 1);
        diary[key] = monthData;
        await writeJsonFile(diaryFile, diary);
    }
}

module.exports = { readDiary, seedDiaryFile, readMonth, writeMonth, deleteMonth, deleteDay };
