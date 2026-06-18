import collectAudio from '../collectors/audio.js';
import collectBrowser from '../collectors/browser.js';
import collectCapabilities from '../collectors/capabilities.js';
import collectFonts from '../collectors/fonts.js';
import collectHardware from '../collectors/hardware.js';
import collectMedia from '../collectors/media.js';
import collectPermission from '../collectors/permission.js';
import collectScreen from '../collectors/screen.js';
import collectWebGL from '../collectors/webgl.js';

/**
 * Standard MurmurHash3 32-bit hashing algorithm.
 * @param {string} key - String to hash.
 * @param {number} [seed=0] - Hashing seed.
 * @returns {string} - Hexadecimal representation of the hash.
 */
export function murmurHash3(key, seed = 0) {
  const remainder = key.length & 3;
  const bytes = key.length - remainder;
  let h1 = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let i = 0;

  while (i < bytes) {
    let k1 =
      (key.charCodeAt(i) & 0xff) |
      ((key.charCodeAt(++i) & 0xff) << 8) |
      ((key.charCodeAt(++i) & 0xff) << 16) |
      ((key.charCodeAt(++i) & 0xff) << 24);
    ++i;

    // k1 * c1
    k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
    // Rotate left 15
    k1 = (k1 << 15) | (k1 >>> 17);
    // k1 * c2
    k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;

    h1 ^= k1;
    // Rotate left 13
    h1 = (h1 << 13) | (h1 >>> 19);
    // h1 * 5 + 0xe6546b64
    const h1b = (((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16)) & 0xffffffff;
    h1 = ((h1b & 0xffff) + 0xf6e8 + ((((h1b >>> 16) + 0x6b64) & 0xffff) << 16)) & 0xffffffff;
  }

  let k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
    case 2:
      k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
    case 1:
      k1 ^= key.charCodeAt(i) & 0xff;

      k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
      h1 ^= k1;
  }

  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
  h1 ^= h1 >>> 13;
  h1 = (((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) & 0xffffffff;
  h1 ^= h1 >>> 16;

  return (h1 >>> 0).toString(16).padStart(8, '0');
}

/**
 * Deterministically stringifies an object by sorting keys.
 * @param {any} obj - Object to stringify.
 * @returns {string}
 */
export function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const parts = sortedKeys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`);
  return '{' + parts.join(',') + '}';
}

/**
 * Gathers components and filters them into stable and dynamic categories.
 * @returns {Promise<object>}
 */
export async function getComponents() {
  if (typeof window === 'undefined') {
    return { stable: {}, dynamic: {} };
  }

  // Run all collectors concurrently
  const [
    audio,
    browser,
    capabilities,
    fonts,
    hardware,
    media,
    permission,
    screen,
    webgl
  ] = await Promise.all([
    collectAudio(),
    collectBrowser(),
    collectCapabilities(),
    collectFonts(),
    collectHardware(),
    collectMedia(),
    collectPermission(),
    collectScreen(),
    collectWebGL()
  ]);

  // Distinguish between stable (hashing) and dynamic (informational) components
  const stable = {
    audio,
    browser: {
      userAgent: browser.userAgent,
      language: browser.language,
      languages: browser.languages,
      timezone: browser.timezone,
      cookieEnabled: browser.cookieEnabled,
      storage: browser.storage,
      plugins: browser.plugins,
      canvas: browser.canvas,
      doNotTrack: browser.doNotTrack,
      pdfViewerEnabled: browser.pdfViewerEnabled
    },
    capabilities: {
      touchSupport: capabilities.touchSupport,
      maxTouchPoints: capabilities.maxTouchPoints,
      deviceMemory: capabilities.deviceMemory,
      hardwareConcurrency: capabilities.hardwareConcurrency,
      webdriver: capabilities.webdriver
    },
    fonts,
    hardware: {
      platform: hardware.platform,
      cpuClass: hardware.cpuClass,
      deviceMemory: hardware.deviceMemory,
      hardwareConcurrency: hardware.hardwareConcurrency,
      userAgentData: hardware.userAgentData
    },
    media: {
      codecs: media.codecs
    },
    permission,
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth
    },
    webgl: {
      supported: webgl.supported,
      vendor: webgl.vendor,
      renderer: webgl.renderer,
      version: webgl.version,
      shadingLanguageVersion: webgl.shadingLanguageVersion,
      unmaskedVendor: webgl.unmaskedVendor,
      unmaskedRenderer: webgl.unmaskedRenderer,
      extensions: webgl.extensions,
      limits: webgl.limits,
      image: webgl.image
    }
  };

  const dynamic = {
    browser: {
      timezoneOffset: browser.timezoneOffset
    },
    capabilities: {
      storageQuota: capabilities.storageQuota,
      connection: capabilities.connection
    },
    hardware: {
      devicePixelRatio: hardware.devicePixelRatio
    },
    media: {
      devices: media.devices
    },
    screen: {
      orientation: screen.orientation
    }
  };

  return { stable, dynamic };
}

/**
 * Returns the final fingerprint visitor ID and full components profile.
 * @returns {Promise<object>}
 */
export async function getFingerprint() {
  const { stable, dynamic } = await getComponents();
  const serialized = stableStringify(stable);
  const visitorId = murmurHash3(serialized);
  
  return {
    visitorId,
    components: {
      stable,
      dynamic
    }
  };
}
