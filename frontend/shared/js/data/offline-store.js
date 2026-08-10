(function () {
  const DB_NAME = 'taller-tech-offline';
  const DB_VERSION = 2;
  let database;

  function open() {
    if (database) return database;
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('records')) db.createObjectStore('records', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('operations')) {
          const store = db.createObjectStore('operations', { keyPath: 'id' });
          store.createIndex('status', 'status');
          store.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return database;
  }

  async function transaction(storeName, mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const request = action(tx.objectStore(storeName));
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = () => reject(tx.error || request?.error);
      tx.onabort = () => reject(tx.error || request?.error);
    });
  }

  window.OfflineStore = {
    getRecord: (key) => transaction('records', 'readonly', (s) => s.get(key)).then((v) => v?.value),
    putRecord: (key, value) => transaction('records', 'readwrite', (s) => s.put({ key, value, updatedAt: Date.now() })),
    deleteRecord: (key) => transaction('records', 'readwrite', (s) => s.delete(key)),
    getMeta: (key) => transaction('meta', 'readonly', (s) => s.get(key)).then((v) => v?.value),
    putMeta: (key, value) => transaction('meta', 'readwrite', (s) => s.put({ key, value, updatedAt: Date.now() })),
    deleteMeta: (key) => transaction('meta', 'readwrite', (s) => s.delete(key)),
    addOperation: (operation) => transaction('operations', 'readwrite', (s) => s.put(operation)),
    getOperation: (id) => transaction('operations', 'readonly', (s) => s.get(id)),
    getOperations: () => transaction('operations', 'readonly', (s) => s.getAll()).then((items) => items.sort((a, b) => a.createdAt - b.createdAt)),
    removeOperation: (id) => transaction('operations', 'readwrite', (s) => s.delete(id))
  };
})();
