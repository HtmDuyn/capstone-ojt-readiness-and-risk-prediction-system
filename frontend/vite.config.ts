import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@components': path.resolve(import.meta.dirname, './src/components'),
      '@pages': path.resolve(import.meta.dirname, './src/pages'),
      '@layouts': path.resolve(import.meta.dirname, './src/layouts'),
      '@hooks': path.resolve(import.meta.dirname, './src/hooks'),
      '@contexts': path.resolve(import.meta.dirname, './src/contexts'),
      '@types': path.resolve(import.meta.dirname, './src/types'),
      '@utils': path.resolve(import.meta.dirname, './src/utils'),
      '@config': path.resolve(import.meta.dirname, './src/config'),
      '@services': path.resolve(import.meta.dirname, './src/services'),
      '@data': path.resolve(import.meta.dirname, './src/data'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'chart.js', 'lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('chart.js')) {
              return 'charts';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
          }
        },
      },
    },
  },
});
