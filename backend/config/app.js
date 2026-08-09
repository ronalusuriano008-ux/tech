const path = require('path');
const appConfig = require('../../config');

function getRuntimeConfig() {
  return {
    apiBaseUrl: process.env.API_BASE_URL || appConfig.api.baseUrl,
    appBaseUrl: process.env.APP_BASE_URL || '',
    publicBaseUrl: process.env.PUBLIC_BASE_URL || appConfig.runtime.publicBaseUrl,
    loginPath: appConfig.app.paths.login,
    dashboardPath: appConfig.app.paths.dashboard,
    adminPath: appConfig.app.paths.admin,
    registroPath: appConfig.app.paths.registro,
    calculadoraPath: appConfig.app.paths.calculadora,
    fillPath: appConfig.app.paths.fill,
    tablePath: appConfig.app.paths.table,
    tiendaPath: appConfig.app.paths.tienda,
    frontendRoot: appConfig.runtime.frontendRoot || path.join(__dirname, '..', '..', 'frontend')
  };
}

module.exports = {
  getRuntimeConfig
};
