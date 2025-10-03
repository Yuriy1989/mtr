export default () => ({
  server: {
    port: parseInt(process.env.PORT, 10) || 3001,
  },
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    user: process.env.DATABASE_USERNAME || 'admin',
    password: process.env.DATABASE_PASSWORD || 'Qwerty@123',
    name: process.env.DATABASE_NAME || 'mtr_project',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret', // access
    refreshSecret: process.env.JWT_REFRESH_SECRET, // refresh
    ttl: process.env.JWT_TTL || '900s', // 15 мин (пример)
    refreshTtl: process.env.JWT_REFRESH_TTL || '30d', // 30 дней
  },
});
