import { safeAsync, withTimeout } from '../utils/async.js';

/**
 * Gathers browser and device capabilities.
 * @returns {Promise<object>}
 */
export default async function collectCapabilities() {
  if (typeof window === 'undefined') {
    return {};
  }

  return await safeAsync(async () => {
    let storageQuota = -1;
    if (navigator.storage && navigator.storage.estimate) {
      // Wrap quota estimate in a timeout to avoid hangs
      const estimatePromise = navigator.storage.estimate().then(est => est.quota || -1);
      storageQuota = await withTimeout(estimatePromise, 300, -1);
    }

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const connectionDetails = connection ? {
      downlink: connection.downlink || 0,
      effectiveType: connection.effectiveType || 'unknown',
      rtt: connection.rtt || 0,
      saveData: !!connection.saveData
    } : null;

    return {
      touchSupport: 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || false,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      deviceMemory: navigator.deviceMemory || 0, // GBs
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      webdriver: navigator.webdriver || false,
      storageQuota,
      connection: connectionDetails
    };
  }, {});
}
