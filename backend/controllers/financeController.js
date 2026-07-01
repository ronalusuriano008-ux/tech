const storage = require('../services/jsonStorage');

exports.getMonth = async (req, res) => {
    try {
        const data = await storage.readMonth(parseInt(req.params.year), parseInt(req.params.month));
        if (!data.days) data.days = [];
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el mes' });
    }
};

exports.getDiary = async (req, res) => {
    try {
        const diary = await storage.readDiary();
        res.json(diary);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el diario' });
    }
};

exports.saveDay = async (req, res) => {
    try {
        console.log('[saveDay] Body recibido:', req.body);
        const { year, month, day, st1, st2 } = req.body;
        
        if (!year || !month || !day) {
            console.log('[saveDay] Parámetros faltantes:', { year, month, day });
            return res.status(400).json({ error: 'Parámetros faltantes (year, month, day)' });
        }
        
        const monthData = await storage.readMonth(year, month);
        console.log('[saveDay] Datos del mes leídos:', { year, month, daysCount: monthData.days?.length || 0 });
        
        monthData.year = year; 
        monthData.month = month;
        
        const dayIndex = monthData.days.findIndex(d => d.day === day);
        const newDayData = {
            day,
            st1: { cash: parseFloat(st1.cash) || 0, yape: parseFloat(st1.yape) || 0 },
            st2: { cash: parseFloat(st2.cash) || 0, yape: parseFloat(st2.yape) || 0 }
        };
        
        console.log('[saveDay] Guardando día:', newDayData);

        if (dayIndex >= 0) {
            monthData.days[dayIndex] = newDayData;
            console.log('[saveDay] Día actualizado en índice:', dayIndex);
        } else { 
            monthData.days.push(newDayData); 
            monthData.days.sort((a, b) => a.day - b.day);
            console.log('[saveDay] Nuevo día añadido');
        }

        await storage.writeMonth(monthData);
        console.log('[saveDay] Datos guardados exitosamente');
        res.json({ success: true, data: monthData });
    } catch (error) {
        console.error('[saveDay] Error:', error);
        res.status(500).json({ error: 'Error al guardar el día', details: error.message });
    }
};

exports.deleteDay = async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        const day = parseInt(req.params.day);
        await storage.deleteDay(year, month, day);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el día' });
    }
};

exports.deleteMonth = async (req, res) => {
    try {
        await storage.deleteMonth(parseInt(req.params.year), parseInt(req.params.month));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el mes' });
    }
};
