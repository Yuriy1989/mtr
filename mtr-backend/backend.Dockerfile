FROM node:20-alpine

WORKDIR /app

# Установим OS-пакеты для сборки и OpenSSL (если понадобятся)
RUN apk add --no-cache python3 make g++ openssl

# Копируем пакеты и ставим зависимости
COPY mtr-backend/package*.json ./
RUN npm ci

# Копируем исходники и pm2 конфиг
COPY mtr-backend/ ./

# Билдим backend (если требуется)
RUN npm run build || true

# Папка для сертификатов (будем монтировать)
RUN mkdir -p /app/certs

# PM2 для прод
RUN npm i -g pm2

EXPOSE 3001

# Запуск через PM2 runtime, чтобы использовать ecosystem.config.js
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--only", "backend"]
