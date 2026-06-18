import { safeAsync } from '../utils/async.js';

/**
 * Gathers screen and display metrics.
 * @returns {Promise<object>}
 */
export default async function collectScreen() {
  if (typeof window === 'undefined') {
    return {};
  }

  return await safeAsync(async () => {
    let orientationType = 'unknown';
    let orientationAngle = 0;

    if (window.screen && window.screen.orientation) {
      orientationType = window.screen.orientation.type || 'unknown';
      orientationAngle = window.screen.orientation.angle || 0;
    } else if (window.screen && window.screen.msOrientation) {
      orientationType = window.screen.msOrientation;
    }

    return {
      width: window.screen.width || -1,
      height: window.screen.height || -1,
      availWidth: window.screen.availWidth || -1,
      availHeight: window.screen.availHeight || -1,
      colorDepth: window.screen.colorDepth || -1,
      pixelDepth: window.screen.pixelDepth || -1,
      orientation: {
        type: orientationType,
        angle: orientationAngle
      }
    };
  }, {});
}
