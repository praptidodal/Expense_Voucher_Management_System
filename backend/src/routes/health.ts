import { Router, Request, Response } from 'express'

export const healthRouter = Router()

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'prachay-expense-voucher-backend',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  })
})
