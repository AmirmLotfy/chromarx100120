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
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    sourcemap: process.env.MODE === 'development',
    minify: process.env.MODE === 'development' ? false : 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.MODE !== 'development',
        drop_debugger: process.env.MODE !== 'development'
      }
    },
    watch: null
  },
  server: {
    port: 8080,
    strictPort: true,
    hmr: {
      port: 8080
    }
  }
});