import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve('index.html'),
        record: resolve('src/record.ts'),
      },
      output: {
        entryFileNames: chunk => chunk.name === 'record' ? 'record.js' : 'assets/[name]-[hash].js',
      },
    },
  },
  server: { proxy: { '/api': 'http://127.0.0.1:8788' } },
});
