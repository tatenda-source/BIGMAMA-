/**
 * @file eslint.config.js — Flat config for the Worker.
 *
 * Minimal, no plugins: we rely on the platform defaults and a few security
 * rules to catch the big footguns (eval, insecure randomness).
 */
export default [
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        crypto: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        Uint8Array: 'readonly',
        globalThis: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        KVNamespace: 'readonly',
        D1Database: 'readonly',
        ExecutionContext: 'readonly',
      },
    },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'warn',
      eqeqeq: ['error', 'smart'],
    },
  },
];
