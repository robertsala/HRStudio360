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
  external: [
    'vite',
    'argon2',
    '@sentry/node',
    'openai',
    'resend',
    '@google-cloud/storage',
    'google-auth-library',
    'speakeasy',
    'qrcode',
    'jspdf',
    'html2canvas',
  ],
});
