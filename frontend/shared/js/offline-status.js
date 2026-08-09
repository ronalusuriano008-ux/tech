(function () {
  let hideTimer;
  function render(state = navigator.onLine ? 'synced' : 'offline', count = 0) {
    let el = document.getElementById('offlineStatus');
    if (!el) { el = document.createElement('button'); el.id = 'offlineStatus'; el.className = 'offline-status'; el.type = 'button'; el.title = 'Estado de sincronización'; document.body.appendChild(el); }
    const labels = { offline: 'Sin conexión', syncing: 'Sincronizando…', pending: `${count || ''} operación${count === 1 ? '' : 'es'} pendiente${count === 1 ? '' : 's'}`, synced: 'Todo sincronizado' };
    el.dataset.state = state; el.textContent = labels[state] || 'Online';
    el.onclick = () => window.DataService?.sync();
    window.clearTimeout(hideTimer);
    el.hidden = false;
    if (state === 'synced') {
      hideTimer = window.setTimeout(() => { el.hidden = true; }, 3500);
    }
  }
  async function refresh() { const items = await window.OfflineStore?.getOperations() || []; render(navigator.onLine ? (items.length ? 'pending' : 'synced') : 'offline', items.length); }
  document.addEventListener('DOMContentLoaded', refresh);
  window.addEventListener('online', refresh); window.addEventListener('offline', refresh);
  window.addEventListener('offline-operation-queued', refresh);
  window.addEventListener('offline-sync-state', (e) => render(e.detail.state, e.detail.count));
})();
