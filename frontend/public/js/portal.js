const API_BASE_URL = window.AppConfig?.apiBaseUrl || '/api';

const getUser = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/check`, { credentials: 'include' });
  if (!res.ok) {
    window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
    return null;
  }

  const data = await res.json();
  if (!data.logged) {
    window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
    return null;
  }

  return data.user;
};

const getAvailableModules = (user) => {
  const baseModules = [
    {
      title: 'Dashboard',
      description: 'Resumen principal del negocio.',
      icon: 'fa-chart-line',
      path: window.AppConfig?.dashboardPath || '/dashboard.html',
      badge: 'Principal'
    },
    {
      title: 'Registro',
      description: 'Captura de servicios y actividades.',
      icon: 'fa-clipboard-list',
      path: window.AppConfig?.registroPath || '/registro/index.html',
      badge: 'Operativo'
    },
    {
      title: 'Rellenar',
      description: 'Carga rápida de datos del mes.',
      icon: 'fa-pen-to-square',
      path: window.AppConfig?.fillPath || '/fill.html',
      badge: 'Carga'
    },
    {
      title: 'Tabla',
      description: 'Consulta y revisión de registros.',
      icon: 'fa-table',
      path: window.AppConfig?.tablePath || '/table.html',
      badge: 'Consulta'
    }
  ];

  if (user?.role === 'ADMIN') {
    baseModules.push({
      title: 'Admin',
      description: 'Usuarios, configuración y respaldos.',
      icon: 'fa-shield-halved',
      path: window.AppConfig?.adminPath || '/admin/index.html',
      badge: 'Admin'
    });
  }

  return baseModules;
};

const resolvePath = (path) => window.resolveAppPath ? window.resolveAppPath(path) : `${window.AppConfig?.appBaseUrl || ''}${path}`;

const renderCards = (user) => {
  const container = document.getElementById('moduleCards');
  if (!container) return;

  const modules = getAvailableModules(user);

  container.innerHTML = modules.map((module) => `
    <div class="col-12 col-md-6 col-lg-4">
      <a href="${resolvePath(module.path)}" class="portal-card">
        <div class="portal-card__icon">
          <i class="fas ${module.icon}"></i>
        </div>
        <div class="portal-card__body">
          <span class="portal-card__badge">${module.badge}</span>
          <h3>${module.title}</h3>
          <p>${module.description}</p>
        </div>
      </a>
    </div>
  `).join('');
};

const renderTopButtons = (user) => {
  const container = document.getElementById('quickActions');
  if (!container) return;

  const modules = getAvailableModules(user).filter((module) => module.title !== 'Portal');
  const buttons = [
    ...modules.slice(0, 5).map((module) => ({
      label: module.title,
      path: resolvePath(module.path),
      cls: module.badge === 'Admin'
        ? 'btn btn-warning btn-lg'
        : module.title === 'Dashboard'
          ? 'btn btn-outline-light btn-lg'
          : 'btn btn-primary btn-lg'
    })),
    { label: 'Cerrar sesión', path: 'logout', cls: 'btn btn-outline-light btn-lg', isLogout: true }
  ];

  container.innerHTML = buttons.map((button) => button.isLogout
    ? `<button class="${button.cls}" onclick="window.logoutPortal()">${button.label}</button>`
    : `<a class="${button.cls}" href="${button.path}" role="button">${button.label}</a>`
  ).join('');
};

const initPortal = async () => {
  const user = await getUser();
  if (!user) return;

  document.getElementById('userName').textContent = user.nombre || user.username || 'Usuario';
  document.getElementById('userRole').textContent = user.role === 'ADMIN' ? 'Administrador' : 'Usuario';
  document.getElementById('apiHost').textContent = window.AppConfig?.apiBaseUrl || 'https://api.vixbox.xyz/api';
  document.getElementById('accessSummary').textContent = user.role === 'ADMIN'
    ? 'Acceso total: administración y operaciones'
    : 'Acceso operativo: consultas y registro';
  renderTopButtons(user);
  renderCards(user);
};

document.addEventListener('DOMContentLoaded', initPortal);

window.logoutPortal = async function logoutPortal() {
  await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
};
