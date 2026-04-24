FROM node:20-slim

RUN npm install -g pnpm

WORKDIR /app

COPY . .

# Собираем фронтенд
RUN cd webapp && pnpm install --frozen-lockfile=false && pnpm build

# Собираем бэкенд
RUN cd backend && pnpm install --frozen-lockfile=false \
  && pnpm prisma generate \
  && pnpm prisma migrate deploy \
  && pnpm build

EXPOSE 3000

CMD ["node", "backend/dist/src/main.js"]
