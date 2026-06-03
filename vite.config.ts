import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['garu-ko'],
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
