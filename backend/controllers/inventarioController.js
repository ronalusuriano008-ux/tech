// backend/controllers/inventarioController.js
const inventarioService = require('../services/inventarioService');

const getInventario = async (req, res) => {
    try {
        const inv = await inventarioService.getInventario();
        res.json(inv);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener inventario' });
    }
};

const createInventario = async (req, res) => {
    try {
        const item = await inventarioService.createInventario(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear item' });
    }
};

const updateInventario = async (req, res) => {
    try {
        const item = await inventarioService.updateInventario(req.params.id, req.body);
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar item' });
    }
};

const deleteInventario = async (req, res) => {
    try {
        await inventarioService.deleteInventario(req.params.id);
        res.json({ message: 'Item eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar item' });
    }
};

module.exports = { getInventario, createInventario, updateInventario, deleteInventario };