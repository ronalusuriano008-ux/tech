// frontend/calculadora/app.js
const readUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch (error) {
        return null;
    }
};
const user = readUser();
const headers = user ? { 'x-user-id': user.id, 'x-user-role': user.role } : {};
let config = {};

if (!user) window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });

const loadConfig = async () => {
    try {
        const res = await fetch(`${window.AppConfig?.apiBaseUrl || '/api'}/config`, { headers });
        if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            const error = new Error(payload.message || payload.error || 'No se pudo cargar la configuración');
            error.status = res.status;
            throw error;
        }
        config = await res.json();
        document.getElementById('configDisplay').innerHTML =
`Configuracion:
Valor hora = ${config.vh} |
Costo fijo = ${config.cf} |
Margen = ${config.margen}% |
Riesgo = ${config.riesgo}% |
Garantía = ${config.garantia}%`;
    } catch (error) {
        console.error('[calculadora] Error cargando configuracion:', error);
        document.getElementById('configDisplay').textContent = 'No se pudo cargar la configuración.';
        window.AppMessages?.networkError(error, { title: 'Calculadora sin configuración' });
        throw error;
    }
};

const calculate = () => {
    if (!config || Object.keys(config).length === 0) return;
    const cr = parseFloat(document.getElementById('cr').value) || 0;
    const tiempo = parseFloat(document.getElementById('tiempo').value) || 0;
    const trabajos = parseInt(document.getElementById('trabajos').value) || 1;
    const stock = document.getElementById('stock').checked;

    let costoManoObra = tiempo * config.vh;
    let costoFijoUnitario = trabajos > 0 ? config.cf / trabajos : 0;
    let costoBase = cr + costoManoObra + costoFijoUnitario;

    if (tiempo > 0 && costoBase < 20) costoBase = 20;

    document.getElementById('costoBase').textContent = costoBase.toFixed(1);

    let precio = costoBase;
    precio *= (1 + (config.riesgo / 100));
    precio *= (1 + (config.garantia / 100));
    precio *= (1 + (config.margen / 100));

    if (!stock) precio *= 1.3;

    document.getElementById('precioFinal').textContent = `S/.${(Math.round(precio * 10) / 10).toFixed(1)}`;
};

const logout = async () => {
    try {
        await fetch(`${window.AppConfig?.apiBaseUrl || '/api'}/auth/logout`, { method: 'POST', headers, credentials: 'include' });
    } catch (error) {
        console.warn('[calculadora] No se pudo cerrar la sesion en servidor:', error);
    } finally {
        localStorage.removeItem('user');
        window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
    }
};

loadConfig().then(calculate).catch(() => {});
