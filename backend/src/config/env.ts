import dotenv from 'dotenv'

dotenv.config()

const rawJwtSecret = process.env.JWT_SECRET

if (process.env.NODE_ENV === 'production' && (!rawJwtSecret || rawJwtSecret.length < 16)) {
  throw new Error('FATAL: JWT_SECRET must be set and at least 16 characters in production.')
}

export const config = {
  port: parseInt(process.env.PORT || '5050', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
      ],
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: rawJwtSecret || 'prachay_dev_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
}
