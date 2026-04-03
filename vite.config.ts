import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'ui': path.resolve(__dirname, '../../packages/ui/src'),
      'animations': path.resolve(__dirname, '../../packages/animations/src'),
      'supabase-client': path.resolve(__dirname, '../../packages/supabase-client/src'),
      'shared-utils': path.resolve(__dirname, '../../packages/shared-utils/src'),
    },
  },
  server: {
    port: 5176,
    open: true,
  },
});
