(function () {
  const nativeFetch = window.__appNativeFetch || window.fetch.bind(window);
  window.__appNativeFetch = nativeFetch;
  const ttl = () => Number(window.AppConfig?.offline?.dataCacheTtlMs || 120000);

  function canCache(request, url) {
    if ((request.method || 'GET').toUpperCase() !== 'GET' || url.origin !== location.origin) return false;
    if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/data/')) return false;
    return !/\/(auth|backup|reportes)\b/.test(url.pathname);
  }

  async function keyFor(url) {
    const profile = await window.OfflineStore?.getMeta('session-profile');
    return `http:${profile?.user?.id || 'anonymous'}:${url.href}`;
  }

  window.fetch = async function cachedFetch(input, init = {}) {
    const request = input instanceof Request ? input : new Request(new URL(input, location.origin), init);
    const url = new URL(request.url, location.origin);
    if (!canCache(request, url) || !window.OfflineStore) return nativeFetch(input, init);

    const key = await keyFor(url);
    const cached = await window.OfflineStore.getRecord(key);
    const isFresh = cached && Date.now() - cached.cachedAt < ttl();
    if (isFresh) {
      // Actualiza en segundo plano; la UI responde inmediatamente con la copia reciente.
      nativeFetch(input, init).then(async (response) => {
        if (response.ok) await save(key, response.clone());
      }).catch(() => {});
      return new Response(cached.body, { status: cached.status, headers: cached.headers });
    }

    try {
      const response = await nativeFetch(input, init);
      if (response.ok) await save(key, response.clone());
      return response;
    } catch (error) {
      if (cached) return new Response(cached.body, { status: cached.status, headers: cached.headers });
      throw error;
    }
  };

  async function save(key, response) {
    const type = response.headers.get('content-type') || '';
    if (!/json|text\//i.test(type)) return;
    const body = await response.text();
    await window.OfflineStore.putRecord(key, {
      body, status: response.status, headers: { 'content-type': type }, cachedAt: Date.now()
    });
  }
})();
