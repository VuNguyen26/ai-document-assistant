FROM node:22-alpine AS build

WORKDIR /app/apps/backend

RUN apk add --no-cache openssl

COPY apps/backend/package*.json ./
RUN npm ci

COPY apps/backend ./

RUN npx prisma generate
RUN npm run build


FROM node:22-alpine AS runtime

WORKDIR /app/apps/backend

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY apps/backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/apps/backend/prisma ./prisma
RUN npx prisma generate

COPY --from=build /app/apps/backend/dist ./dist

USER node

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
