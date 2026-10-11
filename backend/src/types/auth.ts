import { Role } from '@prisma/client'

export interface JwtPayload {
  userId: string
  email: string
  role: Role
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  department: string | null
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}
