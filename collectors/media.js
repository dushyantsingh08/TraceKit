import { safeAsync, withTimeout } from '../utils/async.js';

// List of codecs to test for playback support
const CODECS_TO_TEST = {
  // Audio
  mp3: 'audio/mpeg',
  oggVorbis: 'audio/ogg; codecs=vorbis',
  wav: 'audio/wav',
  aac: 'audio/aac',
  flac: 'audio/flac',
  m4a: 'audio/x-m4a',
  
  // Video
  h264: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
  webmH264: 'video/webm; codecs="vp8, vorbis"',
  vp9: 'video/webm; codecs="vp9"',
  hevc: 'video/mp4; codecs="hev1.1.6.L93.B0"',
  oggTheora: 'video/ogg; codecs="theora"'
};

/**
 * Checks codec support using HTML5 media elements.
 * @returns {object}
 */
function getCodecSupport() {
  const support = {};
  try {
    const audio = document.createElement('audio');
    const video = document.createElement('video');

    Object.entries(CODECS_TO_TEST).forEach(([key, mime]) => {
      const isVideo = mime.startsWith('video');
      const el = isVideo ? video : audio;
      const res = el.canPlayType(mime);
      support[key] = res === 'probably' ? 'probably' : res === 'maybe' ? 'maybe' : 'no';
    });
  } catch (e) {
    Object.keys(CODECS_TO_TEST).forEach((key) => {
      support[key] = 'error';
    });
  }
  return support;
}

/**
 * Safely counts media devices without triggering permission prompts.
 * @returns {Promise<object>}
 */
async function getMediaDeviceCounts() {
  const counts = {
    audioInput: 0,
    audioOutput: 0,
    videoInput: 0,
    total: 0
  };

  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return counts;
  }

  try {
    const devicesPromise = navigator.mediaDevices.enumerateDevices();
    const devices = await withTimeout(devicesPromise, 400, []);
    
    if (devices) {
      devices.forEach((device) => {
        if (device.kind === 'audioinput') counts.audioInput++;
        else if (device.kind === 'audiooutput') counts.audioOutput++;
        else if (device.kind === 'videoinput') counts.videoInput++;
      });
      counts.total = devices.length;
    }
  } catch (e) {}

  return counts;
}

/**
 * Gathers media features and device counts.
 * @returns {Promise<object>}
 */
export default async function collectMedia() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {};
  }

  return await safeAsync(async () => {
    const codecs = getCodecSupport();
    const devices = await getMediaDeviceCounts();

    return {
      codecs,
      devices
    };
  }, {});
}
