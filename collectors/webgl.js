import { safeAsync } from '../utils/async.js';

/**
 * Creates a simple WebGL rendering fingerprint (hashing is done core-side, returns data URL).
 * @param {WebGLRenderingContext} gl - WebGL context.
 * @returns {string} - WebGL canvas data URL.
 */
function getWebGLImage(gl) {
  try {
    const canvas = gl.canvas;
    
    // Set up viewport and simple shaders
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vsSource = `
      attribute vec2 pos;
      varying vec2 v_pos;
      void main() {
        v_pos = pos;
        gl_Position = vec4(pos, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_pos;
      void main() {
        gl_FragColor = vec4(v_pos.x * 0.5 + 0.5, v_pos.y * 0.5 + 0.5, 0.5, 1.0);
      }
    `;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]), gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, 'pos');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return canvas.toDataURL();
  } catch (e) {
    return 'error';
  }
}

/**
 * Gathers graphics and GPU specifications.
 * @returns {Promise<object>}
 */
export default async function collectWebGL() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {};
  }

  return await safeAsync(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      return { supported: false };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const unmaskedVendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
    const unmaskedRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

    const webglData = {
      supported: true,
      vendor: gl.getParameter(gl.VENDOR) || '',
      renderer: gl.getParameter(gl.RENDERER) || '',
      version: gl.getParameter(gl.VERSION) || '',
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || '',
      unmaskedVendor,
      unmaskedRenderer,
      extensions: gl.getSupportedExtensions() || [],
      limits: {
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0,
        maxViewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS) || [0, 0]),
        maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE) || 0
      },
      image: getWebGLImage(gl)
    };

    // Clean up WebGL context memory if extension is available
    const loseContext = gl.getExtension('WEBGL_lose_context');
    if (loseContext) {
      loseContext.loseContext();
    }

    return webglData;
  }, {});
}
