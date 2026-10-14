import { defineConfig } from 'vite';
import { resolve } from 'node:path';

if (process.env.VERCEL && !process.env.VITE_API_BASE_URL?.trim()) {
  throw new Error('Configura VITE_API_BASE_URL en las variables del proyecto Vercel.');
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        terminos: resolve(__dirname, 'terminos.html'),
      },
    },
  },
});
