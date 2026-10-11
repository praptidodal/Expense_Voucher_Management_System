import { Router } from 'express'
import { Role } from '@prisma/client'
import { login, getMe } from '../controllers/auth'
import { authenticateToken, requireRole } from '../middleware/auth'

export const authRouter = Router()

// Public authentication endpoint
authRouter.post('/auth/login', login)

// Authenticated user profile
authRouter.get('/auth/me', authenticateToken, getMe)

// Role-protected test routes for verifying RBAC enforcement
authRouter.get(
  '/auth/test/director',
  authenticateToken,
  requireRole(Role.DIRECTOR),
  (_req, res) => {
    res.status(200).json({ message: 'Director access authorized' })
  }
)

authRouter.get(
  '/auth/test/accounts',
  authenticateToken,
  requireRole(Role.ACCOUNTS),
  (_req, res) => {
    res.status(200).json({ message: 'Accounts access authorized' })
  }
)

authRouter.get(
  '/auth/test/employee',
  authenticateToken,
  requireRole(Role.EMPLOYEE),
  (_req, res) => {
    res.status(200).json({ message: 'Employee access authorized' })
  }
)
