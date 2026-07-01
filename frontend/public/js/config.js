(function () {
  const runtimeConfig = window.__APP_CONFIG__ || {};
  const host = window.location.hostname || '';

  const defaultApiBaseUrl = host === 'api.vixbox.xyz' || host === 'localhost' || host === '127.0.0.1' ? '/api' : 'https://api.vixbox.xyz/api';
  const apiBaseUrl = runtimeConfig.apiBaseUrl || defaultApiBaseUrl;
  const appBaseUrl = runtimeConfig.appBaseUrl || '';

  window.AppConfig = {
    apiBaseUrl,
    appBaseUrl,
    loginPath: runtimeConfig.loginPath || '/login/index.html',
    dashboardPath: runtimeConfig.dashboardPath || '/dashboard.html',
    adminPath: runtimeConfig.adminPath || '/admin/index.html',
    registroPath: runtimeConfig.registroPath || '/registro/index.html'
  };

  window.getApiUrl = function getApiUrl(path = '') {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${window.AppConfig.apiBaseUrl}${normalizedPath}`;
  };

  window.redirectTo = function redirectTo(path) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    window.location.href = `${window.AppConfig.appBaseUrl}${normalizedPath}`;
  };
})();
