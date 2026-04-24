import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // В режиме разработки /api/* проксируется на NestJS, чтобы не настраивать CORS вручную.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    coverage: { provider: 'v8', reporter: ['text', 'json', 'html'] },
  },
});
