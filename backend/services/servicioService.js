// backend/services/servicioService.js
const fileDB = require('../db/fileDB');
const { getLocalDateString } = require('../utils/dateUtils'); 

const normalizeDateValue = (value) => {
    if (!value) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/').map(Number);
        const parsed = new Date(year, month - 1, day);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
        const [day, month, year] = value.split('-').map(Number);
        const parsed = new Date(year, month - 1, day);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toISOString().slice(0, 10);
};

const getServicios = async (fecha, userId) => {
    let servicios = await fileDB.findAll('servicios');
    const filterDate = normalizeDateValue(fecha) || getLocalDateString();
    
    servicios = servicios.filter(s => s.fecha === filterDate);
    
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