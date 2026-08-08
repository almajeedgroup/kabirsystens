import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Normal build (dev + `npm run build` for Firebase Hosting): Firebase mode.
export default defineConfig({
  plugins: [react()],
  define: {
    __FORCE_LOCAL_MODE__: 'false',
  },
});
