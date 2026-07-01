// Middleware para proteger rutas
exports.requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    // Si es una llamada API, devolver 401. Si es web, redirigir a login.
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    return res.redirect('/login/index.html');
};
