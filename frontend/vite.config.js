const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Otimizações para Cloudflare Pages
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Desabilitar sourcemaps em produção

    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.message && warning.message.includes('EditOff.js')) return;
        warn(warning);
      },

      output: {
        // Code splitting otimizado para melhor caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],
          'supabase-vendor': ['@supabase/supabase-js'],
          'query-vendor': ['@tanstack/react-query'],
          'calendar-vendor': [
            '@fullcalendar/core',
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/interaction',
          ],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    chunkSizeWarningLimit: 1000, // 1MB
    minify: 'terser',
    cssCodeSplit: true,
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Remove console.log em produção (desabilitado temporariamente devido a erro de build)
    // drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'production'
    ),
  },

  // Preview server config
  preview: {
    port: 4173,
    strictPort: true,
  },
});
