import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    sourcemap: false,
    assetsDir: '.',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs in development mode
        drop_debugger: false
      },
      format: {
        comments: false
      }
    }
  },
  server: {
    port: 8080,
    strictPort: true,
  }
});