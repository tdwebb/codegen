import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'es2020',
  dts: {
    resolve: true,
  },
  sourcemap: true,
  clean: true,
  splitting: false,
  shims: true,
  skipNodeModulesBundle: true,
});
