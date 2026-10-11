import { createApp } from './app'
import { config } from './config/env'

const app = createApp()

const server = app.listen(config.port, () => {
  console.log(`[Backend] Expense Desk API listening on port ${config.port} (${config.nodeEnv})`)
  console.log(`[Backend] Health check available at: http://localhost:${config.port}/api/health`)
})

process.on('SIGTERM', () => {
  console.log('[Backend] SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('[Backend] HTTP server closed')
  })
})
