/**
 * @file vitest.config.js — Workers-pool Vitest config.
 *
 * Runs specs inside Miniflare-backed Workers isolates so `env`, `ctx`,
 * D1, KV, and WebCrypto all behave exactly like prod. No Node polyfills.
 */
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        singleWorker: true,
        miniflare: {
          compatibilityDate: '2024-10-01',
          compatibilityFlags: ['nodejs_compat'],
          bindings: {
            VERSION: '0.1.0-test',
            ALLOWED_ORIGINS: 'http://localhost:5173',
            MAX_BODY_BYTES: '262144',
            WRITE_RPM_PER_IP: '10',
            READ_RPM_PER_IP: '60',
            IDEMPOTENCY_TTL_SECONDS: '604800',
            SERVER_SECRET:
              'test-secret-test-secret-test-secret-test-secret-0123456789abcdef',
            RATE_LIMIT_SALT: 'test-rate-limit-salt',
          },
          kvNamespaces: ['IDEMPOTENCY', 'RATE_LIMIT'],
          d1Databases: ['DB'],
        },
      },
    },
  },
});
