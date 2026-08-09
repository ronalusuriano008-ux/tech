(function () {
    const defaults = {
        success: {
            title: 'Listo',
            icon: 'OK',
            message: 'La accion se completo correctamente.'
        },
        error: {
            title: 'No se pudo completar',
            icon: '!',
            message: 'Ocurrio un problema. Intentalo nuevamente.'
        },
        warning: {
            title: 'Atencion',
            icon: '!',
            message: 'Revisa la informacion antes de continuar.'
        },
        info: {
            title: 'Informacion',
            icon: 'i',
            message: 'Hay informacion disponible.'
        }
    };

    const networkMessages = {
        offline: 'Parece que no hay conexion a internet. Revisa tu red e intenta nuevamente.',
        failed: 'No se pudo conectar con el servidor. Verifica tu conexion o intenta otra vez en unos segundos.',
        timeout: 'La solicitud esta demorando mas de lo normal. Intenta nuevamente.',
        unauthorized: 'Tu sesion vencio. Vuelve a iniciar sesion para continuar.',
        forbidden: 'No tienes permisos para realizar esta accion.',
        notFound: 'No se encontro la informacion solicitada.',
        server: 'El servidor tuvo un problema al procesar la solicitud.',
        generic: 'No se pudo completar la accion. Intenta nuevamente.'
    };

    function ensureStack() {
        let stack = document.querySelector('[data-app-message-stack]');
        if (!stack) {
            stack = document.createElement('div');
            stack.className = 'app-message-stack';
            stack.setAttribute('data-app-message-stack', '');
            stack.setAttribute('aria-live', 'polite');
            stack.setAttribute('aria-relevant', 'additions');
            document.body.appendChild(stack);
        }
        return stack;
    }

    function getNetworkMessage(error, fallback) {
        if (typeof fallback === 'string' && fallback.trim()) return fallback;
        if (!navigator.onLine) return networkMessages.offline;
        if (error?.name === 'AbortError') return networkMessages.timeout;
        if (error?.status === 401) return networkMessages.unauthorized;
        if (error?.status === 403) return networkMessages.forbidden;
        if (error?.status === 404) return networkMessages.notFound;
        if (error?.status >= 500) return networkMessages.server;
        if (/failed to fetch|networkerror|load failed/i.test(error?.message || '')) {
            return networkMessages.failed;
        }
        return error?.message || networkMessages.generic;
    }

    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }

    function show(options = {}) {
        const type = ['success', 'error', 'warning', 'info'].includes(options.type)
            ? options.type
            : 'info';
        const preset = defaults[type];
        const stack = ensureStack();
        const message = document.createElement('section');
        message.className = `app-message app-message--${type}`;
        message.setAttribute('role', type === 'error' ? 'alert' : 'status');

        const title = options.title || preset.title;
        const text = options.message || preset.message;
        const icon = options.icon || preset.icon;

        message.innerHTML = `
            <span class="app-message__icon" aria-hidden="true">${escapeHtml(icon)}</span>
            <div class="app-message__content">
                <p class="app-message__title">${escapeHtml(title)}</p>
                <p class="app-message__text">${escapeHtml(text)}</p>
            </div>
            <button class="app-message__close" type="button" aria-label="Cerrar mensaje">&times;</button>
        `;

        const close = () => {
            message.classList.remove('is-visible');
            window.setTimeout(() => message.remove(), 180);
        };

        message.querySelector('.app-message__close').addEventListener('click', close);
        stack.appendChild(message);
        window.requestAnimationFrame(() => message.classList.add('is-visible'));

        const duration = Number.isFinite(options.duration) ? options.duration : 3600;
        if (duration > 0) window.setTimeout(close, duration);

        return close;
    }

    function legacyToast(message, isError = false) {
        show({
            type: isError ? 'error' : 'success',
            title: isError ? defaults.error.title : defaults.success.title,
            message
        });
    }

    function inline(target, options = {}) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) return;
        const type = options.type || 'info';
        el.className = `app-message-inline is-${type}`;
        el.textContent = options.message || defaults[type]?.message || defaults.info.message;
        el.style.display = '';
    }

    window.AppMessages = {
        show,
        success: (message, options = {}) => show({ ...options, type: 'success', message }),
        error: (message, options = {}) => show({ ...options, type: 'error', message }),
        warning: (message, options = {}) => show({ ...options, type: 'warning', message }),
        info: (message, options = {}) => show({ ...options, type: 'info', message }),
        networkError: (error, options = {}) => show({
            ...options,
            type: 'error',
            message: getNetworkMessage(error, options.fallback)
        }),
        getNetworkMessage,
        inline,
        toast: legacyToast,
        messages: networkMessages
    };

    window.showAppMessage = show;
    window.showToast = window.showToast || legacyToast;

    window.addEventListener('offline', () => {
        show({
            type: 'warning',
            title: 'Sin internet',
            message: networkMessages.offline,
            duration: 0
        });
    });

    window.addEventListener('online', () => {
        show({
            type: 'success',
            title: 'Conexion restaurada',
            message: 'Ya puedes seguir trabajando normalmente.'
        });
    });
})();
