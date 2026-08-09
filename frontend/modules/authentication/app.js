// frontend/login/app.js
const redirectTo = window.redirectTo || ((path) => { window.location.href = path; });
const getApiUrl = window.getApiUrl || ((path = '') => `/api${path.startsWith('/') ? path : `/${path}`}`);

async function redirectIfAuthenticated() {
    try {
        const res = await fetch(getApiUrl('/auth/check'), { credentials: 'include' });
        if (!res.ok) return;

        const data = await res.json();
        if (data.logged) {
            const target = data.user?.role === 'ADMIN'
                ? window.AppConfig?.adminPath || '/admin/index.html'
                : window.AppConfig?.registroPath || '/registro/index.html';
            redirectTo(target, { replace: true });
        }
    } catch {
        // No action; el usuario no está autenticado o la sesión no es válida.
    }
}

redirectIfAuthenticated();

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('error');
    errorEl.style.display = 'none';
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const submitText = submitBtn?.innerHTML;

    const body = {
        usuario: document.getElementById('usuario').value,
        password: document.getElementById('password').value
    };

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Ingresando...';
        }

        const res = await fetch(getApiUrl('/auth/login'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const message = res.status === 401
                ? 'Usuario o contraseña incorrectos.'
                : 'No se pudo iniciar sesión. Inténtalo nuevamente.';
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            window.AppMessages?.warning(message, { title: 'Acceso no autorizado' });
            return;
        }

        const user = await res.json();
        // La cookie httpOnly conserva la sesión; IndexedDB solo guarda un perfil de UI no sensible.
        await window.OfflineStore?.putMeta('session-profile', { user, verifiedAt: Date.now() });
        localStorage.removeItem('user');

        if (user.role === 'ADMIN') {
            redirectTo(window.AppConfig?.adminPath || '/admin/index.html', { replace: true });
        } else {
            redirectTo(window.AppConfig?.registroPath || '/registro/index.html', { replace: true });
        }
    } catch (error) {
        const message = window.AppMessages?.getNetworkMessage(error)
            || 'No se pudo conectar. Revisa tu internet e intenta nuevamente.';
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        window.AppMessages?.networkError(error, { title: 'Fallo de conexión' });
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitText;
        }
    }
});
