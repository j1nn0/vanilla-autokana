import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'AutoKana',
      fileName: (format) => {
        return format === 'es' ? 'autokana.js' : `autokana.${format}.js`;
      },
      formats: ['umd', 'es'],
    },
    outDir: 'dist',
  },
  resolve: {
    extensions: ['.js'],
  },
});
