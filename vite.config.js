import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev + build config.
 *
 * Security headers mirror the production meta-CSP in index.html. In real
 * deployments the server (Cloudflare, Nginx, Netlify `_headers`) must send
 * equivalent response headers — meta tags are a fallback.
 */
// CSP lives on HTTP responses, not in the HTML meta (meta ignores
// frame-ancestors and browsers intersect the two). The full production
// policy is owned by the deploy target — see docs/security.md.
//
// Dev server DOES NOT send CSP: Vite's HMR WebSocket + React Fast Refresh
// inline-evals would be blocked even with permissive directives on some
// browsers, and dev is localhost-only anyway. The preview server simulates
// production so we can validate CSP before shipping.
const baseSecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy':
    'camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), interest-cohort=()',
};

const previewSecurityHeaders = {
  ...baseSecurityHeaders,
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

export default defineConfig({
  plugins: [react()],
  server: {
    headers: baseSecurityHeaders,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE || 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    headers: previewSecurityHeaders,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE || 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-dom') || /node_modules\/react(\/|\\)/.test(id)) return 'react';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('lucide-react')) return 'icons';
        },
      },
    },
  },
});
