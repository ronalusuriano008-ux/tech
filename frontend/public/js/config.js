(function () {
  const runtimeConfig = window.__APP_CONFIG__ || {};
  const host = window.location.hostname || '';

  const defaultApiBaseUrl = host === 'api.vixbox.xyz' || host === 'localhost' || host === '127.0.0.1' ? '/api' : 'https://api.vixbox.xyz/api';
  const apiBaseUrl = runtimeConfig.apiBaseUrl || defaultApiBaseUrl;
  const appBaseUrl = (runtimeConfig.appBaseUrl || '').replace(/\/+$/, '');
  const paths = {
    loginPath: runtimeConfig.loginPath || '/login/index.html',
    dashboardPath: runtimeConfig.dashboardPath || '/dashboard.html',
    adminPath: runtimeConfig.adminPath || '/admin/index.html',
    registroPath: runtimeConfig.registroPath || '/registro/index.html',
    calculadoraPath: runtimeConfig.calculadoraPath || '/calculadora/index.html',
    fillPath: runtimeConfig.fillPath || '/fill.html',
    tablePath: runtimeConfig.tablePath || '/table.html'
  };

  window.AppConfig = {
    apiBaseUrl,
    appBaseUrl,
    ...paths
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
