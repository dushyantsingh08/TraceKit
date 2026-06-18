import { safeAsync, withTimeout } from '../utils/async.js';

// Permissions list to query
const PERMISSIONS_TO_QUERY = [
  'geolocation',
  'notifications',
  'push',
  'midi',
  'camera',
  'microphone',
  'background-sync',
  'ambient-light-sensor',
  'accelerometer',
  'gyroscope',
  'magnetometer'
];

/**
 * Safely queries individual API permission states.
 * @param {string} name - Permission API name.
 * @returns {Promise<string>} - Permission state ('granted', 'denied', 'prompt', 'unsupported', 'error').
 */
async function queryPermission(name) {
  if (!navigator.permissions || !navigator.permissions.query) {
    return 'unsupported';
  }

  try {
    const queryPromise = navigator.permissions.query({ name });
    const permissionStatus = await withTimeout(queryPromise, 300, null);

    if (permissionStatus) {
      return permissionStatus.state; // 'granted', 'denied', or 'prompt'
    }
    return 'timeout';
  } catch (e) {
    // If the browser throws an error for a permission name it doesn't recognize (e.g., ambient-light-sensor in Safari)
    return 'unsupported';
  }
}

/**
 * Gathers permission status fingerprints.
 * @returns {Promise<object>}
 */
export default async function collectPermission() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {};
  }

  return await safeAsync(async () => {
    const states = {};
    
    // Query permissions in parallel
    const queries = PERMISSIONS_TO_QUERY.map(async (name) => {
      const state = await queryPermission(name);
      states[name] = state;
    });

    await Promise.all(queries);
    return states;
  }, {});
}
