export default () => ({
  appName: process.env.APP_NAME || 'PaymentRequestWorkflowManagement',
  port: parseInt(process.env.APP_PORT || '3000', 10),
  env: process.env.APP_ENV || 'development',
  url: process.env.APP_URL || 'http://localhost:3000',
  database: {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'prwm_admin',
    password: process.env.DB_PASSWORD || 'prwm_dev_2026',
    database: process.env.DB_DATABASE || 'payment_request_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'prwm-jwt-secret-dev-2026-change-in-production',
    expiration: process.env.JWT_EXPIRATION || '3600s',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'prwm-refresh-secret-dev-2026-change-in-production',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  fileUpload: {
    destination: process.env.UPLOAD_DEST || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  },
  websocket: {
    port: parseInt(process.env.WS_PORT || '3001', 10),
    corsOrigin: process.env.WS_CORS_ORIGIN || 'http://localhost:5173',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
});
