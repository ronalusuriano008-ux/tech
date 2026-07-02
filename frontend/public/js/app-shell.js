(function () {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', path: '/dashboard.html', roles: ['ADMIN', 'TECNICO'] },
    { id: 'registro', label: 'Registro', icon: 'fa-clipboard-list', path: window.AppConfig?.registroPath || '/registro/index.html', roles: ['ADMIN', 'TECNICO'] },
    { id: 'fill', label: 'Rellenar', icon: 'fa-pen-to-square', path: '/fill.html', roles: ['ADMIN', 'TECNICO'] },
    { id: 'table', label: 'Tabla', icon: 'fa-table', path: '/table.html', roles: ['ADMIN', 'TECNICO'] },
    { id: 'admin', label: 'Administración', icon: 'fa-shield-halved', path: window.AppConfig?.adminPath || '/admin/index.html', roles: ['ADMIN'] }
  ];

  function resolvePath(path) {
    return window.resolveAppPath ? window.resolveAppPath(path) : `${window.AppConfig?.appBaseUrl || ''}${path}`;
  }

  function normalizePath(pathname) {
    const normalized = pathname.replace(/\/+$/, '');
    if (!normalized || normalized === '/') return 'dashboard';
    if (normalized.includes('/fill')) return 'fill';
    if (normalized.includes('/table')) return 'table';
    if (normalized.includes('/registro')) return 'registro';
    if (normalized.includes('/admin')) return 'admin';
    return 'dashboard';
  }

  async function loadUser() {
    try {
      const res = await fetch(window.getApiUrl('/auth/check'), { credentials: 'include' });
      const data = await res.json();
      if (!data.logged) {
        if (!window.location.pathname.includes('/login/')) {
          window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
        }
        return null;
      }
      return data.user;
    } catch (error) {
      if (!window.location.pathname.includes('/login/')) {
        window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
      }
      return null;
    }
  }

  function renderSidebar(user) {
    const nav = document.getElementById('appSidebarNav');
    const userInfo = document.getElementById('shellUserInfo');
    const pageId = normalizePath(window.location.pathname);

    if (!nav) return;

    const visibleItems = navItems.filter((item) => item.roles.includes(user?.role));
    nav.innerHTML = visibleItems.map((item) => {
      const isActive = item.id === pageId;
      return `
        <a class="app-sidebar__link${isActive ? ' active' : ''}" href="${resolvePath(item.path)}">
          <i class="fa-solid ${item.icon}"></i>
          <span>${item.label}</span>
        </a>
      `;
    }).join('');

    if (userInfo) {
      const roleLabel = user?.role === 'ADMIN' ? 'Administrador' : 'Técnico';
      userInfo.innerHTML = `
        <div class="app-sidebar__avatar">${(user?.nombre || user?.username || 'U').charAt(0).toUpperCase()}</div>
        <div>
          <strong>${user?.nombre || user?.username || 'Usuario'}</strong>
          <div class="app-sidebar__role">${roleLabel}</div>
        </div>
      `;
    }
  }

  function bindLogout() {
    const logoutButton = document.getElementById('appLogoutBtn');
    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        try {
          await fetch(`${window.AppConfig?.apiBaseUrl || '/api'}/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch (error) {
          console.warn('No se pudo cerrar la sesión de forma completa', error);
        }
        window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
      });
    }
  }

  async function initShell() {
    const user = await loadUser();
    if (!user) return;

    renderSidebar(user);
    bindLogout();

    const userBadge = document.getElementById('userInfo');
    if (userBadge) {
      userBadge.innerHTML = `<i class="fa-solid fa-user"></i> ${user.nombre || user.username || 'Usuario'}`;
    }
  }

  document.addEventListener('DOMContentLoaded', initShell);

  window.logoutApp = async function logoutApp() {
    try {
      await fetch(`${window.AppConfig?.apiBaseUrl || '/api'}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.warn('No se pudo cerrar la sesión de forma completa', error);
    }
    window.redirectTo?.(window.AppConfig?.loginPath || '/login/index.html', { replace: true });
  };

  window.logout = window.logoutApp;
})();
