# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .

RUN npm run build

# Stage 2: nginx
FROM nginx:1.27-alpine
# Готовые статика/бандлы:
COPY --from=build /app/dist /usr/share/nginx/html  2>/dev/null || true
COPY --from=build /app/build /usr/share/nginx/html 2>/dev/null || true
# Сертификаты и конфиг монтируются volume-ами из docker-compose
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
