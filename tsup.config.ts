import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['server/index.ts'],
  outDir: 'dist/server',
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  splitting: false,
  sourcemap: false,
  clean: true,
  dts: false,
  minify: false,
  bundle: true,
  skipNodeModulesBundle: true,
  esbuildOptions(options) {
    options.alias = {
      '@shared': './shared',
    };
  },
});
