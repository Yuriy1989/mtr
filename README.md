# MTR – Управление движением МТР и транспортными заявками

Веб-приложение для автоматизации работы с МТР (материально-техническими ресурсами), служебными записками, приложениями и транспортными заявками.  
Проект состоит из **frontend** (React + Ant Design) и **backend** (NestJS + TypeORM + PostgreSQL).

---

## 🚀 Возможности
- Управление служебными записками (создание, редактирование, просмотр)
- Работа с Приложением №3 (создание, отправка, формирование транспортных заявок)
- Последняя миля (приемка и реестр)
- Журнал аудита действий
- Справочники: пользователи, склады, отделы, филиалы, регионы, объекты, единицы измерения
- Система ролей и прав доступа (администратор, ПДО, руководитель, работник склада и др.)
- Отчёты и сводная аналитика

---

## 🛠️ Технологии

### Frontend
- [React](https://reactjs.org/)
- [Ant Design](https://ant.design/)
- Redux
- React Router

### Backend
- [NestJS](https://nestjs.com/)
- [TypeORM](https://typeorm.io/)
- PostgreSQL
- JWT авторизация
- REST API

---

## 📦 Установка и запуск

### 1. Клонирование репозитория
```bash
git clone https://github.com/Yuriy1989/mtr.git
cd mtr
```

### 2. Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```
По умолчанию сервер поднимается на `http://localhost:3001`

> ⚠️ Не забудьте настроить `.env` с параметрами подключения к PostgreSQL.

### 3. Frontend (React)
```bash
cd frontend
npm install
npm start
```
Приложение будет доступно на `http://localhost:3000` (или другом свободном порту).

---

## 🔑 Переменные окружения

### Backend (`.env`)
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=mtr
JWT_SECRET=super_secret_key
```

### Frontend (`.env`)
```env
REACT_APP_API_URL=http://localhost:3000
```

---

## 📖 Скрипты

### Backend
- `npm run start` – запуск
- `npm run start:dev` – запуск в dev-режиме
- `npm run build` – сборка

### Frontend
- `npm start` – запуск dev-сервера
- `npm run build` – сборка
- `npm run lint` – проверка кода

## Обязательно для работы по https
- Сгенерировать самоподписывающийся сертификат (сертификаты должны быть такие же как я для backend) или использовать сертификаты центра сертификации.
- Создать папку в корне проекта certs, положить туда сертификат и ключ, в файле .env.local в случае необходимости исправить имена сертификата и ключа.

---

## 📝 Лицензия
Проект распространяется под свободной лицензией.

