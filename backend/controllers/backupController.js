// backend/controllers/backupController.js

const fs = require('fs').promises;
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');

const DEFAULT_COLLECTIONS = {
    users: ['users', 'user', 'usuarios', 'usuario'],
    servicios: ['servicios', 'servicio', 'services'],
    inventario: ['inventario', 'inventarioItems', 'items', 'productos'],
    config: ['config', 'configuration', 'configuracion', 'settings'],
    stdiario: ['stdiario', 'diarioTecnico', 'tecnicoDiary'],
    tdiario: ['tdiario', 'diarioTiendas', 'tiendaDiary']
};

const getDataFiles = async () => {
    const entries = await fs.readdir(DB_DIR, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name.replace(/\.json$/, ''))
        .sort();
};

// EXPORTAR BACKUP COMPLETO
const exportBackup = async (req, res) => {
    try {
        const backup = {};
        const files = await getDataFiles();

        for (const file of files) {
            const filePath = path.join(DB_DIR, `${file}.json`);
            const content = await fs.readFile(filePath, 'utf-8');
            backup[file] = JSON.parse(content);
        }

        res.json(backup);

    } catch (error) {
        console.error('Error exportando backup:', error);
        res.status(500).json({
            error: 'Error al exportar backup'
        });
    }
};

const normalizeBackupData = (backupData = {}) => {
    const sources = [];

    if (backupData && typeof backupData === 'object') {
        if (backupData.data && typeof backupData.data === 'object') {
            sources.push(backupData.data);
        }
        if (backupData.collections && typeof backupData.collections === 'object') {
            sources.push(backupData.collections);
        }
        sources.push(backupData);
    }

    const aliasesByCollection = DEFAULT_COLLECTIONS;

    const normalized = {};

    for (const [collectionName, aliases] of Object.entries(aliasesByCollection)) {
        const source = sources.find((candidate) =>
            candidate && typeof candidate === 'object' && aliases.some((alias) => alias in candidate)
        );

        if (source) {
            const alias = aliases.find((candidate) => candidate in source);
            normalized[collectionName] = source[alias];
        }
    }

    return normalized;
};

// IMPORTAR BACKUP COMPLETO
const importBackup = async (req, res) => {
    try {
        const backupData = req.body || {};
        const normalizedBackup = normalizeBackupData(backupData);
        const importedCollections = Object.keys(normalizedBackup);

        if (importedCollections.length === 0) {
            return res.status(400).json({
                error: 'No se encontró una estructura de backup válida'
            });
        }

        const dataFiles = await getDataFiles();

        for (const file of dataFiles) {
            const matchingKey = Object.keys(normalizedBackup).find((key) => {
                const aliases = DEFAULT_COLLECTIONS[file] || [file];
                return aliases.includes(key);
            });

            if (!matchingKey) continue;

            const filePath = path.join(DB_DIR, `${file}.json`);

            await fs.writeFile(
                filePath,
                JSON.stringify(normalizedBackup[matchingKey], null, 2),
                'utf-8'
            );
        }

        res.json({
            message: 'Backup restaurado correctamente'
        });

    } catch (error) {
        console.error('Error importando backup:', error);

        res.status(500).json({
            error: 'Error al restaurar backup'
        });
    }
};

module.exports = {
    exportBackup,
    importBackup
};