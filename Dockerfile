FROM node:20-slim

RUN npm install -g pnpm

WORKDIR /app

COPY webapp/package.json webapp/pnpm-lock.yaml* ./webapp/
COPY backend/package.json backend/pnpm-lock.yaml* ./backend/
COPY package.json pnpm-lock.yaml* ./

RUN cd webapp && pnpm install --frozen-lockfile
RUN cd backend && pnpm install --frozen-lockfile

COPY . .

RUN cd webapp && pnpm build
RUN cd backend && pnpm prisma generate && pnpm build

EXPOSE 3000

# Без миграций здесь!
CMD ["node", "backend/dist/src/main.js"]