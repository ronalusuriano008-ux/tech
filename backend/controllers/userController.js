// backend/controllers/userController.js
const userService = require('../services/userService');

const toSafeUser = ({ password, ...user }) => user;

const getUsers = async (req, res) => {
    try {
        const users = await userService.getUsers();
        const safeUsers = users.map(toSafeUser);
        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

const getAdminInfo = async (req, res) => {
    try {
        const users = await userService.getUsers();
        const admin = users.find(u => u.role === 'ADMIN');

        if (!admin) {
            return res.status(404).json({ error: 'Administrador no encontrado' });
        }

        res.json({ id: admin.id, nombre: admin.nombre });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener administrador' });
    }
};

const createUser = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(toSafeUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Error al crear usuario' });
    }
};

const updateUser = async (req, res) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(toSafeUser(user));
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

module.exports = { getUsers, getAdminInfo, createUser, updateUser, deleteUser };
