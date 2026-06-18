import { safeAsync } from '../utils/async.js';

/**
 * Generates a stable canvas 2D fingerprint.
 * @returns {string} - Canvas data URL.
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'unsupported';

    // Draw background/gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f06');
    gradient.addColorStop(1, '#0f6');
    ctx.fillStyle = gradient;
    ctx.fillRect(10, 10, 180, 30);

    // Draw text with shadow
    ctx.fillStyle = '#06f';
    ctx.font = '16px "Arial", "sans-serif", "Segoe UI Emoji"';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText('TraceKit 🚀 🔍', 20, 15);

    // Additional drawing to increase entropy
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(150, 25, 15, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.stroke();

    return canvas.toDataURL();
  } catch (e) {
    return 'error';
  }
}

/**
 * Gathers active plugins.
 * @returns {Array<string>}
 */
function getPlugins() {
  if (!navigator.plugins) return [];
  const list = [];
  for (let i = 0; i < navigator.plugins.length; i++) {
    const p = navigator.plugins[i];
    if (p) {
      list.push(`${p.name}::${p.description}`);
    }
  }
  return list;
}

/**
 * Checks storage API availability.
 * @returns {object}
 */
function getStorageSupport() {
  const support = {
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    openDatabase: typeof window.openDatabase !== 'undefined'
  };

  try {
    support.localStorage = typeof window.localStorage !== 'undefined';
  } catch (e) {}

  try {
    support.sessionStorage = typeof window.sessionStorage !== 'undefined';
  } catch (e) {}

  try {
    support.indexedDB = typeof window.indexedDB !== 'undefined';
  } catch (e) {}

  return support;
}

/**
 * Gathers browser attributes.
 * @returns {Promise<object>}
 */
export default async function collectBrowser() {
  if (typeof window === 'undefined') {
    return {};
  }

  return await safeAsync(async () => {
    let timezone = 'unknown';
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {}

    return {
      userAgent: navigator.userAgent,
      language: navigator.language || '',
      languages: navigator.languages ? Array.from(navigator.languages) : [],
      timezone,
      timezoneOffset: new Date().getTimezoneOffset(),
      cookieEnabled: navigator.cookieEnabled,
      storage: getStorageSupport(),
      plugins: getPlugins(),
      canvas: getCanvasFingerprint(),
      doNotTrack: navigator.doNotTrack || window.doNotTrack || 'unspecified',
      pdfViewerEnabled: !!navigator.pdfViewerEnabled
    };
  }, {});
}
