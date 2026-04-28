// backend/services/servicioService.js
const fileDB = require('../db/fileDB');

const getTodayString = () => new Date().toISOString().split('T')[0];

const getServicios = async (fecha, userId) => {
    let servicios = await fileDB.findAll('servicios');
    const filterDate = fecha || getTodayString();
    
    servicios = servicios.filter(s => s.fecha === filterDate);
    
    if (userId) {
        servicios = servicios.filter(s => s.usuarioId === userId);
    }
    
    return servicios;
};

const createServicio = async (data) => {
    if (!data.fecha) data.fecha = getTodayString();
    return await fileDB.create('servicios', data);
};

const updateServicio = async (id, data) => {
    return await fileDB.update('servicios', id, data);
};

const deleteServicio = async (id) => {
    return await fileDB.remove('servicios', id);
};

module.exports = { getServicios, createServicio, updateServicio, deleteServicio };