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
  activeDirectory: {
    enabled: process.env.AD_ENABLED === 'true',
    url: process.env.AD_URL,
    domain: process.env.AD_DOMAIN,
    baseDn: process.env.AD_BASE_DN,
    userDnTemplate: process.env.AD_USER_DN_TEMPLATE,
    timeout: parseInt(process.env.AD_TIMEOUT_MS, 10) || 5000,
  },
});
