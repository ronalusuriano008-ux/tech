(function () {
  const config = () => window.AppConfig?.offline || {};
  const networkFetch = (...args) => (window.__appNativeFetch || window.fetch)(...args);
  const event = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
  const id = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const isNetworkFailure = (error) => error instanceof TypeError || /network|fetch|offline/i.test(error?.message || '');

  async function parse(response) {
    const type = response.headers.get('content-type') || '';
    if (!response.ok) {
      const body = type.includes('json') ? await response.json().catch(() => ({})) : await response.text();
      const error = new Error(body?.error || body?.message || body || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return type.includes('json') ? response.json() : response;
  }

  async function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const url = window.getApiUrl ? window.getApiUrl(path) : `/api${path}`;
    const cacheKey = `api:${url}`;
    const init = { credentials: 'include', ...options, headers: { Accept: 'application/json', ...(options.headers || {}) } };

    if (method === 'GET') {
      try {
        const data = await networkFetch(url, init).then(parse);
        await window.OfflineStore?.putRecord(cacheKey, data);
        return data;
      } catch (error) {
        const cached = await window.OfflineStore?.getRecord(cacheKey);
        if (cached !== undefined) return cached;
        throw error;
      }
    }

    const operationId = options.operationId || id();
    init.headers = { ...init.headers, 'X-Operation-Id': operationId };
    try {
      if (!navigator.onLine) throw new TypeError('offline');
      return await networkFetch(url, init).then(parse);
    } catch (error) {
      if (!isNetworkFailure(error) || options.queue === false) throw error;
      const profile = await window.OfflineStore.getMeta('session-profile');
      const operation = {
        id: operationId, method, path, body: options.body || null,
        headers: { 'Content-Type': init.headers['Content-Type'] || init.headers['content-type'] || '' },
        resourceKey: options.resourceKey || path, createdAt: Date.now(), updatedAt: Date.now(),
        retries: 0, status: 'pending', ownerId: profile?.user?.id || null
      };
      await window.OfflineStore.addOperation(operation);
      event('offline-operation-queued', operation);
      return { queued: true, operationId, offline: true };
    }
  }

  async function sync() {
    if (!navigator.onLine) return;
    const profile = await window.OfflineStore.getMeta('session-profile');
    const operations = (await window.OfflineStore.getOperations()).filter((operation) => !operation.ownerId || operation.ownerId === profile?.user?.id);
    for (const operation of operations) {
      if (operation.status === 'failed' && operation.retries >= (config().maxRetries || 5)) continue;
      operation.status = 'syncing'; operation.updatedAt = Date.now();
      await window.OfflineStore.addOperation(operation); event('offline-sync-state', { state: 'syncing', operation });
      try {
        const headers = { Accept: 'application/json', 'X-Operation-Id': operation.id };
        if (operation.headers['Content-Type']) headers['Content-Type'] = operation.headers['Content-Type'];
        const response = await networkFetch(window.getApiUrl(operation.path), { method: operation.method, credentials: 'include', headers, body: operation.body });
        if (response.status === 409) { operation.status = 'conflict'; operation.error = 'El dato cambió en el servidor.'; await window.OfflineStore.addOperation(operation); continue; }
        await parse(response);
        await window.OfflineStore.removeOperation(operation.id);
      } catch (error) {
        operation.retries += 1; operation.updatedAt = Date.now(); operation.error = error.message;
        operation.status = isNetworkFailure(error) ? 'pending' : 'failed';
        await window.OfflineStore.addOperation(operation);
        if (isNetworkFailure(error)) break;
      }
    }
    const remaining = await window.OfflineStore.getOperations();
    event('offline-sync-state', { state: remaining.length ? 'pending' : 'synced', count: remaining.length });
  }

  window.DataService = { request, get: (path, options) => request(path, { ...options, method: 'GET' }), create: (path, body, options = {}) => request(path, { ...options, method: 'POST', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, body: JSON.stringify(body) }), update: (path, body, options = {}) => request(path, { ...options, method: options.method || 'PUT', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, body: JSON.stringify(body) }), delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }), sync };
  window.addEventListener('online', () => sync());
  window.addEventListener('offline-operation-queued', () => { if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then((r) => r.sync?.register('taller-tech-sync')).catch(() => {}); });
})();
