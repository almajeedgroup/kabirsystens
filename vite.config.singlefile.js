import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Produces a single self-contained dist/index.html with all JS, CSS and
// fonts inlined — used to publish a shareable preview link (Artifact).
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  // The shareable preview stays in local mode (no Firebase network calls).
  define: {
    __FORCE_LOCAL_MODE__: 'true',
  },
  build: {
    outDir: 'dist-single',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
});
