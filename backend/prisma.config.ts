import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    // На Railway переменная DATABASE_URL подставляется автоматически
    // при подключении PostgreSQL сервиса к приложению.
    // Локально — добавь DATABASE_URL в файл .env в папке backend/
    url: process.env.DATABASE_URL!,
  },
})
