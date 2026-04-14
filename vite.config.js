import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev + build config.
 *
 * Security headers mirror the production meta-CSP in index.html. In real
 * deployments the server (Cloudflare, Nginx, Netlify `_headers`) must send
 * equivalent response headers — meta tags are a fallback.
 */
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy':
    'camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

export default defineConfig({
  plugins: [react()],
  server: {
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['framer-motion'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
