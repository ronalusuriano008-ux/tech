// Motor de cálculo puro e independiente para el módulo Tienda
// No depende de Express, FS ni de la capa de persistencia.
// Recibe únicamente movimientos (array de días) y un estado inicial opcional.

function calcularEstadoFinanciero(monthPayload, options = {}) {
  const daysInput = Array.isArray(monthPayload.days) ? monthPayload.days.slice() : [];
  const initialAcumulado = Number(options.initialAcumuladoTienda || 0);
  const initialSaldoBanco = Number(options.initialSaldoBanco || 0);

  let runningAcumuladoTienda = initialAcumulado;
  let runningSaldoBanco = initialSaldoBanco;

  const sortedDays = daysInput.slice().sort((a, b) => Number(a.day) - Number(b.day));

  const dias = sortedDays.map((d) => {
    // Usar parseFloat/Number para preservar decimales
    const tienda1 = parseFloat(d.tienda1) || 0;
    const tienda2 = parseFloat(d.tienda2) || 0;
    const tienda3 = parseFloat(d.tienda3) || 0;

    const bancoDepositado = parseFloat(d.bancoDepositado) || 0;
    const retiroTienda = parseFloat(d.retiroTienda) || 0;
    const retiroBanco = parseFloat(d.retiroBanco) || 0;

    const totalDiario = tienda1 + tienda2 + tienda3;

    // Reglas actualizadas: sin depósito fijo automático.
    // acumuladoTienda = acumuladoAnterior + totalDiario - bancoDepositado - retiroTienda
    runningAcumuladoTienda = runningAcumuladoTienda + totalDiario - bancoDepositado - retiroTienda;

    // saldoBanco = saldoBancoAnterior + bancoDepositado - retiroBanco
    runningSaldoBanco = runningSaldoBanco + bancoDepositado - retiroBanco;

    return {
      day: Number(d.day),
      tienda1,
      tienda2,
      tienda3,
      totalDiario,
      bancoDepositado,
      retiroTienda,
      retiroBanco,
      acumuladoTienda: runningAcumuladoTienda,
      saldoBanco: runningSaldoBanco,
      disponible: runningAcumuladoTienda
    };
  });

  const totals = dias.reduce((acc, d) => {
    acc.totalDiario += d.totalDiario;
    acc.bancoDepositado += d.bancoDepositado || 0;
    return acc;
  }, { totalDiario: 0, bancoDepositado: 0 });

  const resumen = {
    saldoTienda: runningAcumuladoTienda,
    saldoBanco: runningSaldoBanco,
    totalMes: totals.totalDiario,
    bancoDepositado: totals.bancoDepositado
  };

  return {
    resumen,
    dias,
  };
}

module.exports = {
  calcularEstadoFinanciero
};
