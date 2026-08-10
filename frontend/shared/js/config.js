(function () {
  const runtimeConfig = window.__APP_CONFIG__ || {};

  const defaultAppConfig = {
    appName: 'Taller Tech',
    appShortName: 'TallerTech',
    apiBaseUrl: '/api',
    appBaseUrl: '',
    timezone: 'America/Lima',
    currencyCode: 'PEN',
    currencySymbol: 'S/.',
    currencyLocale: 'es-PE',
    loginPath: '/login/index.html',
    dashboardPath: '/dashboard.html',
    adminPath: '/admin/index.html',
    registroPath: '/registro/index.html',
    calculadoraPath: '/calculadora/index.html',
    fillPath: '/fill.html',
    tablePath: '/table.html',
    tiendaPath: '/pages/tienda.html'
    ,offline: {
      version: '2026.08.10',
      maxRetries: 5,
      retryBaseMs: 1500,
      dataCacheTtlMs: 120000
    }
  };

  const appConfig = {
    ...defaultAppConfig,
    ...runtimeConfig
  };

  const apiBaseUrl = appConfig.apiBaseUrl || defaultAppConfig.apiBaseUrl;
  const appBaseUrl = (appConfig.appBaseUrl || '').replace(/\/+$/, '');

  window.AppConfig = {
    ...appConfig,
    apiBaseUrl,
    appBaseUrl
  };

  window.getApiUrl = function getApiUrl(path = '') {
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${window.AppConfig.apiBaseUrl}${normalizedPath}`;
  };

  window.resolveAppPath = function resolveAppPath(path) {
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${window.AppConfig.appBaseUrl}${normalizedPath}`;
  };

  window.redirectTo = function redirectTo(path, options = {}) {
    const destination = window.resolveAppPath(path);
    if (options.replace) {
      window.location.replace(destination);
      return;
    }
    window.location.href = destination;
  };
})();
