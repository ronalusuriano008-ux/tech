const fileDB = require('../db/fileDB');

const authMiddleware = async (req, res, next) => {
    try {
        if (req.session && req.session.user) {
            req.user = req.session.user;
            return next();
        }

        return res.status(401).json({
            message: 'No autorizado'
        });
    } catch (error) {
        console.error('Error en authMiddleware:', error);

        return res.status(500).json({
            message: 'Error interno de autenticación'
        });
    }
};

const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({
            message: 'Acceso denegado, se requiere rol ADMIN'
        });
    }

    next();
};

module.exports = {
    authMiddleware,
    adminMiddleware
};