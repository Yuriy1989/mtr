# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# 1) deps
COPY mtr-frontend/package*.json ./
RUN npm ci

# 2) sources + build
COPY mtr-frontend/ ./
RUN npm run build

# 3) Нормализуем выходную папку -> /app/appbuild
#    Если есть dist — переносим её; иначе переносим build.
RUN set -eux; \
    if [ -d "dist" ]; then mv dist appbuild; \
    elif [ -d "build" ]; then mv build appbuild; \
    else echo "Neither dist/ nor build/ found after npm run build" && exit 1; \
    fi; \
    ls -la appbuild

# ---------- nginx stage ----------
FROM nginx:1.27-alpine

# Создадим директорию на всякий случай (иногда base-образ обновляют)
RUN mkdir -p /usr/share/nginx/html

# Сертификаты будем монтировать с хоста
RUN mkdir -p /etc/nginx/certs

# Конфиг nginx
COPY mtr-frontend/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

# Копируем нормализованный билд
COPY --from=build /app/appbuild/ /usr/share/nginx/html/

EXPOSE 443 80
CMD ["nginx", "-g", "daemon off;"]
