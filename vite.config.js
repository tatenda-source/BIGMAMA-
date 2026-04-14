import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev + build config.
 *
 * Security headers mirror the production meta-CSP in index.html. In real
 * deployments the server (Cloudflare, Nginx, Netlify `_headers`) must send
 * equivalent response headers — meta tags are a fallback.
 */
// CSP with frame-ancestors lives in HTTP headers here (it's ignored from a
// meta tag). The full production policy is tracked in docs/security.md.
const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
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
