// backend/controllers/backupController.js

const fs = require('fs').promises;
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');

const FILES = [
    'users',
    'servicios',
    'inventario',
    'config'
];

// EXPORTAR BACKUP COMPLETO
const exportBackup = async (req, res) => {
    try {
        const backup = {};

        for (const file of FILES) {
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

    const aliasesByCollection = {
        users: ['users', 'user', 'usuarios', 'usuario'],
        servicios: ['servicios', 'servicio', 'services'],
        inventario: ['inventario', 'inventarioItems', 'items', 'productos'],
        config: ['config', 'configuration', 'configuracion', 'settings']
    };

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

        for (const file of FILES) {
            if (!(file in normalizedBackup)) continue;

            const filePath = path.join(DB_DIR, `${file}.json`);

            await fs.writeFile(
                filePath,
                JSON.stringify(normalizedBackup[file], null, 2),
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