# Giai đoạn 1: Build ứng dụng
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# Giai đoạn 2: Khởi chạy môi trường Production
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Chạy tự động đồng bộ database và bật server
CMD ["sh", "-c", "npx prisma db push && node dist/main"]