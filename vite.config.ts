import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'icons': ['lucide-react'],
          'pdf': ['jspdf', 'html2canvas']
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    strictPort: false,
    cors: true,
    hmr: {
      overlay: true,
      clientPort: 5173
    },
    headers: {
      'Service-Worker-Allowed': '/',
      'Access-Control-Allow-Origin': '*'
    },
    watch: {
      usePolling: true
    }
  }
});
