import { getFingerprint, getComponents, murmurHash3 } from '../core/fingerprint.js';

export { getFingerprint as get, getComponents, murmurHash3 };

const TraceKit = {
  get: getFingerprint,
  getComponents,
  murmurHash3
};

export default TraceKit;
