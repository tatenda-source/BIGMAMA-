import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/chaos/**/*.chaos.test.js'],
    setupFiles: ['./tests/setup.js'],
    testTimeout: 15_000,
  },
});
