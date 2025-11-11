import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/hf': {
        target: 'https://router.huggingface.co',
        changeOrigin: true,
        rewrite: (path) => {
          // تبدیل /api/hf/models/... به /hf-inference/models/...
          return path.replace(/^\/api\/hf/, '/hf-inference');
        },
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // خواندن token از header مخصوص که از client ارسال می‌شود
            const token = req.headers['x-hf-token'];
            if (token) {
              proxyReq.setHeader('Authorization', `Bearer ${token}`);
              // حذف header موقت که نباید به سرور اصلی ارسال شود
              proxyReq.removeHeader('x-hf-token');
            }
          });
        },
      },
    },
  },
})