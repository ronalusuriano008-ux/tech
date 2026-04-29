// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const configRoutes = require('./routes/configRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const backupRoutes = require('./routes/backupRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/config', configRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/mensajes', mensajeRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/backup', backupRoutes);

// Redirección de la raíz al login
app.get('/', (req, res) => {
    res.redirect('/login/index.html');
});

// Servir frontend estático
app.use('/login', express.static(path.join(__dirname, '..', 'frontend', 'login')));
app.use('/admin', express.static(path.join(__dirname, '..', 'frontend', 'admin-panel')));
app.use('/calculadora', express.static(path.join(__dirname, '..', 'frontend', 'calculadora')));
app.use('/registro', express.static(path.join(__dirname, '..', 'frontend', 'registro-servicios')));

const PORT = process.env.PORT || 3000;

// Interruptor de estado para apagado seguro
let isShuttingDown = false;

const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Función de apagado controlado
const gracefulShutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[Interrupción] ${signal} recibido. Cerrando servidor de forma segura...`);
    
    server.close(() => {
        console.log('[Interrupción] Servidor cerrado correctamente.');
        process.exit(0);
    });

    // Forzar cierre después de 10 segundos si algo se queda colgado
    setTimeout(() => {
        console.error('[Interrupción] Forzando el cierre por timeout.');
        process.exit(1);
    }, 10000);
};

// Escuchar señales de terminación del sistema operativo (Ctrl+C o kill)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Capturar errores síncronos no controlados
process.on('uncaughtException', (err) => {
    console.error('[Error Crítico] Excepción no capturada:', err.message);
    gracefulShutdown('uncaughtException');
});

// Capturar promesas rechazadas sin catch
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Error Crítico] Promesa rechazada no manejada:', reason);
    gracefulShutdown('unhandledRejection');
});