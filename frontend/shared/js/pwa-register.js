(function () {
  const installState = {
    deferredPrompt: null,
    isInstalled: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  };

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      // Una actualización se anuncia y se activa al recargar: no se corta una edición offline.
      registration.addEventListener('updatefound', () => window.dispatchEvent(new CustomEvent('pwa-update-available')));
      window.addEventListener('online', () => registration.sync?.register('taller-tech-sync').catch(() => {}));
    } catch (error) {
      console.warn('[PWA] No se pudo registrar el service worker:', error);
    }
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installState.deferredPrompt = event;
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  window.addEventListener('appinstalled', () => {
    installState.deferredPrompt = null;
    installState.isInstalled = true;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });

  window.TallerPWA = {
    get canInstall() {
      return Boolean(installState.deferredPrompt);
    },
    get isInstalled() {
      return installState.isInstalled;
    },
    async install() {
      if (!installState.deferredPrompt) return false;

      installState.deferredPrompt.prompt();
      const result = await installState.deferredPrompt.userChoice;
      installState.deferredPrompt = null;
      return result.outcome === 'accepted';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerServiceWorker);
  } else {
    registerServiceWorker();
  }
})();
