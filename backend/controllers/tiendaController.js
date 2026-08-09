const tiendaService = require('../services/tiendaService');
const reportService = require('../services/tiendaReportService');

function buildMonthlySummary(days = []) {
    const sortedDays = [...days].sort((a, b) => Number(a.day) - Number(b.day));
    const lastDay = sortedDays[sortedDays.length - 1] || {};

    const totals = sortedDays.reduce((acc, d) => {
        acc.totalDiario += Number(d.totalDiario || 0);
        acc.banco += Number(d.bancoDepositado || 0);
        acc.bancoDepositado += Number(d.bancoDepositado || 0);
        return acc;
    }, { totalDiario: 0, banco: 0, bancoDepositado: 0 });

    return {
        totalMes: totals.totalDiario,
        banco: totals.banco,
        bancoDepositado: totals.bancoDepositado,
        acumulado: Number(lastDay.acumuladoTienda ?? lastDay.acumulado ?? 0),
        promedioDiario: sortedDays.length > 0 ? totals.totalDiario / sortedDays.length : 0
    };
}

exports.buildMonthlySummary = buildMonthlySummary;

// Obtener los datos de un mes específico
exports.getMonth = async (req, res) => {
    try {
        const year = Number(req.params.year);
        const month = Number(req.params.month);

        const data = await tiendaService.getMonth(year, month);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear o actualizar un día
exports.createDay = async (req, res) => {
    try {
        const year = Number(req.params.year);
        const month = Number(req.params.month);

        const data = await tiendaService.saveDay(year, month, req.body);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar un día
exports.deleteDay = async (req, res) => {
    try {
        const year = Number(req.params.year);
        const month = Number(req.params.month);
        const day = Number(req.params.day);

        const data = await tiendaService.deleteDay(year, month, day);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Recalcular todo el mes (trigger)
exports.recalculate = async (req, res) => {
    try {
        const year = Number(req.params.year);
        const month = Number(req.params.month);

        const data = await tiendaService.recalculateMonth(year, month);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Generar PDF del mes delegando a reportService (controlador ligero)
exports.pdfMonth = async (req, res) => {
    try {
        const year = Number(req.params.year);
        const month = Number(req.params.month);

        const data = await tiendaService.getMonth(year, month);
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const title = `Control Diario - ${monthNames[month-1]} ${year}`;

        const buffer = await reportService.generatePdfBuffer(data, title);

        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `attachment; filename="tienda-${year}-${String(month).padStart(2, '0')}.pdf"`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};