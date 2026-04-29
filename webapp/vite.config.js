import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        // В режиме разработки /api/* проксируется на NestJS, чтобы не настраивать CORS вручную.
<<<<<<< HEAD
=======
        host: true, // слушать на 0.0.0.0, чтобы был доступ с телефона в одной сети
>>>>>>> 72eb8ab8b43c93ea2ee0e32fc7d8138c1b245e89
        proxy: {
            '/api': 'http://localhost:3000',
        },
    },
});
