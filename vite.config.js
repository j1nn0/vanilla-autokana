import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'AutoKana',
      fileName: (format) => `autokana.${format}.js`,
      formats: ['umd', 'es'],
    },
  },
});
