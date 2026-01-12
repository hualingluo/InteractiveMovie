
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base:'./',
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3002',
            changeOrigin: true,
            secure: false,
          },
          '/download': {
            target: 'http://localhost:3002',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.API_BASE_URL': JSON.stringify(env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com'),
        'process.env.AUTH_TOKEN': JSON.stringify(env.GEMINI_PROXY_AUTH_TOKEN || ''),
        'process.env.IMAGE_API_KEY': JSON.stringify(env.IMAGE_API_KEY || env.GEMINI_API_KEY),
        'process.env.IMAGE_API_BASE_URL': JSON.stringify(env.IMAGE_API_BASE_URL || env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com'),
        'process.env.VIDEO_API_KEY': JSON.stringify(env.VIDEO_API_KEY || env.GEMINI_API_KEY),
        'process.env.VIDEO_API_BASE_URL': JSON.stringify(env.VIDEO_API_BASE_URL || env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com'),
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});
