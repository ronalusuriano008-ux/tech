// backend/utils/calculadora.js
const calcularPrecio = (cr, tiempo, config, trabajos = 1, stock = true) => {
    const { vh, cf, riesgo, garantia, margen } = config;
    
    let costoManoObra = tiempo * vh;
    let costoFijoUnitario = trabajos > 0 ? cf / trabajos : 0;
    let costoBase = cr + costoManoObra + costoFijoUnitario;

    if (tiempo > 0 && costoBase < 20) {
        costoBase = 20;
    }

    let precioFinal = costoBase;
    
    precioFinal *= (1 + (riesgo / 100));
    precioFinal *= (1 + (garantia / 100));
    precioFinal *= (1 + (margen / 100));

    if (!stock) {
        precioFinal *= 1.3;
    }

    return Math.round(precioFinal * 10) / 10;
};

module.exports = { calcularPrecio };