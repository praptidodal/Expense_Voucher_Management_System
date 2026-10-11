import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'
import { config } from '../config/env'
import { prisma } from '../db/prisma'
import { JwtPayload } from '../types/auth'

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined

  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ')
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1]
    } else {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format. Expected: Bearer <token>',
      })
      return
    }
  } else if (typeof req.query.token === 'string' && req.query.token.trim()) {
    token = req.query.token.trim()
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is required',
    })
    return
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    })

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User account not found or deactivated',
      })
      return
    }

    req.user = user
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token has expired',
      })
      return
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token',
    })
  }
}

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication is required',
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Role '${req.user.role}' is not authorized for this action`,
      })
      return
    }

    next()
  }
}
