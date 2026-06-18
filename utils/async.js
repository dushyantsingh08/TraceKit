/**
 * Safety wrapper for asynchronous operations to prevent slow APIs from blocking fingerprint generation.
 * @param {Promise<any>} promise - The promise to run.
 * @param {number} ms - Timeout in milliseconds.
 * @param {any} defaultValue - Value returned if the promise times out.
 * @returns {Promise<any>}
 */
export function withTimeout(promise, ms, defaultValue = null) {
  return new Promise((resolve) => {
    let timeoutId = setTimeout(() => {
      timeoutId = null;
      resolve(defaultValue);
    }, ms);

    promise
      .then((val) => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          resolve(val);
        }
      })
      .catch(() => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          resolve(defaultValue);
        }
      });
  });
}

/**
 * Execute an async function, catching errors and returning a default value.
 * @param {Function} fn - The async function to execute.
 * @param {any} defaultValue - Default value returned on error.
 * @returns {Promise<any>}
 */
export async function safeAsync(fn, defaultValue = null) {
  try {
    return await fn();
  } catch (e) {
    return defaultValue;
  }
}
