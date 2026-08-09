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
        const { nombre, usuario, password, role } = req.body || {};
        if (!String(nombre || '').trim() || !String(usuario || '').trim() || !String(password || '')) {
            return res.status(400).json({ message: 'Nombre, usuario y contraseña son obligatorios' });
        }
        if (!['ADMIN', 'TECNICO'].includes(role)) return res.status(400).json({ message: 'Rol inválido' });
        const users = await userService.getUsers();
        if (users.some((item) => item.usuario.toLowerCase() === String(usuario).trim().toLowerCase())) {
            return res.status(409).json({ message: 'El usuario de acceso ya existe' });
        }
        const user = await userService.createUser({ ...req.body, nombre: nombre.trim(), usuario: usuario.trim(), role });
        res.status(201).json(toSafeUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Error al crear usuario' });
    }
};

const updateUser = async (req, res) => {
    try {
        const users = await userService.getUsers();
        const current = users.find((item) => item.id === req.params.id);
        if (!current) return res.status(404).json({ message: 'Usuario no encontrado' });
        const updates = { ...req.body };
        if (updates.role && !['ADMIN', 'TECNICO'].includes(updates.role)) return res.status(400).json({ message: 'Rol inválido' });
        if (updates.usuario && users.some((item) => item.id !== current.id && item.usuario.toLowerCase() === String(updates.usuario).trim().toLowerCase())) {
            return res.status(409).json({ message: 'El usuario de acceso ya existe' });
        }
        const admins = users.filter((item) => item.role === 'ADMIN');
        if (current.role === 'ADMIN' && updates.role === 'TECNICO' && admins.length === 1) {
            return res.status(409).json({ message: 'Debe existir al menos un administrador' });
        }
        if (!updates.password) delete updates.password;
        const user = await userService.updateUser(req.params.id, updates);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(toSafeUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};

const deleteUser = async (req, res) => {
    try {
        if (req.user?.id === req.params.id) return res.status(409).json({ message: 'No puedes eliminar tu propia sesión' });
        const users = await userService.getUsers();
        const target = users.find((item) => item.id === req.params.id);
        if (target?.role === 'ADMIN' && users.filter((item) => item.role === 'ADMIN').length === 1) {
            return res.status(409).json({ message: 'Debe existir al menos un administrador' });
        }
        const deleted = await userService.deleteUser(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};

module.exports = { getUsers, getAdminInfo, createUser, updateUser, deleteUser };
