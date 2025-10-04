import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env variables regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    // Base public path when served in production
    base: '/',
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['@supabase/supabase-js'],
          },
        },
      },
      chunkSizeWarningLimit: 1000, // in kbs
    },
    // Server configuration
    server: {
      port: 3000,
      strictPort: true,
      hmr: {
        clientPort: 3000,
      },
    },
    // Environment variables configuration
    define: {
      'process.env': {
        ...Object.entries(env).reduce((prev, [key, val]) => {
          // Only include environment variables with VITE_ prefix for client-side
          if (key.startsWith('VITE_')) {
            return {
              ...prev,
              [key]: val,
            };
          }
          return prev;
        }, {}),
      },
    },
    // Resolve configuration
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  };
});
