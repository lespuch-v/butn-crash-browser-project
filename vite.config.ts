import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@ecs': resolve(__dirname, 'src/ecs'),
      '@systems': resolve(__dirname, 'src/systems'),
      '@grid': resolve(__dirname, 'src/grid'),
      '@modifiers': resolve(__dirname, 'src/modifiers'),
      '@rendering': resolve(__dirname, 'src/rendering'),
      '@effects': resolve(__dirname, 'src/effects'),
      '@models': resolve(__dirname, 'src/models'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'ES2022',
    outDir: 'dist',
  },
});
