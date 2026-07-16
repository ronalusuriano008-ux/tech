// backend/services/configService.js
const fileDB = require('../db/fileDB');

const getConfig = async () => {
    const configs = await fileDB.findAll('config');
    return configs[0] || { id: 'global', vh: 5, cf: 50, margen: 30, riesgo: 10, garantia: 5, glassTheme: false };
};

const updateConfig = async (id, data) => {
    return await fileDB.update('config', id || 'global', data);
};

module.exports = { getConfig, updateConfig };