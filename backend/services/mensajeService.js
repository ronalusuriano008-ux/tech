// backend/services/mensajeService.js
const fileDB = require('../db/fileDB');

// ADMIN: sin userId → devuelve todos los mensajes
// (el frontend los agrupa y ordena por conversación)
const getMensajes = async () => {
    const mensajes = await fileDB.findAll('mensajes');
    return mensajes.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
};

// TECNICO: devuelve mensajes donde es remitente O destinatario
const getMensajesByParticipant = async (userId) => {
    const mensajes = await fileDB.findAll('mensajes');
    return mensajes
        .filter(m => m.de === userId || m.para === userId)
        .sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
};

const createMensaje = async (data) => {
    return await fileDB.create('mensajes', {
        de: data.de,
        para: data.para,
        contenido: data.contenido,
        leido: false
    });
};

const marcarLeido = async (id) => await fileDB.update('mensajes', id, { leido: true });

module.exports = { getMensajes, getMensajesByParticipant, createMensaje, marcarLeido };