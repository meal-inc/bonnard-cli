import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      buffer: 'buffer/',
    },
  },
  build: {
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: false,
  },
});
