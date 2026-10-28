const test = require('node:test');
const assert = require('node:assert/strict');
const { wrapSessionStoreWrites } = require('../utils/sessionStoreRetry');

test('session store retries transient Windows file-lock errors', async () => {
    let attempts = 0;
    const session = { user: { id: 'user-1' } };
    const store = {
        set(sessionId, value, callback) {
            attempts += 1;
            if (attempts < 3) {
                const error = new Error('File is temporarily locked');
                error.code = 'EPERM';
                callback(error);
                return;
            }
            callback(null, value);
        },
        touch(sessionId, value, callback) {
            callback(null, value);
        }
    };

    const wrappedStore = wrapSessionStoreWrites(store, { baseDelayMs: 1 });
    const result = await new Promise((resolve, reject) => {
        wrappedStore.set('session-1', session, (error, savedSession) => {
            if (error) return reject(error);
            resolve(savedSession);
        });
    });

    assert.equal(result, session);
    assert.equal(attempts, 3);
});

test('session store reports non-transient errors without retrying', async () => {
    let attempts = 0;
    const expectedError = Object.assign(new Error('Disk is full'), { code: 'ENOSPC' });
    const loggedErrors = [];
    const store = {
        set(sessionId, value, callback) {
            attempts += 1;
            callback(expectedError);
        },
        touch(sessionId, value, callback) {
            callback(null);
        }
    };
    const wrappedStore = wrapSessionStoreWrites(store, {
        logger: { error: (...args) => loggedErrors.push(args) }
    });

    const error = await new Promise((resolve) => {
        wrappedStore.set('session-1', {}, (writeError) => resolve(writeError));
    });

    assert.equal(error, expectedError);
    assert.equal(attempts, 1);
    assert.equal(loggedErrors.length, 1);
});
