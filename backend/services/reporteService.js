// backend/services/reporteService.js
const servicioService = require('./servicioService');
const userService = require('./userService');
const { getLocalDateString } = require('../utils/dateUtils'); // <-- IMPORTAR

const generarReporteDiario = async (userId, fecha) => {
    const servicios = await servicioService.getServicios(fecha, userId);
    const user = await userService.getUserById(userId);

    if (!user) {
        const error = new Error('Tecnico no encontrado');
        error.statusCode = 404;
        throw error;
    }

    const totalIngresos = servicios.reduce((sum, s) => sum + (s.precio || 0), 0);
    const totalCostos = servicios.reduce((sum, s) => sum + (s.costo || 0), 0);
    const utilidadTotal = servicios.reduce((sum, s) => sum + (s.utilidad || 0), 0);

    return {
        fecha: fecha || getLocalDateString(),
        tecnico: user.nombre,
        servicios: servicios,
        totalIngresos: Math.round(totalIngresos * 100) / 100,
        totalCostos: Math.round(totalCostos * 100) / 100,
        utilidadTotal: Math.round(utilidadTotal * 100) / 100,
        cantidadServicios: servicios.length
    };
};

module.exports = { generarReporteDiario };
