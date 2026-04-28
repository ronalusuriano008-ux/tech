// backend/controllers/configController.js
const configService = require('../services/configService');

const getConfig = async (req, res) => {
    try {
        const config = await configService.getConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener configuración' });
    }
};

const updateConfig = async (req, res) => {
    try {
        const config = await configService.getConfig();
        const updated = await configService.updateConfig(config.id, req.body);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar configuración' });
    }
};

module.exports = { getConfig, updateConfig };