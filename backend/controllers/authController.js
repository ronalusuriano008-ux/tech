// backend/controllers/authController.js
const userService = require('../services/userService');

const login = async (req, res) => {
    try {
        const { usuario, username, password } = req.body || {};
        const loginUser = usuario || username;

        if (!loginUser || !password) {
            return res.status(400).json({ message: 'Faltan credenciales' });
        }

        const users = await userService.getUsers();
        const user = users.find((u) => u.usuario === loginUser && u.password === password);

        if (!user) return res.status(401).json({ message: 'Credenciales incorrectas' });

        req.session.user = {
            id: user.id,
            nombre: user.nombre,
            role: user.role,
            usuario: user.usuario
        };

        return res.json({
            id: user.id,
            nombre: user.nombre,
            role: user.role,
            usuario: user.usuario,
            session: true
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error del servidor' });
    }
};

const logout = (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({ message: 'No se pudo cerrar la sesión' });
        }
        return res.json({ loggedOut: true });
    });
};

const checkSession = (req, res) => {
    if (!req.session?.user) {
        return res.status(401).json({ logged: false });
    }

    return res.json({
        logged: true,
        user: {
            id: req.session.user.id,
            nombre: req.session.user.nombre,
            role: req.session.user.role,
            username: req.session.user.usuario || req.session.user.nombre
        }
    });
};

module.exports = { login, logout, checkSession };