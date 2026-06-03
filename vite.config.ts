import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_BASE_URL ?? '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['garu-ko'],
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
