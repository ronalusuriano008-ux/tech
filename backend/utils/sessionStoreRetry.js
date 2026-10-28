const RETRYABLE_ERRORS = new Set(['EPERM', 'EACCES', 'EBUSY']);

const wrapSessionStoreWrites = (store, {
    maxRetries = 3,
    baseDelayMs = 40,
    logger = console
} = {}) => {
    for (const method of ['set', 'touch']) {
        const writeSession = store[method].bind(store);
        store[method] = (...args) => {
            const callback = args[args.length - 1];
            if (typeof callback !== 'function') {
                return writeSession(...args);
            }

            let retries = 0;
            const attemptWrite = () => {
                writeSession(...args.slice(0, -1), (error, ...result) => {
                    if (error && RETRYABLE_ERRORS.has(error.code) && retries < maxRetries) {
                        const delay = baseDelayMs * (2 ** retries);
                        retries += 1;
                        setTimeout(attemptWrite, delay);
                        return;
                    }

                    if (error) {
                        logger.error(`[session-store] ${method} failed after ${retries + 1} attempt(s):`, error);
                    }
                    callback(error, ...result);
                });
            };

            attemptWrite();
        };
    }

    return store;
};

module.exports = { wrapSessionStoreWrites };
