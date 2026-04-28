// backend/services/asistenciaService.js
const fileDB = require('../db/fileDB');
const { getLocalDateString, getLocalTimeString, getLocalDayOfWeek } = require('../utils/dateUtils');

const getAsistencia = async (fecha, userId) => {
    let asistencias = await fileDB.findAll('asistencia');
    const filterDate = fecha || getLocalDateString(); // <-- CAMBIO AQUÍ
    asistencias = asistencias.filter(a => a.fecha === filterDate);
    if (userId) asistencias = asistencias.filter(a => a.usuarioId === userId);
    return asistencias;
};

const registerCheckIn = async (usuarioId) => {
    const fecha = getLocalDateString(); // <-- CAMBIO AQUÍ
    const user = await fileDB.findById('users', usuarioId);
    const diaSemana = getLocalDayOfWeek(); // <-- CAMBIO AQUÍ
    const diaDescanso = user.diasDescanso || [];
    
    let alerta = null;
    if (diaDescanso.includes(diaSemana)) {
        alerta = 'Trabajando en día de descanso';
    }
    
    const horaActual = getLocalTimeString(); // <-- CAMBIO AQUÍ
    if (horaActual < user.horarioEntrada) {
        alerta = alerta ? `${alerta}, fuera de horario` : 'Fuera de horario de entrada';
    }

    return await fileDB.create('asistencia', { usuarioId, fecha, horaEntrada: horaActual, alertas: alerta ? [alerta] : [] });
};

const registerCheckOut = async (usuarioId) => {
    const fecha = getLocalDateString(); // <-- CAMBIO AQUÍ
    const asistencias = await fileDB.findAll('asistencia');
    const registro = asistencias.find(a => a.usuarioId === usuarioId && a.fecha === fecha && !a.horaSalida);
    
    if (!registro) throw new Error('No se encontró check-in para hoy');
    
    const horaActual = getLocalTimeString(); // <-- CAMBIO AQUÍ
    return await fileDB.update('asistencia', registro.id, { horaSalida: horaActual });
};

module.exports = { getAsistencia, registerCheckIn, registerCheckOut };