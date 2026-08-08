import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // Remplace __dirname par fileURLToPath(new URL(...))
        // Pointe vers '.' (racine) ou './src' selon l'organisation de ton projet
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    server: {
      // HMR désactivé si DISABLE_HMR vaut 'true'
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            icons: ['lucide-react'],
            animation: ['framer-motion'],
          },
        },
      },
    },
  };
});