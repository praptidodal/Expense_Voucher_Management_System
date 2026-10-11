import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config/env'
import { prisma } from '../db/prisma'
import { JwtPayload } from '../types/auth'

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Email and password must be provided as non-empty strings',
    })
    return
  }

  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || password.length === 0) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Email and password cannot be empty',
    })
    return
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      // Return uniform message to avoid revealing account existence
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      })
      return
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)

    if (!isMatch) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      })
      return
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    })

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    })
  } catch (error) {
    console.error('[Auth] Error processing login:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing authentication',
    })
  }
}

export const getMe = (req: Request, res: Response): void => {
  res.status(200).json({
    user: req.user,
  })
}
