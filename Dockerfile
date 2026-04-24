FROM node:20-alpine

WORKDIR /app

COPY apps/backend/package*.json ./apps/backend/

RUN cd apps/backend && npm install

COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

RUN npx prisma generate && npm run build

ENV NODE_ENV=production

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]