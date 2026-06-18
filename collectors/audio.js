import { safeAsync, withTimeout } from '../utils/async.js';

/**
 * Generates an audio hardware fingerprint.
 * @returns {Promise<string>} - Audio rendering hash.
 */
export default async function collectAudio() {
  if (typeof window === 'undefined') {
    return 'node-env';
  }

  const AudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AudioContextClass) {
    return 'unsupported';
  }

  return await safeAsync(async () => {
    const runAudioRendering = new Promise((resolve) => {
      try {
        // Create context: 1 channel, 4096 samples, 44100 Hz sample rate
        const context = new AudioContextClass(1, 4096, 44100);

        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(10000, 0);

        const compressor = context.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, 0);
        compressor.knee.setValueAtTime(40, 0);
        compressor.ratio.setValueAtTime(12, 0);
        compressor.reduction.setValueAtTime(-20, 0);
        compressor.attack.setValueAtTime(0, 0);
        compressor.release.setValueAtTime(0.25, 0);

        oscillator.connect(compressor);
        compressor.connect(context.destination);

        oscillator.start(0);

        context.startRendering()
          .then((buffer) => {
            const data = buffer.getChannelData(0);
            const signature = data.slice(2048, 4096).reduce((acc, val) => acc + Math.abs(val), 0).toFixed(4);
            resolve(signature);
          })
          .catch(() => resolve('error'));
      } catch (e) {
        resolve('error');
      }
    });

    // Timeout audio rendering after 500ms if it gets stuck
    return await withTimeout(runAudioRendering, 500, 'timeout');
  }, 'error');
}