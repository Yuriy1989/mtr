FROM node:20-alpine

WORKDIR /app

# Поскольку build context теперь "..", берем package.json именно из mtr-backend
COPY mtr-backend/package*.json ./
RUN npm ci --legacy-peer-deps

# Копируем исходники бэка
COPY mtr-backend ./

# Сборка NestJS
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001

# Если есть "start:prod" — используем его
CMD ["npm", "run", "start:prod"]
# иначе можно так:
# CMD ["node", "dist/main.js"]
