import { safeAsync } from '../utils/async.js';

// Predefined list of standard system fonts to check
const FONTS_TO_TEST = [
  'Arial',
  'Arial Black',
  'Arial Narrow',
  'Book Antiqua',
  'Bookman Old Style',
  'Calibri',
  'Cambria',
  'Candara',
  'Century Gothic',
  'Comic Sans MS',
  'Courier New',
  'Garamond',
  'Georgia',
  'Impact',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Microsoft Sans Serif',
  'Monaco',
  'Monotype Corsiva',
  'MS Gothic',
  'Palatino Linotype',
  'Segoe UI',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  'Wingdings'
];

/**
 * Detects system fonts by measuring rendering dimensions against fallback fonts.
 * @returns {Promise<Array<string>>} - List of detected fonts.
 */
export default async function collectFonts() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return [];
  }

  return await safeAsync(async () => {
    const testString = 'mmmmmmmmmmlli';
    const fontSize = '72px';
    
    // Create element for measuring
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.visibility = 'hidden';
    container.style.display = 'block';

    const baseSpans = {};
    const fallbacks = ['sans-serif', 'serif', 'monospace'];

    // Create base spans to measure fallback sizes
    fallbacks.forEach((fallback) => {
      const span = document.createElement('span');
      span.style.fontSize = fontSize;
      span.style.fontFamily = fallback;
      span.textContent = testString;
      container.appendChild(span);
      baseSpans[fallback] = span;
    });

    document.body.appendChild(container);

    // Get baseline sizes
    const baseWidths = {};
    const baseHeights = {};
    fallbacks.forEach((fallback) => {
      baseWidths[fallback] = baseSpans[fallback].offsetWidth;
      baseHeights[fallback] = baseSpans[fallback].offsetHeight;
    });

    // Create test span
    const testSpan = document.createElement('span');
    testSpan.style.fontSize = fontSize;
    testSpan.textContent = testString;
    container.appendChild(testSpan);

    const detectedFonts = [];

    // Check each font
    FONTS_TO_TEST.forEach((font) => {
      let isPresent = false;
      
      // A font is present if its width/height differs from at least one fallback
      // when we configure it as "Font, Fallback"
      for (let i = 0; i < fallbacks.length; i++) {
        const fallback = fallbacks[i];
        testSpan.style.fontFamily = `"${font}", ${fallback}`;
        
        const currentWidth = testSpan.offsetWidth;
        const currentHeight = testSpan.offsetHeight;

        if (currentWidth !== baseWidths[fallback] || currentHeight !== baseHeights[fallback]) {
          isPresent = true;
          break;
        }
      }

      if (isPresent) {
        detectedFonts.push(font);
      }
    });

    // Clean up DOM
    document.body.removeChild(container);

    return detectedFonts;
  }, []);
}
