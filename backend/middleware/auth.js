// backend/middleware/auth.js
const fileDB = require('../db/fileDB');

const authMiddleware = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!userId || !userRole) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const user = await fileDB.findById('users', userId);
    if (!user || user.role !== userRole) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    req.user = user;
    next();
};

const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Acceso denegado, se requiere rol ADMIN' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };