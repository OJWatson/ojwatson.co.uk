import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist/helper',
    emptyOutDir: false,
    rollupOptions: {
      input: { popup: resolve('extension/popup.ts'), background: resolve('extension/background.ts') },
      output: { entryFileNames: '[name].js', chunkFileNames: 'assets/[name]-[hash].js' },
    },
  },
});
