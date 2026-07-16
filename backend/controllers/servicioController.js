// backend/controllers/servicioController.js
const servicioService = require('../services/servicioService');

const { getLocalTimeString } = require('../utils/dateUtils'); // <--- IMPORTAR

// ... (getServicios, updateServicio, deleteServicio permanecen igual)

// ... (exportar lo demás)

const getServicios = async (req, res) => {
    try {
        const { fecha } = req.query;
        const userId = req.user.role === 'TECNICO' ? req.user.id : undefined;
        const servicios = await servicioService.getServicios(fecha, userId);
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener servicios' });
    }
};

const createServicio = async (req, res) => {
    try {
        const tipo = String(req.body.tipo || 'servicio').trim().toLowerCase();
        const costo = Number(req.body.costo);
        const precio = Number(req.body.precio || 0);
        const servicioNombre = String(req.body.servicio || '').trim();
        const modelo = String(req.body.modelo || '').trim();

        if (tipo === 'gasto') {
            if (!servicioNombre || !Number.isFinite(costo) || costo <= 0) {
                return res.status(400).json({ message: 'Descripción y costo son obligatorios para un gasto' });
            }
        } else {
            if (!servicioNombre || !modelo || !Number.isFinite(precio) || !Number.isFinite(costo)) {
                return res.status(400).json({ message: 'Servicio, modelo, precio y costo son obligatorios' });
            }
        }

        const data = {
            ...req.body,
            tipo: tipo === 'gasto' ? 'gasto' : 'servicio',
            servicio: servicioNombre,
            modelo,
            precio: tipo === 'gasto' ? 0 : precio,
            costo,
            utilidad: tipo === 'gasto'
                ? Math.round(-costo * 100) / 100
                : Math.round((precio - costo) * 100) / 100,
            usuarioId: req.user.id,
            hora: getLocalTimeString()
        };

        const servicio = await servicioService.createServicio(data);
        res.status(201).json(servicio);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear servicio' });
    }
};

const updateServicio = async (req, res) => {
    try {
        const existing = await servicioService.getServicios(null, req.user.id);
        const servicio = existing.find(s => s.id === req.params.id);
        
        if (req.user.role === 'TECNICO' && !servicio) {
            return res.status(403).json({ message: 'No puedes editar este servicio' });
        }

        const updates = { ...req.body };
        if ('precio' in updates) updates.precio = Number(updates.precio);
        if ('costo' in updates) updates.costo = Number(updates.costo);
        if (Number.isFinite(updates.precio) && Number.isFinite(updates.costo)) {
            updates.utilidad = Math.round((updates.precio - updates.costo) * 100) / 100;
        }

        const updated = await servicioService.updateServicio(req.params.id, updates);
        if (!updated) return res.status(404).json({ message: 'Servicio no encontrado' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar servicio' });
    }
};

const deleteServicio = async (req, res) => {
    try {
        if (req.user.role === 'TECNICO') {
            const existing = await servicioService.getServicios(null, req.user.id);
            if (!existing.find(s => s.id === req.params.id)) {
                return res.status(403).json({ message: 'No puedes eliminar este servicio' });
            }
        }
        
        const deleted = await servicioService.deleteServicio(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Servicio no encontrado' });
        res.json({ message: 'Servicio eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar servicio' });
    }
};

const getMetrics = async (req, res) => {
    try {
        const { fecha } = req.query;
        const servicios = await servicioService.getServicios(fecha);

        const serviciosFiltrados = servicios.filter(s => s.tipo !== 'gasto');
        const gastos = servicios.filter(s => s.tipo === 'gasto');

        const totalIngresos = serviciosFiltrados.reduce((sum, s) => sum + (s.precio || 0), 0);
        const totalCostos = serviciosFiltrados.reduce((sum, s) => sum + (s.costo || 0), 0);
        const totalGastos = gastos.reduce((sum, s) => sum + (s.costo || 0), 0);
        const utilidadBruta = Math.round((totalIngresos - totalCostos) * 100) / 100;
        const utilidadNeta = Math.round((utilidadBruta - totalGastos) * 100) / 100;

        const porTecnico = {};
        serviciosFiltrados.forEach(s => {
            if (!porTecnico[s.usuarioId]) porTecnico[s.usuarioId] = { count: 0, utilidad: 0 };
            porTecnico[s.usuarioId].count++;
            porTecnico[s.usuarioId].utilidad += (s.utilidad || 0);
        });

        res.json({
            totalIngresos,
            totalCostos,
            totalGastos,
            utilidadBruta,
            utilidadNeta,
            serviciosPorTecnico: porTecnico,
            totalServicios: serviciosFiltrados.length,
            totalGastosCount: gastos.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al calcular métricas' });
    }
};

module.exports = { getServicios, createServicio, updateServicio, deleteServicio, getMetrics };
