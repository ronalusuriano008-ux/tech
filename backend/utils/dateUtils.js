// backend/utils/dateUtils.js

const WORKSHOP_TIMEZONE = 'America/Lima'; 

const getLocalDateString = () => {
    return new Date().toLocaleDateString('en-CA', { 
        timeZone: WORKSHOP_TIMEZONE 
    });
};

const getLocalTimeString = () => {
    return new Date().toLocaleTimeString('es-MX', { 
        timeZone: WORKSHOP_TIMEZONE, 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    });
};

const getLocalDayOfWeek = () => {
    // Obtiene las 3 letras del día en inglés basado en la zona horaria (ej: 'Mon', 'Tue')
    const dayString = new Date().toLocaleDateString('en-US', { 
        timeZone: WORKSHOP_TIMEZONE, 
        weekday: 'short' 
    });
    
    // Mapeo exacto a los números que usa JavaScript (0 = Domingo, 1 = Lunes...)
    const daysMap = {
        'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 
        'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    
    return daysMap[dayString] !== undefined ? daysMap[dayString] : 0;
};

module.exports = { getLocalDateString, getLocalTimeString, getLocalDayOfWeek, WORKSHOP_TIMEZONE };