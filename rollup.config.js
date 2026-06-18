import terser from '@rollup/plugin-terser';

export default [
  // Build standard ES module and CommonJS bundles
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/index.mjs',
        format: 'es',
        sourcemap: true
      }
    ]
  },
  // Build minified UMD bundle for direct browser script imports
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'TraceKit',
      exports: 'named',
      sourcemap: true
    },
    plugins: [terser()]
  }
];
