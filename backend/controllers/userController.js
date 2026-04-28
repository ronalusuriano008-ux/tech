// backend/controllers/userController.js
const userService = require('../services/userService');

const getUsers = async (req, res) => {
    try {
        const users = await userService.getUsers();
        const safeUsers = users.map(({ password, ...u }) => u);
        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

const createUser = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear usuario' });
    }
};

const updateUser = async (req, res) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const deleted = await userService.deleteUser(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };