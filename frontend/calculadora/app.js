// frontend/calculadora/app.js
const user = JSON.parse(localStorage.getItem('user'));
const headers = { 'x-user-id': user.id, 'x-user-role': user.role };
let config = {};

if (!user) window.location.href = '/login/index.html';

const loadConfig = async () => {
    const res = await fetch('/api/config', { headers });
    config = await res.json();
    document.getElementById('configDisplay').innerHTML =
`Configuracion:
Valor hora = ${config.vh} |
Costo fijo = ${config.cf} |
Margen = ${config.margen}% |
Riesgo = ${config.riesgo}% |
Garantía = ${config.garantia}%`;
};

const calculate = () => {
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

    document.getElementById('precioFinal').textContent = `$${(Math.round(precio * 10) / 10).toFixed(1)}`;
};

const logout = () => { localStorage.removeItem('user'); window.location.href = '/login/index.html'; };

loadConfig().then(calculate);