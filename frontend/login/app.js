// frontend/login/app.js
const redirectTo = window.redirectTo || ((path) => { window.location.href = path; });
const getApiUrl = window.getApiUrl || ((path = '') => `/api${path.startsWith('/') ? path : `/${path}`}`);

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('error');
    errorEl.style.display = 'none';

    const body = {
        usuario: document.getElementById('usuario').value,
        password: document.getElementById('password').value
    };

    try {
        const res = await fetch(getApiUrl('/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            errorEl.style.display = 'block';
            return;
        }

        const user = await res.json();
        localStorage.setItem('user', JSON.stringify(user));

        if (user.role === 'ADMIN') {
            redirectTo(window.AppConfig?.adminPath || '/admin/index.html');
        } else {
            redirectTo(window.AppConfig?.registroPath || '/registro/index.html');
        }
    } catch (error) {
        errorEl.textContent = 'Error de conexión';
        errorEl.style.display = 'block';
    }
});