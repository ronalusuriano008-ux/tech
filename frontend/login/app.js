// frontend/login/app.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('error');
    errorEl.style.display = 'none';
    
    const body = {
        usuario: document.getElementById('usuario').value,
        password: document.getElementById('password').value
    };

    try {
        const res = await fetch('/api/auth/login', {
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
            window.location.href = '/admin/index.html';
        } else {
            window.location.href = '/registro/index.html';
        }
    } catch (error) {
        errorEl.textContent = 'Error de conexión';
        errorEl.style.display = 'block';
    }
});