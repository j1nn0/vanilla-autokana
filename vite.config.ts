import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: './tsconfig.build.json',
    }),
  ],
  build: {
    target: 'es2020',
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'AutoKana',
      fileName: (format) => {
        if (format === 'cjs') {
          return 'autokana.cjs';
        }
        return `autokana.${format}.js`;
      },
      formats: ['es', 'cjs', 'umd'],
    },
  },
});
