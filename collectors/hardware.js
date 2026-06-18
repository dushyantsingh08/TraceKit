import { safeAsync, withTimeout } from '../utils/async.js';

/**
 * Gathers hardware-specific specs and attributes.
 * @returns {Promise<object>}
 */
export default async function collectHardware() {
  if (typeof window === 'undefined') {
    return {};
  }

  return await safeAsync(async () => {
    const data = {
      platform: navigator.platform || 'unknown',
      cpuClass: navigator.cpuClass || 'unknown',
      deviceMemory: navigator.deviceMemory || -1,
      hardwareConcurrency: navigator.hardwareConcurrency || -1,
      devicePixelRatio: window.devicePixelRatio || 1,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      userAgentData: null
    };

    // Extract high-entropy userAgentData features if supported
    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      const entropyPromise = navigator.userAgentData.getHighEntropyValues([
        'architecture',
        'bitness',
        'model',
        'platformVersion'
      ]).then((vals) => ({
        architecture: vals.architecture || '',
        bitness: vals.bitness || '',
        model: vals.model || '',
        platformVersion: vals.platformVersion || '',
        mobile: vals.mobile || false
      }));

      data.userAgentData = await withTimeout(entropyPromise, 300, null);
    }

    return data;
  }, {});
}
