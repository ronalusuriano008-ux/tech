// backend/controllers/authController.js
const userService = require('../services/userService');

const login = async (req, res) => {
    try {
        const { usuario, password } = req.body;
        const users = await userService.getUsers();
        const user = users.find(u => u.usuario === usuario && u.password === password);
        
        if (!user) return res.status(401).json({ message: 'Credenciales incorrectas' });
        
        res.json({ id: user.id, nombre: user.nombre, role: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
};

module.exports = { login };