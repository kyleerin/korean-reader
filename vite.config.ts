import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { translateApiPlugin } from './vite.translate-api';

export default defineConfig({
  base: process.env.VITE_BASE_URL ?? '/',
  plugins: [react(), translateApiPlugin()],
  optimizeDeps: {
    exclude: ['garu-ko'],
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
