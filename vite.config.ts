import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { defineConfig } from 'vite';

const pluginHeader = readFileSync(resolve(__dirname, 'src/mv-plugin-header.js'), 'utf8');

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'R3DVisualStage',
      formats: ['iife'],
      fileName: () => 'R3DVisualStage.js',
    },
    minify: false,
    sourcemap: true,
    target: 'chrome61',
    rollupOptions: {
      output: {
        banner: pluginHeader,
      },
    },
  },
});
