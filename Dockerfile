FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

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

CMD ["node", "/app/backend/dist/src/main.js"]
