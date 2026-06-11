import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(
    import.meta.url));

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico'],
            manifest: {
                name: 'NextShare',
                short_name: 'NextShare',
                description: 'URL shortener, file sharing & code paste — works offline',
                theme_color: '#0C0B0A',
                background_color: '#0C0B0A',
                display: 'standalone',
                icons: [
                    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                runtimeCaching: [{
                    urlPattern: /^https?:\/\/.*\/api\/.*/i,
                    handler: 'NetworkFirst',
                    options: {
                        cacheName: 'api-cache',
                        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
                        networkTimeoutSeconds: 4,
                    },
                }],
            },
        }),
    ],
    build: {
        rollupOptions: {
            input: {
                app: resolve(__dirname, 'app.html'),
                landing: resolve(__dirname, 'index.html'),
            },
        },
    },
    server: {
        port: 5173,
        historyApiFallback: true,
        proxy: {
            '/api': { target: 'http://localhost:3001', changeOrigin: true },
        },
    },
});