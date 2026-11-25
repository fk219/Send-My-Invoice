import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  // Never bake an AI provider key into the client bundle. The user supplies
  // their own key in Settings; it stays in this browser's localStorage.
  define: {},
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
