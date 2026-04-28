// backend/services/mensajeService.js
const fileDB = require('../db/fileDB');

const getMensajes = async (userId) => {
    let mensajes = await fileDB.findAll('mensajes');
    if (userId) {
        mensajes = mensajes.filter(m => m.de === userId);
    }
    return mensajes.sort((a,b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
};

const createMensaje = async (data) => await fileDB.create('mensajes', { ...data, leido: false });

const marcarLeido = async (id) => await fileDB.update('mensajes', id, { leido: true });

module.exports = { getMensajes, createMensaje, marcarLeido };