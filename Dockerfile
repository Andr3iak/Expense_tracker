FROM node:20-slim

RUN npm install -g pnpm

WORKDIR /app

COPY . .

# Собираем фронтенд
RUN cd webapp && pnpm install --frozen-lockfile=false && pnpm build

# Собираем бэкенд — migrate deploy убран отсюда:
# на этапе сборки DATABASE_URL ещё недоступен (Railway подставляет его только в рантайме)
RUN cd backend && pnpm install --frozen-lockfile=false \
  && pnpm prisma generate \
  && pnpm build

EXPOSE 3000

# Миграции запускаются при старте контейнера, когда DATABASE_URL уже доступен
CMD cd /app/backend && pnpm prisma migrate deploy && node dist/src/main.js
