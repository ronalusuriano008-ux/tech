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
        const { year, month, day, st1, st2 } = req.body;
        const monthData = await storage.readMonth(year, month);
        monthData.year = year; monthData.month = month;
        
        const dayIndex = monthData.days.findIndex(d => d.day === day);
        const newDayData = {
            day,
            st1: { cash: parseFloat(st1.cash) || 0, yape: parseFloat(st1.yape) || 0 },
            st2: { cash: parseFloat(st2.cash) || 0, yape: parseFloat(st2.yape) || 0 }
        };

        if (dayIndex >= 0) monthData.days[dayIndex] = newDayData;
        else { monthData.days.push(newDayData); monthData.days.sort((a, b) => a.day - b.day); }

        await storage.writeMonth(monthData);
        res.json({ success: true, data: monthData });
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar el día' });
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
