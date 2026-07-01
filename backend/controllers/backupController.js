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

// IMPORTAR BACKUP COMPLETO
const importBackup = async (req, res) => {
    try {
        const backupData = req.body;

        for (const file of FILES) {
            if (!(file in backupData)) {
                return res.status(400).json({
                    error: `Falta la colección: ${file}`
                });
            }
        }

        for (const file of FILES) {
            const filePath = path.join(DB_DIR, `${file}.json`);

            await fs.writeFile(
                filePath,
                JSON.stringify(backupData[file], null, 2),
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