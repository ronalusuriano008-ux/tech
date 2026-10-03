// backend/services/servicioService.js
const fileDB = require('../db/fileDB');
const { getLocalDateString } = require('../utils/dateUtils'); 

const normalizeDateValue = (value) => {
    if (value === undefined || value === null) return value;

    const normalized = String(value).trim();
    if (!normalized) return normalized;

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;

    if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(normalized)) {
        const [day, month, year] = normalized.split(/[/-]/).map(Number);
        const parsed = new Date(year, month - 1, day);
        if (!Number.isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
    }

    const isoMatch = normalized.match(/^\d{4}-\d{2}-\d{2}T.*$/);
    if (isoMatch) {
        const parsed = new Date(normalized);
        if (!Number.isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
    }

    return normalized;
};

const getServicios = async (fecha, userId) => {
    let servicios = await fileDB.findAll('servicios');
    const filterDate = normalizeDateValue(fecha) || getLocalDateString();

    servicios = servicios.filter(s => String(s.fecha || '').trim() === String(filterDate).trim());

    if (userId) {
        servicios = servicios.filter(s => s.usuarioId === userId);
    }

    return servicios;
};

const createServicio = async (data) => {
    if (!data.fecha) data.fecha = getLocalDateString(); 
    return await fileDB.create('servicios', data);
};

const updateServicio = async (id, data) => {
    return await fileDB.update('servicios', id, data);
};

const deleteServicio = async (id) => {
    return await fileDB.remove('servicios', id);
};

module.exports = { getServicios, createServicio, updateServicio, deleteServicio };