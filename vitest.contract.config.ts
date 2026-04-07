import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['tests/contracts/setup.ts'],
    include: ['tests/contracts/**/*.test.ts'],
    globals: true,
    clearMocks: true,
    restoreMocks: true,
  },
});

