import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { config } from './config/env'
import { healthRouter } from './routes/health'
import { authRouter } from './routes/auth'
import { voucherRouter } from './routes/voucher'
import { notFoundHandler, errorHandler } from './middleware/errorHandler'

export const createApp = (): Application => {
  const app = express()

  // Basic security headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    next()
  })

  // CORS configuration for Vite frontend
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl) or allowed origins
        if (
          !origin ||
          config.corsOrigins.includes(origin) ||
          config.corsOrigins.includes('*') ||
          (config.nodeEnv !== 'production' &&
            /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
        ) {
          callback(null, true)
        } else {
          callback(null, false)
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )

  // Body parsers
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Base API routes
  app.use('/api', healthRouter)
  app.use('/api', authRouter)
  app.use('/api', voucherRouter)

  // Unmatched route handling
  app.use(notFoundHandler)

  // Centralized error handler
  app.use(errorHandler)

  return app
}
